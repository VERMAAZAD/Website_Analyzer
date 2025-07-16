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
    const response = await axios.get(domain);
    const html = response.data;
    const $ = cheerio.load(html);

    const h1 = $('h1').map((_, el) => $(el).text().trim()).get();
    const h2 = $('h2').map((_, el) => $(el).text().trim()).get();
    const images = $('img').map((_, el) => $(el).attr('src')).get();
    const altTags = $('img').map((_, el) => $(el).attr('alt') || '').get();
    const canonicals = $('link[rel="canonical"]').map((_, el) => $(el).attr('href')).get();
    const title = $('title').text().trim();
    const description = $('meta[name="description"]').attr('content') || '';
    const wordCount = $('body').text().split(/\s+/).filter(Boolean).length;
    const schemaPresent = $('script[type="application/ld+json"]').length > 0;

    // Fetch robots.txt
    let robotsTxt = '';
    try {
      const robotsUrl = new URL('/robots.txt', domain).href;
      const robotsRes = await axios.get(robotsUrl);
      robotsTxt = robotsRes.data;
    } catch (err) {
      robotsTxt = 'Not Found or Inaccessible';
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
      statusCode: response.status,
      lastChecked: new Date(),
      
    });

  } catch (error) {
    console.error('Scrape Error:', error.message);
    res.status(500).json({ error: 'Something went wrong while scraping.' });
  }
};

// [2] Save scraped data to DB
exports.saveScrapedData = async (req, res) => {
  const { domain, data, brandCategory  } = req.body;

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
    const sites = await ScrapedSite.find({ user: req.user._id }, 'domain');
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
    const site = await ScrapedSite.findOne({ domain: baseDomain, user: req.user._id });

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
// ✅ Corrected controller
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

// [8] Get domains with non-200 status
exports.getErrorDomains = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const errorDomains = await ScrapedSite.find({
      user: req.user._id,
      statusCode: { $ne: 200 }
    });

    res.json(errorDomains);
  } catch (err) {
    console.error('Error fetching error domains:', err.message);
    res.status(500).json({ error: 'Failed to fetch error domains' });
  }
};
