const axios = require('axios');
const cheerio = require('cheerio');
const pLimit = require('p-limit').default;
const ScrapedSite = require('../Models/ScrapedSite');



// Utility to normalize domain (removes protocol, www, and trailing slash)
const normalizeDomain = (url) => {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');
  }
};

// [1] Scrape website data
exports.scrapeWebsite = async (req, res) => {
  const { domain } = req.body;

  if (!domain) return res.status(400).json({ error: 'Domain is required' });

  try {
    const baseUrl = new URL(domain);
    const baseOrigin = baseUrl.origin;

    // Start all other requests in parallel with reduced timeouts
    const [mainRes, orderHtmlRes, orderRes, robotsRes] = await Promise.allSettled([
      axios.get(domain, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        timeout: 5000,
        validateStatus: () => true
      }),
      axios.get(`${baseOrigin}/order.html`, {
        timeout: 3000,
        validateStatus: () => true
      }),
      axios.get(`${baseOrigin}/order`, {
        timeout: 3000,
        validateStatus: () => true
      }),
      axios.get(`${baseOrigin}/robots.txt`, {
        timeout: 2000,
        validateStatus: () => true
      })
    ]);

    // Handle main HTML response first
    let h1 = [], h2 = [], images = [], altTags = [], canonicals = [],
        title = '', description = '', wordCount = 0,
        schemaPresent = false, statusCode = 0;

    if (mainRes.status !== 'fulfilled' || mainRes.value.status >= 500) {
      return res.status(400).json({ error: 'Main site is unreachable or returned error.' });
    }

    const html = mainRes.value.data;
    const $ = cheerio.load(html);
    h1 = $('h1').map((_, el) => $(el).text().trim()).get();
    h2 = $('h2').map((_, el) => $(el).text().trim()).get();
    images = $('img').map((_, el) => $(el).attr('src')).get();
    altTags = $('img').map((_, el) => $(el).attr('alt') || '').get();
    canonicals = $('link[rel="canonical"]').map((_, el) => $(el).attr('href')).get();
    title = $('title').text().trim();
    description = $('meta[name="description"]').attr('content') || '';
    wordCount = $('body').text().split(/\s+/).filter(Boolean).length;
    schemaPresent = $('script[type="application/ld+json"]').length > 0;
    statusCode = mainRes.value.status;

    // Attempt to extract affiliate link
    let affiliateLink = null;
    const affiliateCandidates = [orderHtmlRes, orderRes];

    for (const result of affiliateCandidates) {
      if (result.status === 'fulfilled' && result.value.status < 400) {
        const $order = cheerio.load(result.value.data);

        // Meta redirect
        const metaTag = $order('meta[http-equiv="refresh"]').attr('content');
        const metaMatch = metaTag?.match(/url=["']?(https?:\/\/[^"']+)/i);
        if (metaMatch) {
          affiliateLink = metaMatch[1];
          break;
        }

        // JS redirect
        const scripts = $order('script').toArray();
        for (const script of scripts) {
          const jsText = $order(script).html();
          const jsMatch = jsText?.match(/window\.location\.href\s*=\s*["'](https?:\/\/[^"']+)["']/i);
          if (jsMatch) {
            affiliateLink = jsMatch[1];
            break;
          }
        }

        if (affiliateLink) break;
      }
    }

    // Robots.txt
    let robotsTxt = 'Not Found or Inaccessible';
    if (robotsRes.status === 'fulfilled' && robotsRes.value.status < 400) {
      robotsTxt = robotsRes.value.data;
    }

   
    res.json({
      h1,
      h2,
      images,
      altTags,
      canonicals,
      title,
      description,
      wordCount,
      schemaPresent,
      robotsTxt,
      statusCode,
      lastChecked: new Date(),
      affiliateLink
    });

  } catch (error) {
    console.error('Scraping error:', error);
    res.status(500).json({
      error: 'Something went wrong while scraping.',
      details: error.message,
      status: error.response?.status || 500
    });
  }
};




// [2] Save scraped data to DB
exports.saveScrapedData = async (req, res) => {
  const { domain, data, brandCategory, issueDate} = req.body;

  if (!domain || !data) {
    return res.status(400).json({ error: 'Domain and data are required' });
  }

  const baseDomain = normalizeDomain(domain);

  // Check for user on request (requires auth middleware)
  if (!req.user || !req.user._id) {
    console.error('❌ User not authenticated or req.user missing');
    return res.status(401).json({ error: 'Unauthorized: User not found in request' });
  }
 try {
    // Check if domain already exists for the same user
    const existing = await ScrapedSite.findOne({ domain: baseDomain, user: req.user._id });
    if (existing) {
      return res.status(400).json({ error: 'E11000: Duplicate domain for this user' });
    }

    const newSite = new ScrapedSite({
      domain: baseDomain,
      h1: data.h1,
      h2: data.h2,
      images: data.images,
      canonicals: data.canonicals,
      title: data.title,
      description: data.description,
      altTags: data.altTags,
      wordCount: data.wordCount,
      robotsTxt: data.robotsTxt,
      schemaPresent: data.schemaPresent,
      statusCode: data.statusCode,
      lastChecked: data.lastChecked || new Date(),
      user: req.user._id, 
      brandCategory: brandCategory?.trim() || null,
      affiliateLink: data.affiliateLink || null,
      issueDate: issueDate ? new Date(issueDate) : null,
    });

    await newSite.save();
    res.status(201).json({ message: 'Scraped data saved successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save scraped data' });
  }
};


// [3] Get all domains
exports.getAllScrapedSites = async (req, res) => {
 try {
    let query = {};
    
    // 👤 Admin gets all users' domains
    if (req.user.role !== 'admin') {
      query.user = req.user._id;
    }

    const sites = await ScrapedSite.find(query); 
    res.json(sites);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch scraped sites' });
  }
};

// [4] Get data by domain
exports.getScrapedSiteByDomain = async (req, res) => {
  const rawDomain = req.params.domain;
  const baseDomain = normalizeDomain(rawDomain);

  try {
    let query = { domain: baseDomain };

    // ✅ If not admin, restrict to only their own domains
    if (req.user.role !== 'admin') {
      query.user = req.user._id;
    }

    const site = await ScrapedSite.findOne(query);

    if (!site) {
      console.warn(`Domain not found in DB: ${baseDomain}`);
      return res.status(404).json({ error: 'Site not found' });
    }

    res.json(site);
  } catch (err) {
    console.error('DB Fetch Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch site data' });
  }
};


// [5] Get all brand categories for the logged-in user

exports.getAllCategories = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const categories = await ScrapedSite.distinct('brandCategory', {
      user: req.user._id,
      brandCategory: { $ne: null },
    });

    res.json(categories);
  } catch (err) {
    console.error('Category Fetch Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch brand categories' });
  }
};


// [6] Get category-wise domain count for logged-in user
exports.getCategoryCounts = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const aggregation = await ScrapedSite.aggregate([
      {
        $match: {
          user: req.user._id,
          brandCategory: { $ne: null },
        }
      },
      {
        $group: {
          _id: "$brandCategory",
          count: { $sum: 1 }
        }
      }
    ]);

    const counts = {};
    aggregation.forEach(item => {
      counts[item._id] = item.count;
    });

    res.json(counts);
  } catch (err) {
    console.error('Category Count Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch category counts' });
  }
};

// Get all domains by category
exports.getDomainsByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const domains = await ScrapedSite.find({
      brandCategory: category,
      user: req.user._id
    });

    res.json(domains);
  } catch (error) {
    console.error('Error fetching domains by category:', error.message);
    res.status(500).json({ error: 'Failed to fetch domains by category' });
  }
};



// [7] Delete a domain for the logged-in user
exports.deleteScrapedSite = async (req, res) => {
  const rawDomain = req.params.domain;
  const baseDomain = normalizeDomain(rawDomain);

  if (!req.user || !req.user._id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const result = await ScrapedSite.findOneAndDelete({
      domain: baseDomain,
      user: req.user._id
    });

    if (!result) {
      return res.status(404).json({ error: 'Domain not found or already deleted' });
    }

    res.json({ message: 'Domain deleted successfully' });
  } catch (err) {
    console.error('Delete Error:', err.message);
    res.status(500).json({ error: 'Failed to delete domain' });
  }
};



// [9] Refresh all domain status codes and return error domains
const https = require('https');

exports.refreshStatusesAndGetErrors = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const httpsAgent = new https.Agent({ rejectUnauthorized: false });
    const filter = req.user.role === "admin" ? {} : { user: req.user._id };
    const domains = await ScrapedSite.find(filter);

    const updates = await Promise.all(
      domains.map(async (site) => {
        const urls = [
          `https://${site.domain}`,
          `http://${site.domain}`,
          `https://www.${site.domain}`,
          `http://www.${site.domain}`
        ];

        let statusCode = 0;
        let checkedUrl = "";

        for (const url of urls) {
          try {
            const res = await axios.get(url, {
              timeout: 10000,
              validateStatus: () => true,
              httpsAgent
            });

            statusCode = res.status;
            checkedUrl = url;

            // Cloudflare error page detection
            const html = typeof res.data === "string" ? res.data : "";
            const match = html.match(/Error code (52[0-6])/);
            if (match) {
              statusCode = parseInt(match[1]);
            }

            break; // stop after first successful attempt
          } catch (err) {
            statusCode = err.response?.status || 0;
            checkedUrl = url;
          }
        }

        if (!statusCode) statusCode = 526;

        // Skip if no user and not admin
        if (!site.user) {
          if (req.user.role === "admin") {
            site.user = req.user._id;
          } else {
            console.warn(`⚠️ Skipping ${site.domain} — missing 'user' reference.`);
            return null;
          }
        }

        site.statusCode = statusCode;
        site.failingUrl = statusCode !== 200 ? checkedUrl : null;
        site.lastChecked = new Date();

        await site.save();
        return site;
      })
    );

    const errorDomains = updates
      .filter(site => site && site.statusCode !== 200)
      .map(site => site.domain);

    res.json(errorDomains);
  } catch (err) {
    console.error("🔁 Status refresh error:", err.message);
    res.status(500).json({ error: "Failed to refresh and fetch error domains" });
  }
};








//Test Affiliate Link
exports.testAffiliateLinks = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const filter = { affiliateLink: { $ne: null } };

    // 👤 Admin sees all users, regular users see their own
    if (req.user.role !== 'admin') {
      filter.user = req.user._id;
    }

    const domains = await ScrapedSite.find(filter);
    const failedLinks = [];

    for (const site of domains) {
      const link = site.affiliateLink;

      try {
        const resp = await axios.get(link, {
          timeout: 7000,
          headers: {
            'User-Agent': 'Mozilla/5.0',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
          },
          maxRedirects: 0, // We want to inspect redirect manually
          validateStatus: () => true, // Allow all responses through
        });

        const redirectLocation = resp.headers.location || '';

        // ❌ Case 1: Permanent redirects (301/308)
        if ([301, 308].includes(resp.status)) {
          failedLinks.push({
            domain: site.domain,
            affiliateLink: link,
            error: `Permanent redirect with status ${resp.status} to ${redirectLocation}`
          });
        }

        // ❌ Case 2: Redirects to known invalid/error pages
        else if (
          [302, 303, 307].includes(resp.status) &&
          (redirectLocation.includes('errCode=invalidvendor') || redirectLocation.includes('error'))
        ) {
          failedLinks.push({
            domain: site.domain,
            affiliateLink: link,
            error: `Redirected with status ${resp.status} to error URL: ${redirectLocation}`
          });
        }

        // ❌ Case 3: HTTP 4xx or 5xx errors
        else if (resp.status >= 400) {
          failedLinks.push({
            domain: site.domain,
            affiliateLink: link,
            error: `Returned error status ${resp.status}`
          });
        }

        // ✅ Else: considered valid — do nothing

      } catch (err) {
        failedLinks.push({
          domain: site.domain,
          affiliateLink: link,
          error: err.message || 'Unknown request error'
        });
      }
    }

    res.json({
      total: domains.length,
      failed: failedLinks.length,
      errors: failedLinks
    });

  } catch (err) {
    console.error('Affiliate test failed:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};



// controller/alerts.js
exports.getExpiringDomains = async (req, res) => {
  try {
    const now = new Date();
    const tenDaysFromNow = new Date();
    tenDaysFromNow.setDate(now.getDate() + 10);

    // Admin can see all; normal users only their own
    const query = req.user.role === "admin" ? {} : { user: req.user._id };

    const domains = await ScrapedSite.find(query);

    const expiring = domains.filter((domain) => {
      if (!domain.issueDate) return false;

      const issueDate = new Date(domain.issueDate);
      const expiryDate = new Date(issueDate);
      expiryDate.setFullYear(issueDate.getFullYear() + 1);

      return expiryDate >= now && expiryDate <= tenDaysFromNow;
    });

    res.json(expiring);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch expiring domains' });
  }
};

//Domain renew

exports.renewDomain = async (req, res) => {
  try {
    const { domains } = req.body;

    if (!Array.isArray(domains)) {
      return res.status(400).json({ error: 'Expected array of domains' });
    }

    const now = new Date();

    await Promise.all(
      domains.map(async (domain) => {
        const query = req.user.role === "admin"
          ? { domain } // admin can renew any domain
          : { user: req.user._id, domain }; // normal user: only their own

        await ScrapedSite.findOneAndUpdate(query, { issueDate: now });
      })
    );

    res.json({ message: 'Renewed successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Renewal failed' });
  }
};