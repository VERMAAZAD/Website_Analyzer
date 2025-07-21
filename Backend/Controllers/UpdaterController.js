
const axios = require('axios');
const cheerio = require('cheerio');
const ScrapedSite = require('../Models/ScrapedSite');

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

exports.updateChangedDomains = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { user: req.user._id };
    const allDomains = await ScrapedSite.find(filter);

    let updated = 0;

    for (const site of allDomains) {
      const baseUrl = `https://${site.domain}`;

      try {
        // Request main HTML and optional paths
        const [mainRes, orderHtmlRes, orderRes, robotsRes] = await Promise.allSettled([
          axios.get(baseUrl, {
            timeout: 7000,
            headers: {
              'User-Agent': 'Mozilla/5.0'
            },
            validateStatus: () => true
          }),
          axios.get(`${baseUrl}/order.html`, { timeout: 4000, validateStatus: () => true }),
          axios.get(`${baseUrl}/order`, { timeout: 4000, validateStatus: () => true }),
          axios.get(`${baseUrl}/robots.txt`, { timeout: 3000, validateStatus: () => true }),
        ]);

        if (mainRes.status !== 'fulfilled' || mainRes.value.status >= 500) continue;

        const html = mainRes.value.data;
        const $ = cheerio.load(html);
        const newData = extractData(html, $);
        const statusCode = mainRes.value.status;

        // Robots.txt
        let robotsTxt = 'Not Found';
        if (robotsRes.status === 'fulfilled' && robotsRes.value.status < 400) {
          robotsTxt = robotsRes.value.data;
        }

        // Affiliate link check from /order.html or /order
        let affiliateLink = null;
        const candidates = [orderHtmlRes, orderRes];

        for (const result of candidates) {
          if (result.status === 'fulfilled' && result.value.status < 400) {
            const $$ = cheerio.load(result.value.data);

            const meta = $$('meta[http-equiv="refresh"]').attr('content');
            const metaMatch = meta?.match(/url=["']?(https?:\/\/[^"']+)/i);
            if (metaMatch) {
              affiliateLink = metaMatch[1];
              break;
            }

            const scripts = $$('script').toArray();
            for (const script of scripts) {
              const js = $$(script).html();
              const match = js?.match(/window\.location\.href\s*=\s*['"](https?:\/\/[^'"]+)['"]/i);
              if (match) {
                affiliateLink = match[1];
                break;
              }
            }

            if (affiliateLink) break;
          }
        }

        // Compare all tracked fields
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

        // Array comparison
        if (!changed && (
          JSON.stringify(site.h1) !== JSON.stringify(newData.h1) ||
          JSON.stringify(site.h2) !== JSON.stringify(newData.h2) ||
          JSON.stringify(site.images) !== JSON.stringify(newData.images) ||
          JSON.stringify(site.altTags) !== JSON.stringify(newData.altTags) ||
          JSON.stringify(site.canonicals) !== JSON.stringify(newData.canonicals)
        )) {
          changed = true;
        }

        if (changed) {
          await ScrapedSite.findByIdAndUpdate(site._id, {
            ...newData,
            robotsTxt,
            statusCode,
            affiliateLink,
            lastChecked: new Date()
          });
          updated++;
        }

      } catch (err) {
        console.warn(`⚠️ Skipped ${site.domain}:`, err.message);
      }
    }

    res.json({ message: 'Update check complete', updated });
  } catch (err) {
    console.error('❌ Update Error:', err.message);
    res.status(500).json({ error: 'Update failed' });
  }
};
