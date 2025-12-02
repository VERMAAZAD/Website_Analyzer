const axios = require('axios');
const cheerio = require('cheerio');
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
        timeout: 15000,
        validateStatus: () => true
      }),
      axios.get(`${baseOrigin}/order.html`, {
        timeout: 5000,
        validateStatus: () => true
      }),
      axios.get(`${baseOrigin}/order`, {
        timeout: 5000,
        validateStatus: () => true
      }),
      axios.get(`${baseOrigin}/robots.txt`, {
        timeout: 4000,
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

     // ✅ Auth check
  if (!req.user || !req.user._id) {
    console.error("❌ User not authenticated or req.user missing");
    return res.status(401).json({ error: "Unauthorized: User not found in request" });
  }

 try {
    let ownerId = req.user._id;

    if (req.user.role === "sub-user" && req.user.parentUser) {
      ownerId = req.user.parentUser;
    }

    const existing = await ScrapedSite.findOne({ domain: baseDomain, user: ownerId });
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
      user: ownerId, 
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
    
       if (req.user.role === 'admin') {
    } 
    else if (req.user.parentUser) {
      query.user = req.user.parentUser;
    } 
    else {
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
    if (req.user.role === 'admin') {
      query = { domain: baseDomain };
    } else if (req.user.parentUser) {
      query.user = req.user.parentUser;
    } else {
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

     let query = { brandCategory: { $ne: null } };

    if (req.user.role === 'admin') {
      query = { brandCategory: { $ne: null } };
    } else if (req.user.parentUser) {
      query.user = req.user.parentUser;
    } else {
      query.user = req.user._id;
    }

    const categories = await ScrapedSite.distinct('brandCategory', query);

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

     let matchQuery = { brandCategory: { $ne: null } };

    if (req.user.role === 'admin') {
      // Admin → all data
      matchQuery = { brandCategory: { $ne: null } };
    } else if (req.user.parentUser) {
      // Sub-user → use parent user’s data
      matchQuery.user = req.user.parentUser;
    } else {
      // Normal user → their own data
      matchQuery.user = req.user._id;
    }

    const aggregation = await ScrapedSite.aggregate([
      {$match: matchQuery},
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

     if (!req.user || !req.user._id) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    let matchQuery = { brandCategory: category };

    if (req.user.role === "admin") {
      matchQuery = { brandCategory: category };
    } else if (req.user.parentUser) {
      matchQuery.user = req.user.parentUser;
    } else {
      matchQuery.user = req.user._id;
    }

    const domains = await ScrapedSite.find(matchQuery);

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
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    let deleteQuery = { domain: baseDomain };

    if (req.user.role === "admin") {
      deleteQuery = { domain: baseDomain };
    } else if (req.user.parentUser) {
      deleteQuery.user = req.user.parentUser;
    } else {
      deleteQuery.user = req.user._id;
    }

    const result = await ScrapedSite.findOneAndDelete(deleteQuery);

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

  try {
    let query = {};
    if (req.user.role === "admin") {
      query = {};
    } else if (req.user.parentUser) {
      query = { user: req.user.parentUser };
    } else {
      query = { user: req.user._id };
    }

    const domains = await ScrapedSite.find(query);

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

    try {
        let query = { statusCode: { $ne: 200 } };
        if (req.user.role === "admin") {
        } else if (req.user.parentUser) {
          query.user = req.user.parentUser;
        } else {
          query.user = req.user._id;
        }
       const errorDomains = await ScrapedSite.find(query)
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

// 🔹 TEST AFFILIATE LINKS
exports.testAffiliateLinks = async (req, res) => {
  const limit = pLimit(30); // ✅ Concurrency control
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // ✅ Build filter dynamically
    const filter = {
      affiliateLink: { $exists: true, $ne: "" },
      statusCode: 200,
    };

    if (req.user.role === "admin") {
      // Admin → check all
    } else if (req.user.parentUser) {
      // Sub-user → check parent user’s links
      filter.user = req.user.parentUser;
    } else {
      // Normal user → check their own
      filter.user = req.user._id;
    }

    const domains = await ScrapedSite.find(filter).lean();

    if (!domains.length) {
      return res.json({
        message: "No affiliate links found to test.",
        total: 0,
        failed: 0,
        errors: [],
      });
    }

    const failedLinks = [];

    const checkLink = async (site) => {
      const link = site.affiliateLink;
      let status = "ok";
      let errorMessage = null;

      try {
        let resp;
        try {
          resp = await axios.head(link, {
            timeout: 10000,
            maxRedirects: 5,
            validateStatus: () => true,
            headers: {
              "User-Agent": "Mozilla/5.0",
              Accept: "text/html,application/xhtml+xml,application/xml;q=0.9",
            },
          });
        } catch {
          resp = await axios.get(link, {
            timeout: 10000,
            maxRedirects: 5,
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
          if ([403, 404, 406].includes(resp.status)) {
            status = "ok"; 
            errorMessage = null;
          } else {
            status = "error";
            errorMessage = `HTTP ${resp.status}`;
          }
        }
      } catch (err) {
        status = "error";
        errorMessage = err.message || "Unknown request error";
      }

      // Save status in DB
      await ScrapedSite.updateOne(
        { _id: site._id },
        {
          $set: {
            affiliateCheckStatus: status,
            affiliateErrorMessage: status === "ok" ? null : errorMessage,
            lastAffiliateCheck: new Date(),
          },
        }
      );

      if (status === "error") {
        failedLinks.push({
          domain: site.domain,
          affiliateLink: link,
          error: errorMessage,
        });
      }
    };

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



// 🔹 GET AFFILIATE ERRORS
exports.getAffiliateErrors = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

     let query = { statusCode: 200 };
    if (req.user.role === "admin") {
      query = { statusCode: 200 };
    } else if (req.user.parentUser) {
      query = { user: req.user.parentUser, statusCode: 200 };
    } else {
      query = { user: req.user._id, statusCode: 200 };
    }

    const cutoff = new Date(Date.now() - 1000 * 60 * 10);

    const sites = await ScrapedSite.find(query)
    .select("domain affiliateLink affiliateCheckStatus affiliateErrorMessage lastAffiliateCheck user")
      .lean();

    const errors = sites
      .filter((site) => {
        // ✅ Broken affiliate link
        if (site.affiliateCheckStatus === "error" && site.affiliateErrorMessage) {
          if (!site.lastAffiliateCheck || site.lastAffiliateCheck < cutoff) {
            return false; // ❌ stale
          }
          return true;
        }

        // ✅ Missing link
        if (!site.affiliateLink || site.affiliateLink.trim() === "") {
          return true;
        }

        // ✅ Invalid link (exact same as domain, no affiliate param)
        const normalized = `https://${site.domain}`;
        if (site.affiliateLink === normalized) {
          return true;
        }

        return false; // ✅ Valid link
      })
      .map((site) => {
        let link = site.affiliateLink;
        let errorMsg = site.affiliateErrorMessage || "Unknown error";

        // Handle missing/invalid
        if (!link || link.trim() === "" || link === `https://${site.domain}`) {
          link = `https://${site.domain}`;
          errorMsg = "No affiliate link found";
        }

        return {
          domain: site.domain,
          affiliateLink: link,
          error: errorMsg,
          lastChecked: site.lastAffiliateCheck || null,
        };
      });

    res.json({ errors });
  } catch (err) {
    console.error("Get affiliate errors failed:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
};



exports.getExpiringDomains = async (req, res) => {
  try {
    const now = new Date();
    const tenDaysFromNow = new Date();
    tenDaysFromNow.setDate(now.getDate() + 10);

    // Admin can see all; normal users only their own
    let query = {};

     if (req.user.role === 'admin') {
      query = {}; // Admin sees all
    } else if (req.user.parentUser) {
      query.user = req.user.parentUser; // Sub-user sees parent's domains
    } else {
      query.user = req.user._id; // Normal user sees their own domains
    }

    const domains = await ScrapedSite.find(query);

    const expiring = [];
    const reminder = [];
    const deleteAfter = [];

    domains.forEach(domain => {
      if (!domain.issueDate) return;

      const issueDate = new Date(domain.issueDate);
      const expiryDate = new Date(issueDate);
      expiryDate.setFullYear(issueDate.getFullYear() + 1);

      if (expiryDate >= now && expiryDate <= tenDaysFromNow) {
        expiring.push(domain);
      } 
      else if (expiryDate < now && expiryDate >= new Date(now.getTime() - (5 * 24 * 60 * 60 * 1000))) {
        reminder.push(domain);
      } 
      else if (expiryDate < new Date(now.getTime() - (5 * 24 * 60 * 60 * 1000))) {
        deleteAfter.push(domain._id);
      }
    });

    // delete domains older than 5 days past expiry
    if (deleteAfter.length > 0) {
      await ScrapedSite.deleteMany({ _id: { $in: deleteAfter } });
    }

    res.json({
      success: true,
      expiring,
      reminder
    });

  } catch (err) {
    console.error(err);
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
        let query;

        // ✅ Role-based logic
        if (req.user.role === "admin") {
          query = { domain: domain.toLowerCase() };
        } else if (req.user.parentUser) {
          query = { user: req.user.parentUser, domain: domain.toLowerCase() };
        } else {
          query = { user: req.user._id, domain: domain.toLowerCase() };
        }

        const existing = await ScrapedSite.findOne(query);

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
    const cleanDomain = domain
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .trim()
      .toLowerCase();

       let query;
    if (req.user.role === "admin") {
      query = { domain: cleanDomain };
    } else if (req.user.parentUser) {
      query = { domain: cleanDomain, user: req.user.parentUser };
    } else {
      query = { domain: cleanDomain, user: req.user._id };
    }

    const updated = await ScrapedSite.findOneAndUpdate(query, { note }, { new: true });
    if (!updated) {
      return res.status(404).json({ error: 'Domain not found' });
    }
    res.json({
      message: "Note updated successfully",
      note: updated.note,
    });
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
      .trim()
      .toLowerCase();

    // Admins can delete notes on any domain
    let query;
    if (req.user.role === "admin") {
      query = { domain: cleanDomain };
    } else if (req.user.parentUser) {
      query = { domain: cleanDomain, user: req.user.parentUser };
    } else {
      query = { domain: cleanDomain, user: req.user._id };
    }

    const updated = await ScrapedSite.findOneAndUpdate(
      query,
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


exports.getUnindexedDomains = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // 🧠 Role-based filter logic
    let query = { isIndexedOnBing: false };

    if (req.user.role === "admin") {
      // Admin → all users
    } else if (req.user.parentUser) {
      // Sub-user → parent’s data
      query.user = req.user.parentUser;
    } else {
      // Normal user → own data
      query.user = req.user._id;
    }

    // 🧾 Fetch unindexed domains
    const sites = await ScrapedSite.find(query)
      .select("domain lastBingCheck user")
      .lean();

    // 🧹 Prepare output
    const unindexed = sites.map(site => ({
      domain: site.domain,
      lastBingCheck: site.lastBingCheck || null,
    }));

    res.json({ unindexed });
  } catch (err) {
    console.error("❌ Error fetching unindexed domains:", err.message);
    res.status(500).json({ error: "Failed to fetch unindexed domains" });
  }
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
    // FIXED: clean domain
    const cleanDomain = domain
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/$/, "");

    let filter;
    if (req.user.role === "admin") {
      filter = { domain: cleanDomain };
    } else if (req.user.parentUser) {
      filter = { domain: cleanDomain, user: req.user.parentUser };
    } else {
      filter = { domain: cleanDomain, user: req.user._id };
    }

    // FIXED: findOne(filter) not {filter}
    const site = await ScrapedSite.findOne(filter);

    if (!site)
      return res.status(404).json({ message: "Domain not found" });

    site.hostingInfo = {
      platform,
      email,
      server,
      domainPlatform,
      domainEmail,
      cloudflare,
    };
    await site.save();

    res.json({
      message: "Hosting info saved",
      hostingInfo: site.hostingInfo,
    });
  } catch (err) {
    console.error("Error saving hosting info:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getHostingInfo = async (req, res) => {
  
  try {
    const { domain } = req.params;
    const cleanDomain = domain
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .trim();

    let filter;
    if (req.user.role === "admin") {
      // Admin can access any domain
      filter = { domain: cleanDomain };
    } else if (req.user.parentUser) {
      // Sub-user can access parent user’s domains
      filter = { domain: cleanDomain, user: req.user.parentUser };
    } else {
      // Normal user can access only their own
      filter = { domain: cleanDomain, user: req.user._id };
    }

    const site = await ScrapedSite.findOne(filter);

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
  try {
    const { oldDomain, newDomain } = req.body;

    if (!oldDomain || !newDomain) {
      return res
        .status(400)
        .json({ message: "Both old and new domain names are required." });
    }

    // 🧹 Normalize domains (remove protocols and www)
    const cleanOldDomain = oldDomain
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .trim()
      .toLowerCase();

    const cleanNewDomain = newDomain
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .trim()
      .toLowerCase();

    // 🧠 Role-based filter
    let filter;
    if (req.user.role === "admin") {
      filter = { domain: cleanOldDomain };
    } else if (req.user.parentUser) {
      // Sub-user updates domain under parent
      filter = { domain: cleanOldDomain, user: req.user.parentUser };
    } else {
      filter = { domain: cleanOldDomain, user: req.user._id };
    }

    // 🔍 Find the existing domain
    const site = await ScrapedSite.findOne(filter);
    if (!site) {
      return res
        .status(404)
        .json({ message: "Old domain not found or access denied." });
    }

    // 🚫 Check if new domain already exists (avoid duplicates)
    const existing = await ScrapedSite.findOne({ domain: cleanNewDomain });
    if (existing) {
      return res
        .status(409)
        .json({ message: "New domain already exists." });
    }

    // ✅ Update and save
    site.domain = cleanNewDomain;
    await site.save();

    res.json({
      message: "✅ Domain name updated successfully",
      updatedDomain: cleanNewDomain,
    });
  } catch (err) {
    console.error("❌ Domain update failed:", err.message);
    res
      .status(500)
      .json({ message: "Server error while updating domain name." });
  }
};



  const puppeteer = require('puppeteer-extra');
  const StealthPlugin = require('puppeteer-extra-plugin-stealth');
  const UserAgent = require('user-agents');

  puppeteer.use(StealthPlugin());

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  

/* -----------------------------------------------------
 * 🧹 Safe page close
 * --------------------------------------------------- */
const safeClose = async (page) => {
  if (!page) return;
  try {
    // check if page still valid
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

/* -----------------------------------------------------
 * 🔍 Detect Bing indexing status
 * --------------------------------------------------- */
 async function detectBingIndex(page, cleanDomain) {
  return page.evaluate((domain) => {
    try {
      // Dismiss cookie / consent if present
      const consentBtn = Array.from(document.querySelectorAll('button, input[type="submit"], a'))
        .find(el => /accept|agree|consent|ok/i.test(el.textContent || ''));
      if (consentBtn) {
        try { consentBtn.click(); } catch(e) { /* ignore */ }
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

/* -----------------------------------------------------
 * ♻️ Retry logic for Bing index check
 * --------------------------------------------------- */
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
        // maybe wait then retry
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, delayBetweenRetries));
          continue;
        }
        return { isBlocked: false, isIndexed: false, firstResult: null, resultCount: 0 };
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
        await new Promise(r => setTimeout(r, 7000));
      }

      // Wait small random to let dynamic content settle
      await new Promise(r => setTimeout(r, 1500 + Math.random() * 1500));

      // Detect blocking / captcha
      const isBlocked = await page.evaluate(() => {
        const txt = document.body.innerText.toLowerCase();
        return (
          document.querySelector('#b_captcha') ||
          document.querySelector("iframe[src*='recaptcha']") ||
          txt.includes('verify you are human') ||
          txt.includes('unusual traffic') ||
          txt.includes('bot detect') ||
          txt.includes('private access token') ||
          txt.includes('access denied') ||
          txt.includes('we’ve detected unusual activity')
        );
      });

      if (isBlocked) {
        console.warn(`🚫 [${cleanDomain}] CAPTCH A / Block detected`);
        await safeClose(page);
        return { isBlocked: true, isIndexed: false, firstResult: null, resultCount: 0 };
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
        await new Promise(r => setTimeout(r, delayBetweenRetries));
      }
    }
  }

  console.error(`❌ [${cleanDomain}] All ${retries} attempts failed`);
  return { isBlocked: false, isIndexed: false, firstResult: null, resultCount: 0 };
};

/* -----------------------------------------------------
 * 🚀 Main Bing Index Checker API
 * --------------------------------------------------- */
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
      headless: false, 
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--lang=en-US,en'
      ]
    });

    const limit = pLimit(2); // you can raise concurrency to 2 or 3 but be mindful of block
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