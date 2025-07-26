
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const UserAgent = require('user-agents');

puppeteer.use(StealthPlugin());

const checkBingIndex = async (req, res) => {
  // 1. Ensure user is logged in
  if (!req.user || !req.user._id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 2. Filter domains by role
  const filter = req.user.role === 'admin' ? {} : { user: req.user._id };
  const domains = await ScrapedSite.find(filter, 'domain');

  const domainList = domains.map(site => site.domain);
  const unindexed = [];
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    for (const fullUrl of domainList) {
      let domain;
      try {
         domain = fullUrl.startsWith('http') ? new URL(fullUrl).hostname : fullUrl;
      } catch {
        continue;
      }

      const page = await browser.newPage();
      const userAgent = new UserAgent().toString();
      const bingQueryUrl = `https://www.bing.com/search?q=site:${domain}`;

      await page.setUserAgent(userAgent);
      await page.setViewport({ width: 1280, height: 800 });

      try {
        await page.goto(bingQueryUrl, {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        });
   // Simulate human behavior
        await page.mouse.move(200, 200);
        await page.evaluate(() => window.scrollBy(0, window.innerHeight / 2));
        await new Promise(resolve => setTimeout(resolve, 2000));

        // CAPTCHA Detection
        const isCaptcha = await page.evaluate(() => !!document.querySelector('#b_captcha'));
        if (isCaptcha) {
          console.warn(`🚫 CAPTCHA for ${domain}`);
          continue;
        }

        const isIndexed = await page.evaluate(() => {
          const results = Array.from(document.querySelectorAll('li.b_algo'));
          const noResultsText = document.querySelector('.b_no')?.innerText?.toLowerCase() || '';
          const visibleResults = results.filter(r => r.offsetParent !== null);
          return visibleResults.length > 0 && !noResultsText.includes('did not match any documents');
        });

        if (!isIndexed) {
          unindexed.push(fullUrl);
        }
      } catch (err) {
        console.warn(`❌ Error checking ${domain}:`, err.message);
        continue;
      } finally {
        await page.close();
      }
    }

    return res.json({ unindexed });

  } catch (err) {
    console.error('❌ Error launching Puppeteer:', err.message);
    res.status(500).json({ error: 'Server error' });
  } finally {
    if (browser) await browser.close();
  }
};


module.exports = checkBingIndex;