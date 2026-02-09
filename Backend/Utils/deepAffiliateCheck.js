const axios = require("axios");
const cheerio = require("cheerio");
const UserAgent = require("user-agents");

async function deepAffiliateCheck(url) {
  try {
    const ua = new UserAgent().toString();

    const response = await axios.get(url, {
      timeout: 15000,
      maxRedirects: 10,
      headers: {
        "User-Agent": ua,
        "Accept-Language": "en-US,en;q=0.9"
      },
      validateStatus: () => true
    });

    const finalUrl = response.request.res.responseUrl;
    const html = response.data || "";

    // 🔴 Hard Fail Conditions
    if (!response.status || response.status >= 400) {
      return { status: "error", reason: "HTTP_ERROR" };
    }

    if (!finalUrl) {
      return { status: "error", reason: "NO_REDIRECT_TARGET" };
    }

    // 🔎 Tracking Param Check
    const trackingParams = ["subid", "iclid", "affid", "utm"];
    const trackingFound = trackingParams.some(p => finalUrl.includes(p));

    if (!trackingFound) {
      return { status: "error", reason: "TRACKING_LOST" };
    }

    // 🔎 Page Content Analysis
    const errorKeywords = [
      "offer expired",
      "campaign ended",
      "tracking disabled",
      "not available",
      "404",
      "page not found"
    ];

    const lowerHTML = html.toLowerCase();
    const contentError = errorKeywords.some(k => lowerHTML.includes(k));

    if (contentError) {
      return { status: "error", reason: "LANDING_PAGE_ERROR" };
    }

    // 🔎 Affiliate Script Detection
    const $ = cheerio.load(html);
    const scripts = $("script").toString();

    const affiliateSignals = [
      "clickbank",
      "hasoffers",
      "postback",
      "tracking",
      "affiliate"
    ];

    const trackingScriptFound = affiliateSignals.some(s =>
      scripts.toLowerCase().includes(s)
    );

    return {
      status: trackingScriptFound ? "ok" : "warning",
      finalUrl,
      trackingPreserved: trackingFound
    };

  } catch (err) {
    return { status: "error", reason: "NETWORK_ERROR" };
  }
}

module.exports = deepAffiliateCheck;
