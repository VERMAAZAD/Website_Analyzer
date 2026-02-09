const axios = require("axios");
const cheerio = require("cheerio");
const UserAgent = require("user-agents");

async function deepAffiliateCheck(url) {
  const ua = new UserAgent().toString();

  try {
    const response = await axios.get(url, {
      timeout: 25000,
      maxRedirects: 10,
      headers: {
        "User-Agent": ua,
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9"
      },
      validateStatus: () => true
    });

    const status = response.status;

    // 🔍 Final URL (reliable)
    const finalUrl =
      response.request?.res?.responseUrl || url;

    // ❌ HARD FAILS ONLY
    if (status >= 500) {
      return {
        status: "error",
        reason: "SERVER_ERROR",
        finalUrl
      };
    }

    // ⚠️ TEMP BLOCK / BOT PROTECTION
    if (status === 403 || status === 429) {
      return {
        status: "warning",
        reason: "TEMP_BLOCKED",
        finalUrl
      };
    }

    // ❌ Invalid response
    if (!status || status >= 400) {
      return {
        status: "error",
        reason: "HTTP_ERROR",
        finalUrl
      };
    }

    // 🔎 Light landing page check (VERY SAFE)
    const html = typeof response.data === "string" ? response.data : "";
    if (html.length > 50) {
      const $ = cheerio.load(html);
      const text = $("body").text().toLowerCase();

      const fatalKeywords = [
        "offer expired",
        "campaign ended",
        "link expired",
        "no longer available",
        "page not found",
        "404 error"
      ];

      if (fatalKeywords.some(k => text.includes(k))) {
        return {
          status: "error",
          reason: "OFFER_EXPIRED",
          finalUrl
        };
      }
    }

    // ✅ SUCCESS
    return {
      status: "ok",
      finalUrl
    };

  } catch (err) {
    // ⏳ TIMEOUT = SLOW, NOT DEAD
    if (err.code === "ECONNABORTED") {
      return {
        status: "warning",
        reason: "SLOW_RESPONSE"
      };
    }

    return {
      status: "error",
      reason: "NETWORK_ERROR"
    };
  }
}

module.exports = deepAffiliateCheck;
