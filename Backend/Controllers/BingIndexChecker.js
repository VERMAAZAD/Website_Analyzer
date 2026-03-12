const ScrapedSite = require('../Models/ScrapedSite');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const UserAgent = require('user-agents');
const pLimit = require("p-limit").default;
const HttpProxyAgent = require('http-proxy-agent');
const HttpsProxyAgent = require('https-proxy-agent');

puppeteer.use(StealthPlugin());

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Random delay between min and max milliseconds
const randomDelay = (min = 1000, max = 3000) => 
  sleep(min + Math.random() * (max - min));

const safeClose = async (page) => {
  if (!page) return;
  try {
    if (!page.isClosed && typeof page.isClosed === 'function') {
      if (!(await page.isClosed())) {
        await page.close({ runBeforeUnload: false });
      }
    } else {
      await page.close({ runBeforeUnload: false });
    }
  } catch (err) {
    const msg = err.message || '';
    if (!msg.includes('No target with given id') && !msg.includes('Session closed')) {
      console.warn(`⚠️ safeClose error: ${msg}`);
    }
  }
};

// Rotate through realistic user agents
const getUserAgent = () => {
  const agents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  ];
  return agents[Math.floor(Math.random() * agents.length)];
};

async function detectBingIndex(page, cleanDomain) {
  return page.evaluate((domain) => {
    try {
      const bodyText = document.body.innerText.toLowerCase();

      const noResultPhrases = [
        'there are no results for',
        'did not match any documents',
        'no results found for',
        'we didn\'t find any results',
        'no results containing',
        'no web pages',
        'did not match any results',
        'no results for',
      ];

      if (noResultPhrases.some(phrase => bodyText.includes(phrase))) {
        return { indexed: false, firstResult: null, resultCount: 0 };
      }

      // Get result links from multiple possible selectors
      const anchors = Array.from(
        document.querySelectorAll(
          'li.b_algo h2 a, ' +
          '.b_title a, ' +
          '.b_algoheader h2 a, ' +
          'h2 > a, ' +
          '.b_attribution a, ' +
          'a[href*="http"]:not([href*="bing.com"])'
        )
      );

      const links = anchors
        .map(el => el.href)
        .filter(href => 
          href && 
          !href.includes('bing.com') && 
          !href.includes('/images/') && 
          !href.includes('microsoft.com') &&
          !href.includes('r.bing.com')
        )
        .map(href => {
          try {
            const url = new URL(href);
            return url.hostname + url.pathname;
          } catch (e) {
            return null;
          }
        })
        .filter(Boolean);

      const uniqueLinks = Array.from(new Set(links));
      const firstResult = uniqueLinks.length > 0 ? uniqueLinks[0] : null;

      return { 
        indexed: uniqueLinks.length > 0, 
        firstResult, 
        resultCount: uniqueLinks.length 
      };
    } catch (e) {
      return { indexed: false, firstResult: null, resultCount: 0 };
    }
  }, cleanDomain);
}

const retryCheck = async (
  fullUrl, 
  browser, 
  retries = 3, 
  delayBetweenRetries = 8000
) => {
  const cleanDomain = fullUrl
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*$/, '')
    .trim();

  if (!cleanDomain || cleanDomain === 'about:blank') {
    console.warn(`⚠️ Invalid domain skipped: ${fullUrl}`);
    return { isBlocked: false, isIndexed: false, firstResult: null, resultCount: 0 };
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    let page = null;
    try {
      console.log(`\n🔍 [${cleanDomain}] Checking (Attempt ${attempt}/${retries})`);
      
      page = await browser.newPage();

      // Set realistic headers
      const userAgent = getUserAgent();
      await page.setUserAgent(userAgent);
      
      await page.setViewport({
        width: 1280 + Math.floor(Math.random() * 240),
        height: 720 + Math.floor(Math.random() * 180),
      });

      // Set extra headers to look more human-like
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Upgrade-Insecure-Requests': '1',
        'DNT': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0'
      });

      // Add request interception to block tracking/ads
      await page.setRequestInterception(true);
      page.on('request', (request) => {
        const url = request.url();
        if (
          url.includes('google-analytics') ||
          url.includes('analytics.js') ||
          url.includes('doubleclick.net') ||
          url.includes('.jpg') ||
          url.includes('.png') ||
          url.includes('.gif')
        ) {
          request.abort();
        } else {
          request.continue();
        }
      });

      page.on('console', msg => 
        console.log(`🧠 [${cleanDomain}] console: ${msg.text()}`)
      );
      page.on('pageerror', err => 
        console.error(`❗ [${cleanDomain}] JS error: ${err.message}`)
      );

      const bingQueryUrl = `https://www.bing.com/search?q=site:${encodeURIComponent(cleanDomain)}`;
      console.log(`🌐 Navigating to: ${bingQueryUrl}`);

      const response = await page.goto(bingQueryUrl, {
        waitUntil: 'networkidle2',
        timeout: 120_000
      });

      if (!response || !response.ok()) {
        const status = response ? response.status() : 'no response';
        console.warn(`⚠️ [${cleanDomain}] Bing response not OK: ${status}`);
        await safeClose(page);
        
        if (attempt < retries) {
          const waitTime = delayBetweenRetries * (attempt + 1);
          console.log(`⏳ Waiting ${waitTime}ms before retry...`);
          await sleep(waitTime);
          continue;
        }
        return { isBlocked: false, isIndexed: false, firstResult: null, resultCount: 0 };
      }

      // Wait for Turnstile to potentially resolve
      await sleep(3000);

      // Early block detection
      const earlyBlock = await page.evaluate(() => {
        const text = document.body.innerText.toLowerCase();
        const html = document.documentElement.outerHTML.toLowerCase();

        return (
          text.includes('one last step') ||
          text.includes('solve the challenge') ||
          text.includes('verify you are') ||
          text.includes('unusual activity') ||
          text.includes('cloudflare') ||
          html.includes('challenges.cloudflare.com') ||
          (text.length < 1000 && text.includes('please wait'))
        );
      });

      if (earlyBlock) {
        console.warn(`🚫 [${cleanDomain}] Blocked by Cloudflare/Bing`);
        await safeClose(page);
        return {
          isBlocked: true,
          isIndexed: false,
          firstResult: null,
          resultCount: 0
        };
      }

      // Wait for results to load
      try {
        await Promise.race([
          page.waitForSelector('li.b_algo h2 a, .b_title a, a[href*="http"]', { 
            timeout: 20000,
            visible: true 
          }),
          page.waitForFunction(
            () => {
              const text = document.body.innerText.toLowerCase();
              return text.includes('no results for') || 
                     text.includes('did not match any documents') ||
                     text.includes('no results containing');
            },
            { timeout: 20000 }
          )
        ]);
      } catch (e) {
        console.log(`⏳ [${cleanDomain}] Timeout waiting for results, continuing anyway...`);
      }

      // Extra wait for JS to render
      await sleep(2000);

      // Detect index status
      const { indexed, firstResult, resultCount } = await detectBingIndex(page, cleanDomain);
      
      if (indexed) {
        console.log(`✅ [${cleanDomain}] Indexed — first result: ${firstResult}, count: ${resultCount}`);
      } else {
        console.log(`ℹ️ [${cleanDomain}] Not indexed — count: ${resultCount}`);
      }

      await safeClose(page);
      return { isBlocked: false, isIndexed: indexed, firstResult, resultCount };

    } catch (err) {
      console.warn(`❌ [${cleanDomain}] Error on attempt ${attempt}: ${err.message}`);
      if (page) {
        await safeClose(page);
      }

      if (attempt < retries) {
        const waitTime = delayBetweenRetries * (attempt + 1);
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await sleep(waitTime);
      }
    }
  }

  console.error(`❌ [${cleanDomain}] All ${retries} attempts failed`);
  return { isBlocked: false, isIndexed: false, firstResult: null, resultCount: 0 };
};

exports.checkBingIndex = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);

    let baseFilter;
    if (req.user.role === "admin") {
      baseFilter = {};
    } else if (req.user.parentUser) {
      baseFilter = { user: req.user.parentUser };
    } else {
      baseFilter = { user: req.user._id };
    }

    const forceCheck = req.query.force === 'true';
    const filter = forceCheck
      ? baseFilter
      : {
          ...baseFilter,
          $or: [
            { lastBingCheck: { $exists: false } },
            { lastBingCheck: { $lt: startOfToday } }
          ]
        };

    const domains = await ScrapedSite.find(filter, 'domain');
    console.log(`🧾 Domains to check: ${domains.length}`);

    if (!domains.length) {
      return res.json({ message: 'No domains to check today.' });
    }

    const browser = await puppeteer.launch({
      headless: 'new', // Use new headless mode (more undetectable)
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--disable-blink-features=ChromeHeadless',
        '--lang=en-US,en',
        '--start-maximized',
        '--disable-plugins',
        '--disable-extensions',
        '--disable-sync',
      ]
    });

    // Use 1 concurrent connection to avoid rate limiting
    const limit = pLimit(1);
    const unindexed = [];
    const checkedToday = [];
    const blocked = [];

    const tasks = domains.map((d) =>
      limit(async () => {
        const domain = d.domain;
        const { isBlocked, isIndexed, firstResult, resultCount } = await retryCheck(
          domain,
          browser,
          3,
          12000 // Increased delay between retries
        );

        if (!isBlocked) {
          const site = await ScrapedSite.findOne({ domain });
          if (site) {
            site.isIndexedOnBing = isIndexed;
            site.lastBingCheck = new Date();
            site.bingFirstResult = firstResult;
            site.bingResultCount = resultCount;
            await site.save();
          }

          if (!isIndexed) {
            unindexed.push(domain);
          }
          checkedToday.push(domain);
        } else {
          blocked.push(domain);
          console.log(`🛑 [${domain}] Blocked - will retry later`);
        }

        // Random delay between checks to avoid patterns
        await randomDelay(3000, 8000);
      })
    );

    await Promise.all(tasks);

    try {
      await browser.close();
    } catch (e) {
      console.warn('⚠️ Browser close error:', e.message);
    }

    console.log(`✅ Done! Checked: ${checkedToday.length}, Unindexed: ${unindexed.length}, Blocked: ${blocked.length}`);
    return res.json({
      success: true,
      checked: checkedToday.length,
      unindexedCount: unindexed.length,
      blockedCount: blocked.length,
      unindexed,
      blocked
    });

  } catch (err) {
    console.error('❌ checkBingIndex error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
};