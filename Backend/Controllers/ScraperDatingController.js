const axios = require('axios');
const cheerio = require('cheerio');
const ScrapedDatingSite = require('../Models/ScrapedDatingSite');



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
    const titleCharCount = title.length;
    const descriptionCharCount = description.length;
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
      titleCharCount,
      description,
      descriptionCharCount,
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
    const existing = await ScrapedDatingSite.findOne({ domain: baseDomain, user: req.user._id });
    if (existing) {
      return res.status(400).json({ error: 'E11000: Duplicate domain for this user' });
    }

    const newSite = new ScrapedDatingSite({
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

    const sites = await ScrapedDatingSite.find(query); 
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

    const site = await ScrapedDatingSite.findOne(query);

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

    const categories = await ScrapedDatingSite.distinct('brandCategory', {
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

    const aggregation = await ScrapedDatingSite.aggregate([
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

    const domains = await ScrapedDatingSite.find({
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
    const result = await ScrapedDatingSite.findOneAndDelete({
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
const https = require("https");
const pLimit = require("p-limit").default;

exports.refreshStatusesAndGetErrors = async (req, res) => {
  const limit = pLimit(10);
  const httpsAgent = new https.Agent({ rejectUnauthorized: false });

  if (!req.user || !req.user._id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const query = req.user.role === "admin" ? {} : { user: req.user._id };

  try {
    const domains = await ScrapedDatingSite.find(query);

    const checkAndUpdateSite = async (site) => {
      const url = `https://${site.domain}`;
      let statusCode = 0;
      let failingUrl = url;

      try {
        const response = await axios.get(url, {
          timeout: 100000,
          validateStatus: () => true,
          httpsAgent,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
          },
        });

        statusCode = response.status;
        const html = typeof response.data === "string" ? response.data : "";

        // Cloudflare SSL error codes (525–527)
        const cfMatch = html.match(/Error code (52[5-7])/);
        if (cfMatch) {
          statusCode = parseInt(cfMatch[1], 10);
        }

        // Suspended domain detection
        const suspendedPatterns = [
          /domain suspended/i,
          /website suspended/i,
          /account has been suspended/i,
          /temporarily unavailable/i,
          /service suspended/i,
        ];
        if (suspendedPatterns.some((regex) => regex.test(html))) {
          statusCode = 498; // custom suspended code
        }

      } catch (err) {
        if (err.code === "ECONNABORTED") {
          statusCode = 408; // timeout
        } else if (err.code === "DEPTH_ZERO_SELF_SIGNED_CERT") {
          statusCode = 495; // self-signed SSL
        } else if (err.code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE") {
          statusCode = 496; // SSL verification error
        } else if (err.code === "CERT_HAS_EXPIRED") {
          statusCode = 497; // expired SSL
        } else if (err.code === "ENOTFOUND" || err.code === "EAI_AGAIN") {
          statusCode = 499; // NXDOMAIN / expired domain
        } else if (err.response?.status) {
          statusCode = err.response.status;
        } else {
          statusCode = 526; // general SSL/connection failure
        }
      }

      site.statusCode = statusCode || 526;
      site.failingUrl = site.statusCode !== 200 ? failingUrl : null;
      site.lastChecked = new Date();
      await site.save();

      return site;
    };

    const results = await Promise.all(
      domains.map((site) => limit(() => checkAndUpdateSite(site)))
    );

    const errorDomains = results
      .filter((site) => site && site.statusCode !== 200)
      .map((site) => ({
        domain: site.domain,
        statusCode: site.statusCode,
        failingUrl: site.failingUrl || "N/A",
        lastChecked: site.lastChecked,
        user: site.user,
      }));

    res.json({
      message: `✅ Checked ${results.length} domains. ❌ Found ${errorDomains.length} with errors.`,
      errorDomains,
    });

  } catch (err) {
    console.error("Error checking domains:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getErrorDomains = async (req, res) => {
  if (!req.user || !req.user._id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const query = req.user.role === "admin"
    ? { statusCode: { $ne: 200 } }
    : { user: req.user._id, statusCode: { $ne: 200 } };

  try {
       const errorDomains = await ScrapedDatingSite.find(query)
      .select("domain statusCode failingUrl lastChecked user")
      .lean();

    if (!errorDomains || errorDomains.length === 0) {
      console.warn("No error domains found.");
    }
    res.json({ errorDomains });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch error domains" });
  }
};





exports.testAffiliateLinks = async (req, res) => {
  const limit = pLimit(30); // ✅ Concurrency control
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const filter = { affiliateLink: { $ne: null } };
    if (req.user.role !== "admin") {
      filter.user = req.user._id;
    }

    const domains = await ScrapedDatingSite.find(filter);
    const failedLinks = [];

    const checkLink = async (site) => {
      const link = site.affiliateLink;
      let status = "ok";
      let errorMessage = null;

      try {
        // Try HEAD request first
        let resp;
        try {
          resp = await axios.head(link, {
            timeout: 3000,
            maxRedirects: 0,
            validateStatus: () => true,
            headers: {
              "User-Agent": "Mozilla/5.0",
              Accept: "text/html,application/xhtml+xml,application/xml;q=0.9",
            },
          });
        } catch {
          // Fall back to GET if HEAD fails
          resp = await axios.get(link, {
            timeout: 3000,
            maxRedirects: 0,
            validateStatus: () => true,
            headers: {
              "User-Agent": "Mozilla/5.0",
              Accept: "text/html,application/xhtml+xml,application/xml;q=0.9",
            },
          });
        }

        const redirectLocation = resp.headers.location || "";

        if ([301, 308].includes(resp.status)) {
          status = "error";
          errorMessage = `Permanent redirect ${resp.status} → ${redirectLocation}`;
        } else if (
          [302, 303, 307].includes(resp.status) &&
          (redirectLocation.includes("errCode=invalidvendor") ||
            redirectLocation.includes("error"))
        ) {
          status = "error";
          errorMessage = `Redirect error ${resp.status} → ${redirectLocation}`;
        } else if (resp.status >= 400) {
          status = "error";
          errorMessage = `HTTP ${resp.status}`;
        }
      } catch (err) {
        status = "error";
        errorMessage = err.message || "Unknown request error";
      }

      // Save status in DB
      await ScrapedDatingSite.updateOne(
        { _id: site._id },
        {
          $set: {
            affiliateCheckStatus: status,
            lastAffiliateCheck: new Date(),
            note: status === "error" ? errorMessage : "",
          },
        }
      );

      // Collect for API response
      if (status === "error") {
        failedLinks.push({
          domain: site.domain,
          affiliateLink: link,
          error: errorMessage,
        });
      }
    };

    // Run checks concurrently
    await Promise.allSettled(domains.map((site) => limit(() => checkLink(site))));

    res.json({
      total: domains.length,
      failed: failedLinks.length,
      errors: failedLinks,
    });
  } catch (err) {
    console.error("Affiliate test failed:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};



// GET /get-affiliate-errors
exports.getAffiliateErrors = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Fetch anything not marked ok yet
    const filter = { affiliateCheckStatus: { $ne: "ok" } };
    if (req.user.role !== "admin") {
      filter.user = req.user._id;
    }

    const errors = await ScrapedDatingSite.find(filter, {
      domain: 1,
      affiliateLink: 1,
      affiliateCheckStatus: 1,
    }).lean();

    res.json({
      errors: errors.map(site => ({
        domain: site.domain,
        affiliateLink: site.affiliateLink,
        status: site.affiliateCheckStatus || "pending",
      }))
    });
  } catch (err) {
    console.error("Get affiliate errors failed:", err.message);
    res.status(500).json({ error: "Internal server error" });
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

    const domains = await ScrapedDatingSite.find(query);

     const expiring = [];
    const expiredDomains = [];

    domains.forEach(domain => {
      if (!domain.issueDate) return;

      const issueDate = new Date(domain.issueDate);
      const expiryDate = new Date(issueDate);
      expiryDate.setFullYear(issueDate.getFullYear() + 1);

       if (expiryDate >= now && expiryDate <= tenDaysFromNow) {
        expiring.push(domain);
      } else if (expiryDate < now) {
        expiredDomains.push(domain._id);
      }
    });

    if (expiredDomains.length > 0) {
      await ScrapedDatingSite.deleteMany({ _id: { $in: expiredDomains } });
    }

    res.json(expiring);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch expiring domains' });
  }
};

//Domain renew

exports.renewDomain = async (req, res) => {
  try {
    const { domains } = req.body;

    if (!Array.isArray(domains) || domains.length === 0) {
      return res.status(400).json({ error: 'Expected non-empty array of domains' });
    }

    const results = await Promise.all(
      domains.map(async (domain) => {
        const query = req.user.role === "admin"
          ? { domain: domain.toLowerCase() }
          : { user: req.user._id, domain: domain.toLowerCase() };

        // Find the domain first
        const existing = await ScrapedDatingSite.findOne(query);

        if (!existing) {
          return { domain, status: 'not found' };
        }

        let newIssueDate;
        if (existing.issueDate) {
          // Add 1 year to current issueDate
          newIssueDate = new Date(existing.issueDate);
          newIssueDate.setFullYear(newIssueDate.getFullYear() + 1);
        } else {
          // Set to today if not present
          newIssueDate = new Date();
        }

        existing.issueDate = newIssueDate;
        await existing.save();

        return { domain, status: 'renewed', newIssueDate };
      })
    );

    res.json({
      message: 'Renew process completed',
      results
    });
  } catch (err) {
    console.error("Renewal error:", err);
    res.status(500).json({ error: 'Renewal failed', details: err.message });
  }
};






// update note

// PUT /api/scraper/note/:domain
exports.updateNote = async (req, res) => {
  try {
    const { domain } = req.params;
    const { note } = req.body;
const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').trim();


 const filter = req.user.role === 'admin'
      ? { domain: cleanDomain } 
      : { domain: cleanDomain, user: req.user._id }; 


    const updated = await ScrapedDatingSite.findOneAndUpdate(
      filter,
      { note },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ error: 'Domain not found' });
    }

    res.json({ message: 'Note saved successfully', note: updated.note });
  } catch (err) {
    res.status(500).json({ error: 'Server error while saving note' });
  }
};



// DELETE /api/scraper/note/:domain
exports.deleteNote = async (req, res) => {
  try {
    const { domain } = req.params;

    const cleanDomain = domain
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .trim();

    // Admins can delete notes on any domain
    const filter = req.user.role === 'admin'
      ? { domain: cleanDomain }
      : { domain: cleanDomain, user: req.user._id };

    const updated = await ScrapedDatingSite.findOneAndUpdate(
      filter,
      { note: '' },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Domain not found or access denied' });
    }

    res.json({ message: 'Note deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting note:', err);
    res.status(500).json({ error: 'Server error while deleting note' });
  }
};





const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const UserAgent = require('user-agents');
const path = require('path');

puppeteer.use(StealthPlugin());

exports.checkBingIndex = async (req, res) => {
  // 1. Ensure user is logged in
  if (!req.user || !req.user._id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);

  const baseFilter = req.user.role === 'admin' ? {} : { user: req.user._id };

 // Check if ALL domains are already checked today
const totalDomains = await ScrapedDatingSite.countDocuments(baseFilter);
const checkedTodayCount = await ScrapedDatingSite.countDocuments({
  ...baseFilter,
  lastBingCheck: { $gte: startOfToday }
});

// If all are checked today, allow re-check
let filter;
if (totalDomains > 0 && checkedTodayCount === totalDomains) {
  filter = baseFilter; // No date restriction
} else {
  filter = {
    ...baseFilter,
    $or: [
      { lastBingCheck: { $exists: false } },
      { lastBingCheck: { $lt: startOfToday } }
    ]
  };
}

  const domains = await ScrapedDatingSite.find(filter, 'domain');

  const domainList = domains.map(site => site.domain);
  const unindexed = [];
  const checkedToday = [];
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: true,
      executablePath: puppeteer.executablePath(), 
        args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process'
        ],
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

        const site = await ScrapedDatingSite.findOne({ domain: fullUrl });
        if (site) {
          site.isIndexedOnBing = isIndexed;
          site.lastBingCheck = new Date();
          await site.save();
        }
        if (!isIndexed) {
          unindexed.push(fullUrl);
          checkedToday.push(fullUrl);
        }

      } catch (err) {
        console.warn(`❌ Error checking ${domain}:`, err.message);
        continue;
      } finally {
        await page.close();
      }
    }

    return res.json({ unindexed, checkedToday });

  } catch (err) {
    console.error('❌ Error launching Puppeteer:', err.message);
    res.status(500).json({ error: 'Server error' });
  } finally {
    if (browser) await browser.close();
  }
};

exports.getUnindexedDomains = async (req, res) => {
  if (!req.user || !req.user._id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const filter = req.user.role === "admin" ? {} : { user: req.user._id };
  const sites = await ScrapedDatingSite.find({ ...filter, isIndexedOnBing: false });

  const unindexed = sites.map(site =>  ({
      domain: site.domain,
      lastBingCheck: site.lastBingCheck,
    }));

  res.json({ unindexed });
};






exports.saveHostingInfo = async (req, res) => {
  const { domain } = req.params;
  const {
    platform,
    email,
    server,
    domainPlatform,
    domainEmail,
    cloudflare,
  } = req.body;

  try {
    const site = await ScrapedDatingSite.findOne({ domain });

    if (!site) return res.status(404).json({ message: "Domain not found" });

    const userId = req.user._id;
    const isAdmin = req.user.role === 'admin';

    if (!isAdmin && site.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized to modify this domain" });
    }

    site.hostingInfo = {
      platform,
      email,
      server,
      domainPlatform,
      domainEmail,
      cloudflare,
    };

    await site.save();

    res.json({ message: "Hosting info saved", hostingInfo: site.hostingInfo });
  } catch (err) {
    console.error("Error saving hosting info:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};



exports.getHostingInfo = async (req, res) => {
  const { domain } = req.params;

  try {
    const filter = req.user.role === 'admin' ? { domain } : { domain, user: req.user._id };
    const site = await ScrapedDatingSite.findOne(filter);

    if (!site) {
      return res.status(404).json({ error: "Domain not found" });
    }

    res.json({ hostingInfo: site.hostingInfo || {} });
  } catch (err) {
    console.error("Error fetching hosting info:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};


exports.updateDomainName = async (req, res) => {
  const { oldDomain, newDomain } = req.body;

  if (!oldDomain || !newDomain) {
    return res.status(400).json({ message: "Both old and new domain names are required." });
  }

  try {
    const site = await ScrapedDatingSite.findOne({ domain: oldDomain });

    if (!site) {
      return res.status(404).json({ message: "Old domain not found." });
    }

    // Authorization check: only owner or admin can update
    const isAdmin = req.user.role === "admin";
    if (!isAdmin && site.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized to update this domain." });
    }

    // Optional: Check if new domain already exists
    const existing = await ScrapedDatingSite.findOne({ domain: newDomain });
    if (existing) {
      return res.status(409).json({ message: "New domain already exists." });
    }

    site.domain = newDomain;
    await site.save();

    res.json({ message: "Domain name updated successfully", updatedDomain: newDomain });
  } catch (err) {
    console.error("Domain update failed:", err.message);
    res.status(500).json({ message: "Server error while updating domain name." });
  }
};
