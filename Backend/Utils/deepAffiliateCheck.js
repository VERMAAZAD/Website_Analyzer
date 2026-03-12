const axios = require("axios");
const cheerio = require("cheerio");
const UserAgent = require("user-agents");

async function deepAffiliateCheck(url) {
  const ua = new UserAgent().toString();
  const startTime = Date.now();
  const redirectChain = [];

  try {
    // ✅ Create axios instance with redirect tracking
    const axiosInstance = axios.create({
      timeout: 25000,
      maxRedirects: 15,  // Allow more redirects (your chain has 4-5)
      headers: {
        "User-Agent": ua,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1"
      },
      validateStatus: () => true
    });

    // ✅ Track redirects by intercepting response
    axiosInstance.interceptors.response.use(response => {
      const currentUrl = response.config.url;
      if (!redirectChain.includes(currentUrl)) {
        redirectChain.push(currentUrl);
      }
      return response;
    });

    const response = await axiosInstance.get(url);
    const responseTime = Date.now() - startTime;
    const status = response.status;

    // ✅ Get final URL after all redirects
    let finalUrl = response.request?.res?.responseUrl || 
                   response.config?.url || 
                   url;

    // ✅ Add final URL to chain if not already there
    if (!redirectChain.includes(finalUrl)) {
      redirectChain.push(finalUrl);
    }

    // Normalize final URL for comparison
    const normalizedFinalUrl = normalizeUrl(finalUrl);

    console.log(`📍 Redirect Chain for ${url}:`);
    redirectChain.forEach((u, i) => {
      console.log(`   ${i + 1}. ${u}`);
    });
    console.log(`   ➜ FINAL: ${normalizedFinalUrl}`);

    // ❌ SERVER ERROR (5xx)
    if (status >= 500) {
      return {
        status: "error",
        reason: "SERVER_ERROR",
        finalUrl: normalizedFinalUrl,
        redirectChain,
        responseTime,
        httpStatus: status
      };
    }

    // ⚠️ TEMPORARY BLOCK (403, 429)
    if (status === 403 || status === 429) {
      return {
        status: "warning",
        reason: "TEMP_BLOCKED",
        finalUrl: normalizedFinalUrl,
        redirectChain,
        responseTime,
        httpStatus: status
      };
    }

    // ❌ CLIENT ERROR (4xx) - but 401/403 might be legitimate
    if (status >= 400 && status < 500) {
      return {
        status: "error",
        reason: "HTTP_ERROR",
        finalUrl: normalizedFinalUrl,
        redirectChain,
        responseTime,
        httpStatus: status
      };
    }

    // 🔍 SAFE CONTENT CHECK - Only for 200 responses
    if (status === 200 && response.data) {
      const html = typeof response.data === "string" ? response.data : "";
      
      if (html.length > 100) {
        const $ = cheerio.load(html);
        const text = $("body").text().toLowerCase();

        // ⚠️ Keywords that indicate the page/offer is expired
        const fatalKeywords = [
          "offer expired",
          "campaign ended",
          "link expired",
          "no longer available",
          "page not found",
          "404 error",
          "this link has expired",
          "page has been removed",
          "content not available"
        ];

        if (fatalKeywords.some(k => text.includes(k))) {
          return {
            status: "error",
            reason: "OFFER_EXPIRED",
            finalUrl: normalizedFinalUrl,
            redirectChain,
            responseTime,
            httpStatus: status
          };
        }
      }
    }

    // ✅ SUCCESS
    return {
      status: "ok",
      finalUrl: normalizedFinalUrl,
      redirectChain,
      responseTime,
      httpStatus: status
    };

  } catch (err) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ Check failed for ${url}:`, err.message);

    // Network-specific errors
    if (err.code === "ECONNABORTED") {
      return {
        status: "warning",
        reason: "SLOW_RESPONSE",
        finalUrl: url,
        redirectChain,
        responseTime,
        httpStatus: null
      };
    }

    if (err.code === "ECONNREFUSED") {
      return {
        status: "error",
        reason: "CONNECTION_REFUSED",
        finalUrl: url,
        redirectChain,
        responseTime,
        httpStatus: null
      };
    }

    if (err.code === "ENOTFOUND") {
      return {
        status: "error",
        reason: "DOMAIN_NOT_FOUND",
        finalUrl: url,
        redirectChain,
        responseTime,
        httpStatus: null
      };
    }

    if (err.code === "ETIMEDOUT") {
      return {
        status: "error",
        reason: "TIMEOUT",
        finalUrl: url,
        redirectChain,
        responseTime,
        httpStatus: null
      };
    }

    // Generic network error
    return {
      status: "error",
      reason: "NETWORK_ERROR",
      finalUrl: url,
      redirectChain,
      responseTime,
      httpStatus: null
    };
  }
}

/**
 * Normalize URLs for comparison
 * Removes trailing slashes, query params for core domain comparison
 * 
 * For redirect matching:
 * - discountit888.com/mitolyn/?iclid=... → mitolyn.com/welcome/?...
 * 
 * We compare the DOMAIN + main path structure, ignoring tracking params
 */
function normalizeUrl(url) {
  try {
    const u = new URL(url);
    
    // Get domain + main path (ignore params)
    const domain = u.hostname;
    let pathname = u.pathname.replace(/\/+$/, "");  // Remove trailing slashes
    
    // Reconstruct normalized URL
    return `${u.protocol}//${domain}${pathname}`;
  } catch {
    return url;
  }
}

/**
 * Compare two URLs considering redirect chains
 * Returns true if they are effectively the same destination
 */
function compareRedirectDestinations(primaryFinalUrl, secondaryFinalUrl) {
  const p = normalizeUrl(primaryFinalUrl);
  const s = normalizeUrl(secondaryFinalUrl);
  
  console.log(`🔍 Comparing redirects:`);
  console.log(`   Primary Final:   ${p}`);
  console.log(`   Secondary Final: ${s}`);
  console.log(`   Match: ${p === s ? '✅ YES' : '❌ NO'}`);
  
  return p === s;
}

module.exports = deepAffiliateCheck;
module.exports.normalizeUrl = normalizeUrl;
module.exports.compareRedirectDestinations = compareRedirectDestinations;