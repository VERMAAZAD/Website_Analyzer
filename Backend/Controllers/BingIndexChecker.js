
const ScrapedSite = require('../Models/ScrapedSite');
 const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const UserAgent = require('user-agents');
const pLimit = require("p-limit").default;

puppeteer.use(StealthPlugin());

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

async function detectBingIndex(page, cleanDomain) {
  return page.evaluate((domain) => {
    try {
      // Dismiss cookie / consent if present
      const consentBtn = Array.from(document.querySelectorAll('button, input[type="submit"], a'))
        .find(el => /accept|agree|consent|ok/i.test(el.textContent || ''));
      if (consentBtn) {
        try { consentBtn.click(); } catch (e) { /* ignore */ }
      }

      const bodyText = document.body.innerText.toLowerCase();

      const noResultPhrases = [
        'there are no results for',
        'did not match any documents',
        'no results found for',
        'we didn’t find any results',
        'no results containing',
        'no web pages',
        'did not match any results',
        'no results for',
      ];
      if (noResultPhrases.some(phrase => bodyText.includes(phrase))) {
        return { indexed: false, firstResult: null, resultCount: 0 };
      }

      // Extract organic result links
      const anchors = Array.from(
        document.querySelectorAll('li.b_algo h2 a, .b_title a, .b_algoheader h2 a, h2 > a, .b_attribution a')
      );

      const links = anchors
        .map(el => el.href)
        .filter(href => href && !href.includes('bing.com') && !href.includes('/images/') && !href.includes('microsoft.com'))
        .map(href => {
          try {
            return (new URL(href)).hostname + (new URL(href)).pathname;
          } catch (e) {
            return href;
          }
        });

      const uniqueLinks = Array.from(new Set(links));

      const firstResult = uniqueLinks.length > 0 ? uniqueLinks[0] : null;
      return { indexed: uniqueLinks.length > 0, firstResult, resultCount: uniqueLinks.length };
    } catch (e) {
      return { indexed: false, firstResult: null, resultCount: 0 };
    }
  }, cleanDomain);
}

const retryCheck = async (fullUrl, browser, retries = 3, delayBetweenRetries = 5000) => {
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

      await page.setUserAgent(new UserAgent().toString());
      await page.setViewport({
        width: 1000 + Math.floor(Math.random() * 400),
        height: 700 + Math.floor(Math.random() * 300),
      });

      page.on('console', msg => console.log(`🧠 [${cleanDomain}] console: ${msg.text()}`));
      page.on('pageerror', err => console.error(`❗ [${cleanDomain}] JS error: ${err.message}`));

      const bingQueryUrl = `https://www.bing.com/search?q=site:${encodeURIComponent(cleanDomain)}`;
      console.log(`🌐 Navigating to: ${bingQueryUrl}`);

      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
      );

      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Upgrade-Insecure-Requests': '1',
        'DNT': '1',
      });

      const response = await page.goto(bingQueryUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 90_000
      });

       if (!response || !response.ok()) {
        console.warn(`⚠️ [${cleanDomain}] Bing response not OK: ${response ? response.status() : 'no response'}`);
        await safeClose(page);
        if (attempt < retries) {
          await sleep(delayBetweenRetries);
          continue;
        }
        return { isBlocked: false, isIndexed: false, firstResult: null, resultCount: 0 };
      }

      // 🚫 EARLY BLOCK DETECTION (critical)
        const earlyBlock = await page.evaluate(() => {
        const text = document.body.innerText.toLowerCase();

        return (
            text.includes('one last step') ||
            text.includes('solve the challenge') ||
            text.includes('verify you are') ||
            text.includes('unusual activity') ||
            text.length < 800 // REAL SERP pages are huge
        );
        });

        if (earlyBlock) {
        console.warn(`🚫 [${cleanDomain}] Blocked early (Turnstile shell page)`);
        await safeClose(page);
        return {
            isBlocked: true,
            isIndexed: false,
            firstResult: null,
            resultCount: 0
        };
        }

      // Detect Turnstile CAPTCHA iframe (Cloudflare)
      const turnstileCaptcha = await page.$('iframe[src*="challenges.cloudflare.com/turnstile"]');

      if (turnstileCaptcha) {
  console.warn(`🚫 Turnstile detected — skipping`);
  await safeClose(page);
  return {
    isBlocked: true,
    isIndexed: false,
    firstResult: null,
    resultCount: 0
  };
}

      // Wait for results or no-result indicator
      try {
        await Promise.race([
          page.waitForSelector('li.b_algo h2 a, .b_title a', { timeout: 15000 }),
          page.waitForFunction(
            () => document.body.innerText.toLowerCase().includes('no results for') ||
              document.body.innerText.toLowerCase().includes('did not match any documents'),
            { timeout: 15000 }
          )
        ]);
      } catch (e) {
        console.log(`⏳ [${cleanDomain}] waiting additional time...`);
        await sleep(7000);
      }

      // Detect index status
      const { indexed, firstResult, resultCount } = await detectBingIndex(page, cleanDomain);
      if (indexed) {
        console.log(`✅ [${cleanDomain}] Indexed — first result: ${firstResult}, count: ${resultCount}`);
      } else {
        console.log(`ℹ️ [${cleanDomain}] Not indexed — found count: ${resultCount}`);
      }
      await safeClose(page);
      return { isBlocked: false, isIndexed: indexed, firstResult, resultCount };

    } catch (err) {
      console.warn(`❌ [${cleanDomain}] Error on attempt ${attempt}: ${err.message}`);
      if (page) {
        await safeClose(page);
      }
      if (attempt < retries) {
        console.log(`⏳ [${cleanDomain}] Retrying after ${delayBetweenRetries}ms`);
        await sleep(delayBetweenRetries);
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
      headless: false, // so you can see the browser and manually solve if needed
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--lang=en-US,en'
      ]
    });

    const limit = pLimit(2); // concurrency limit
    const unindexed = [];
    const checkedToday = [];

    const tasks = domains.map(d =>
      limit(async () => {
        const domain = d.domain;
        const { isBlocked, isIndexed, firstResult, resultCount } = await retryCheck(domain, browser, 3);

        if (!isBlocked) {
          const site = await ScrapedSite.findOne({ domain });
          if (site) {
            site.isIndexedOnBing = isIndexed;
            site.lastBingCheck = new Date();
            site.bingFirstResult = firstResult;
            site.bingResultCount = resultCount;
            await site.save();
          }
          if (!isIndexed) unindexed.push(domain);
          checkedToday.push(domain);
        } else {
          console.log(`🛑 [${domain}] Skipped saving due to block`);
        }
      })
    );

    await Promise.all(tasks);

    try {
      await browser.close();
    } catch (e) {
      console.warn('⚠️ Browser close error:', e.message);
    }

    console.log(`✅ Done! Checked: ${checkedToday.length}, Unindexed: ${unindexed.length}`);
    return res.json({
      success: true,
      checked: checkedToday.length,
      unindexedCount: unindexed.length,
      unindexed
    });

  } catch (err) {
    console.error('❌ checkBingIndex error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
};
