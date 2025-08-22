const axios = require('axios');
const cheerio = require('cheerio');
const ScrapedSite = require('../Models/ScrapedSite');
const ScrapedGameSite = require('../Models/ScrapedGameSite');
const ScrapedDatingSite = require('../Models/ScrapedDatingSite');

function extractData(html, $) {
  return {
    h1: $('h1').map((_, el) => $(el).text().trim()).get(),
    h2: $('h2').map((_, el) => $(el).text().trim()).get(),
    images: $('img').map((_, el) => $(el).attr('src')).get(),
    altTags: $('img').map((_, el) => $(el).attr('alt') || '').get(),
    canonicals: $('link[rel="canonical"]').map((_, el) => $(el).attr('href')).get(),
    title: $('title').text().trim(),
    description: $('meta[name="description"]').attr('content') || '',
    wordCount: $('body').text().split(/\s+/).filter(Boolean).length,
    schemaPresent: $('script[type="application/ld+json"]').length > 0
  };
}

// helper to retry axios requests
async function fetchWithRetry(url, options, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await axios.get(url, options);
    } catch (err) {
      if (i === retries) throw err;
      await new Promise(r => setTimeout(r, 1000 * (i + 1))); // backoff
    }
  }
}

async function processSite(model, site, label) {
  const baseUrl = `https://${site.domain}`;
  try {
    const [mainRes, orderHtmlRes, orderRes, robotsRes] = await Promise.allSettled([
      fetchWithRetry(baseUrl, {
        timeout: 7000,
        headers: { 'User-Agent': 'Mozilla/5.0' },
        validateStatus: () => true
      }),
      fetchWithRetry(`${baseUrl}/order.html`, { timeout: 4000, validateStatus: () => true }),
      fetchWithRetry(`${baseUrl}/order`, { timeout: 4000, validateStatus: () => true }),
      fetchWithRetry(`${baseUrl}/robots.txt`, { timeout: 3000, validateStatus: () => true }),
    ]);

    if (mainRes.status !== 'fulfilled' || mainRes.value.status >= 500) return false;

    const html = mainRes.value.data;
    const $ = cheerio.load(html);
    const newData = extractData(html, $);
    const statusCode = mainRes.value.status;

    // robots.txt
    let robotsTxt = 'Not Found';
    if (robotsRes.status === 'fulfilled' && robotsRes.value.status < 400) {
      robotsTxt = robotsRes.value.data;
    }

    // affiliate link
    let affiliateLink = null;
    for (const result of [orderHtmlRes, orderRes]) {
      if (result.status === 'fulfilled' && result.value.status < 400) {
        const $$ = cheerio.load(result.value.data);

        const meta = $$('meta[http-equiv="refresh"]').attr('content');
        const metaMatch = meta?.match(/url=["']?(https?:\/\/[^"']+)/i);
        if (metaMatch) { affiliateLink = metaMatch[1]; break; }

        const scripts = $$('script').toArray();
        for (const script of scripts) {
          const js = $$(script).html();
          const match = js?.match(/window\.location\.href\s*=\s*['"](https?:\/\/[^'"]+)['"]/i);
          if (match) { affiliateLink = match[1]; break; }
        }
        if (affiliateLink) break;
      }
    }

    // check for empty sites
    const isEmptySite =
      (!site.title || site.title.trim() === '') &&
      (!site.description || site.description.trim() === '') &&
      (!site.h1 || site.h1.length === 0) &&
      (!site.h2 || site.h2.length === 0) &&
      (!site.images || site.images.length === 0);

    // compare fields
    const fieldsToCompare = [
      'title', 'description', 'wordCount', 'schemaPresent', 'robotsTxt',
      'affiliateLink', 'statusCode'
    ];

    let changed = false;
    for (const field of fieldsToCompare) {
      const current = site[field];
      const updatedValue = field === 'statusCode' ? statusCode
        : field === 'robotsTxt' ? robotsTxt
        : field === 'affiliateLink' ? affiliateLink
        : newData[field];
      if (current !== updatedValue) {
        changed = true;
        break;
      }
    }

    // compare arrays
    if (!changed && (
      JSON.stringify(site.h1) !== JSON.stringify(newData.h1) ||
      JSON.stringify(site.h2) !== JSON.stringify(newData.h2) ||
      JSON.stringify(site.images) !== JSON.stringify(newData.images) ||
      JSON.stringify(site.altTags) !== JSON.stringify(newData.altTags) ||
      JSON.stringify(site.canonicals) !== JSON.stringify(newData.canonicals)
    )) {
      changed = true;
    }

    if (changed || isEmptySite) {
      await model.findByIdAndUpdate(site._id, {
        ...newData,
        robotsTxt,
        statusCode,
        affiliateLink,
        lastChecked: new Date()
      });
      return true;
    }

    return false;
  } catch (err) {
    console.error(`Error processing ${label} domain ${site.domain}:`, err.message);
    return false;
  }
}

exports.updateChangedDomains = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { user: req.user._id };
    const models = [
      { model: ScrapedSite, label: 'main' },
      { model: ScrapedGameSite, label: 'game' },
      { model: ScrapedDatingSite, label: 'dating' }
    ];

    let totalUpdated = 0;
    const BATCH_SIZE = 10; // process 10 domains in parallel

    for (const { model, label } of models) {
      const allDomains = await model.find(filter);

      for (let i = 0; i < allDomains.length; i += BATCH_SIZE) {
        const batch = allDomains.slice(i, i + BATCH_SIZE);
        const results = await Promise.all(batch.map(site => processSite(model, site, label)));
        totalUpdated += results.filter(Boolean).length;
      }
    }

    res.json({ message: 'All domain models checked and updated', updated: totalUpdated });
  } catch (err) {
    console.error('Update function failed:', err.message);
    res.status(500).json({ error: 'Update failed' });
  }
};
