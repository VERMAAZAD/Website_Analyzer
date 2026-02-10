const axios = require('axios');
const cheerio = require('cheerio');
const https = require("https");
const ScrapedSite = require('../Models/ScrapedSite');
const User = require('../Models/User');

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

const axiosInstance = axios.create({
  timeout: 12000,
  validateStatus: () => true,
  headers: {
    "User-Agent": "Mozilla/5.0",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9",
    "Accept-Language": "en-US,en;q=0.9"
  },
  httpsAgent: new https.Agent({
    keepAlive: true,
    maxSockets: 50
  })
});

// [1] Scrape website data
exports.scrapeWebsite = async (req, res) => {
  let { domain } = req.body;
  if (!domain) return res.status(400).json({ error: "Domain is required" });

  try {
    domain = domain.trim();
    if (!/^https?:\/\//i.test(domain)) {
      domain = "https://" + domain;
    }

    const baseUrl = new URL(domain);
    const baseOrigin = baseUrl.origin;

    const requests = await Promise.allSettled([
      axiosInstance.get(domain),
      axiosInstance.get(`${baseOrigin}/order.html`),
      axiosInstance.get(`${baseOrigin}/order`),
      axiosInstance.get(`${baseOrigin}/robots.txt`)
    ]);

    const [mainRes, orderHtmlRes, orderRes, robotsRes] = requests;

    let h1=[], h2=[], images=[], altTags=[], canonicals=[];
    let title="", description="", wordCount=0;
    let schemaPresent=false, statusCode=0, affiliateLink=null;

    if (mainRes.status === "fulfilled") {
      statusCode = mainRes.value.status;
      const html = mainRes.value.data || "";

      if (html) {
        const $ = cheerio.load(html);
        h1 = $("h1").map((_,e)=>$(e).text().trim()).get();
        h2 = $("h2").map((_,e)=>$(e).text().trim()).get();
        images = $("img").map((_,e)=>$(e).attr("src")).get();
        altTags = $("img").map((_,e)=>$(e).attr("alt")||"").get();
        canonicals = $('link[rel="canonical"]').map((_,e)=>$(e).attr("href")).get();
        title = $("title").text().trim();
        description = $('meta[name="description"]').attr("content") || "";
        wordCount = $("body").text().split(/\s+/).filter(Boolean).length;
        schemaPresent = $('script[type="application/ld+json"]').length > 0;
      }
    }

    for (const result of [orderHtmlRes, orderRes]) {
      if (result.status === "fulfilled" && result.value.data) {
        const $o = cheerio.load(result.value.data);

        const meta = $o('meta[http-equiv="refresh"]').attr("content");
        const match = meta?.match(/url=["']?(https?:\/\/[^"']+)/i);
        if (match) { affiliateLink = match[1]; break; }

        $o("script").each((_,s)=>{
          const js = $o(s).html();
          const m = js?.match(/location\.href\s*=\s*["'](https?:\/\/[^"']+)/i);
          if (m) affiliateLink = m[1];
        });

        if (affiliateLink) break;
      }
    }

    let robotsTxt = "Not Found";
    if (robotsRes.status === "fulfilled") {
      robotsTxt = robotsRes.value.data || robotsTxt;
    }

    res.json({
      h1, h2, images, altTags, canonicals,
      title, titleCharCount: title.length,
      description, descriptionCharCount: description.length,
      wordCount, schemaPresent, robotsTxt,
      statusCode, affiliateLink,
      lastChecked: new Date()
    });

  } catch (err) {
    console.error("Scrape error:", err.message);
    res.status(200).json({
      statusCode: 0,
      error: "Partial failure",
      lastChecked: new Date()
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
    } 
    else if (req.user.role === "sub-user" && req.user.parentUser) {
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
        let query = { statusCode: { $ne: 200 }, manualError: false };
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

exports.addManualErrorDomain = async (req, res) => {
  const { domain, category } = req.body;

  if (!domain || !category) {
    return res.status(400).json({ error: "Domain and category required" });
  }

 const site = await ScrapedSite.findOne({
  domain,
  user: req.user.parentUser || req.user._id
});

  if (!site) {
    return res.status(404).json({ error: "Domain not found" });
  }

  site.manualError = true;
  site.manualErrorCategory = category;
  site.manualErrorAddedAt = new Date();
  site.ignoredByUser = true;

  await site.save();

  res.json({ message: "Domain added to manual error list" });
};

exports.getManualErrorDomains = async (req, res) => {
  let query = { manualError: true };

  if (req.user.role !== "admin") {
    query.user = req.user.parentUser || req.user._id;
  }

  const domains = await ScrapedSite.find(query)
    .select("domain manualErrorCategory manualErrorReason lastChecked")
     .sort({ manualErrorAddedAt: -1 });

  res.json({ domains });
};

exports.restoreManualErrorDomain = async (req, res) => {
  const { domain } = req.params;

  await ScrapedSite.findOneAndUpdate(
    { domain },
    {
      manualError: false,
      manualErrorCategory: null,
      manualErrorAddedAt: null,
      ignoredByUser: false,
    }
  );

  res.json({ success: true });
};



exports.saveCategoryAffiliate = async (req, res) => {
  try {
    let { category, primaryLink, secondaryLink } = req.body;

    if (!category || (!primaryLink && !secondaryLink)) {
      return res.status(400).json({ error: "Missing data" });
    }

     const canManageAffiliate =
      req.user.role === "admin" ||
      req.user.role === "user" ||
      req.user.affiliateAccess === true;

    if (!canManageAffiliate) {
      return res.status(403).json({ error: "Affiliate access denied" });
    }

     const query = {
      brandCategory: category,
      user: req.user._id   // ✅ FIX
    };
   

    await ScrapedSite.updateMany(query, {
      $set: {
        ...(primaryLink && {
          "categoryAffiliateLinks.primary.url": primaryLink.trim(),
          "categoryAffiliateLinks.primary.status": "checking",
          "categoryAffiliateLinks.primary.reason": null,
        }),

        ...(secondaryLink && {
          "categoryAffiliateLinks.secondary.url": secondaryLink.trim(),
          "categoryAffiliateLinks.secondary.status": "checking",
          "categoryAffiliateLinks.secondary.reason": null,
        }),
        lastAffiliateCheck: new Date()
      }
    });

    res.json({ message: "Affiliate link saved for category" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save affiliate link" });
  }
};

const normalizeAffiliate = (url) => {
  try {
    const u = new URL(url);

    // Sort query params
    const params = [...u.searchParams.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join("&");

    return `${u.origin}${u.pathname}?${params}`;
  } catch {
    return "";
  }
};

exports.getAffiliateMismatch = async (req, res) => {
  try {
    const { category } = req.query;

    let query = {
      statusCode: 200,
      affiliateLink: { $ne: null },
      "categoryAffiliateLinks.primary.url": { $ne: "" },
      user: req.user._id 
    };

     if (category) {
      query.brandCategory = category;
    }

    const sites = await ScrapedSite.find(query)
      .select("domain affiliateLink categoryAffiliateLinks brandCategory")
      .lean();

    const errors = sites.filter(site => {
      const domainAff = normalizeAffiliate(site.affiliateLink);
      const primaryAff = normalizeAffiliate(
        site.categoryAffiliateLinks?.primary?.url
      );
      return domainAff !== primaryAff;
    });

    res.json({
      totalChecked: sites.length,
      mismatchCount: errors.length,
      errors
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to check affiliate mismatch" });
  }
};

exports.getAffiliateMismatchCounts = async (req, res) => {
  try {
    let query = {
      statusCode: 200,
      affiliateLink: { $ne: null },
      "categoryAffiliateLinks.primary.url": { $ne: "" },
      user: req.user._id 
    };

    const sites = await ScrapedSite.find(query)
      .select("brandCategory affiliateLink categoryAffiliateLinks")
      .lean();

    const counts = {};

    sites.forEach(site => {
      const domainAff = normalizeAffiliate(site.affiliateLink);
      const primaryAff = normalizeAffiliate(
        site.categoryAffiliateLinks?.primary.url
      );

      if (domainAff !== primaryAff) {
        counts[site.brandCategory] =
          (counts[site.brandCategory] || 0) + 1;
      }
    });

    res.json(counts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get mismatch counts" });
  }
};


exports.getCategoryAffiliate = async (req, res) => {
  try {
    const { category } = req.params;

     const canManageAffiliate =
      req.user.role === "admin" ||
      req.user.role === "user" ||
      req.user.affiliateAccess === true;

    if (!canManageAffiliate) {
      return res.status(403).json({ error: "Affiliate access denied" });
    }


    const site = await ScrapedSite.findOne({
      brandCategory: category,
      user: req.user._id,
      $or: [
        { "categoryAffiliateLinks.primary": { $ne: "" } },
        { "categoryAffiliateLinks.secondary": { $ne: "" } },
      ],
    })
      .select("categoryAffiliateLinks")
      .lean();

    return res.json({
      primaryLink: site?.categoryAffiliateLinks?.primary || "",
      secondaryLink: site?.categoryAffiliateLinks?.secondary || "",
    });
  } catch (err) {
    console.error("Error fetching category affiliate:", err);
    return res.status(500).json({
      error: "Failed to fetch affiliate link",
    });
  }
};

exports.getCategoryAffiliateStatus = async (req, res) => {
  try {

    const sites = await ScrapedSite.find({
      user: req.user._id,
      $or: [
        { "categoryAffiliateLinks.primary": { $ne: "" } },
        { "categoryAffiliateLinks.secondary": { $ne: "" } },
      ],
    })
      .select("brandCategory categoryAffiliateLinks")
      .lean();

    const map = {};

    sites.forEach(site => {
       if (!map[site.brandCategory]) {
          map[site.brandCategory] = {
            primary: false,
            secondary: false,
          };
        }

      if (site.categoryAffiliateLinks?.primary?.url) {
        map[site.brandCategory].primary = true;
      }

      if (site.categoryAffiliateLinks?.secondary?.url) {
        map[site.brandCategory].secondary = true;
      }
    });

    res.json(map);
  } catch (err) {
    res.status(500).json({ error: "Failed to load affiliate status" });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "_id name email role affiliateAccess"
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("getMe error:", err);
    res.status(500).json({ error: "Failed to fetch user" });
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