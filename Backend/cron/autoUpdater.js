const cron = require('node-cron');
const { updateChangedDomains } = require('../Controllers/UpdaterController');


const fakeReq = {
  user: {
    role: 'admin',   
    _id: 'admin-cron-job',
  },
};

const fakeRes = {
  json: (data) => console.log('Cron Update Done:', data),
  status: (code) => ({
    json: (err) => console.error(`Cron Update Failed [${code}]:`, err),
  }),
};

let isUpdating = false;

cron.schedule("0 * * * *", async () => {  
  if (isUpdating) {
    return;
  }

  isUpdating = true;

  try {
    await updateChangedDomains(fakeReq, fakeRes);
  } catch (err) {
    
  } finally {
    isUpdating = false;
   
  }
});


const deepAffiliateCheck = require("../Utils/deepAffiliateCheck");
const ScrapedSite = require("../Models/ScrapedSite");

let affiliateCronRunning = false;

function normalizeUrl(url) {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}${u.pathname.replace(/\/+$/, "")}`;
  } catch {
    return url;
  }
}

cron.schedule("0 */2 * * *", async () => {
  if (affiliateCronRunning) {
    console.log("⏭ Affiliate cron already running");
    return;
  }

  affiliateCronRunning = true;
  console.log("🔄 Affiliate cron started");

  try {
    const sites = await ScrapedSite.find({
      $or: [
        { "categoryAffiliateLinks.primary.url": { $ne: "" } },
        { "categoryAffiliateLinks.secondary.url": { $ne: "" } }
      ]
    });

    for (const site of sites) {
      try {
        const primary = site.categoryAffiliateLinks.primary;
        const secondary = site.categoryAffiliateLinks.secondary;

        let primaryResult = null;
        let secondaryResult = null;

        /* ===== PRIMARY ===== */
        if (primary?.url) {
          primaryResult = await deepAffiliateCheck(primary.url);
          Object.assign(primary, {
            status: primaryResult.status,
            reason: primaryResult.reason || null,
            finalUrl: primaryResult.finalUrl || "",
            lastChecked: new Date(),
            redirectMismatch: false // always reset
          });
        }

        /* ===== SECONDARY ===== */
        if (secondary?.url) {
          secondaryResult = await deepAffiliateCheck(secondary.url);
          Object.assign(secondary, {
            status: secondaryResult.status,
            reason: secondaryResult.reason || null,
            lastChecked: new Date()
          });
        }

        /* ===== REDIRECT MISMATCH ===== */
        if (
          primaryResult?.status === "ok" &&
          secondaryResult?.status === "ok" &&
          primaryResult.finalUrl
        ) {
          const primaryFinal = normalizeUrl(primaryResult.finalUrl);
          const primaryOriginal = normalizeUrl(primary.url);
          const secondaryExpected = normalizeUrl(secondary.url);

          const didRedirect = primaryFinal !== primaryOriginal;

          if (didRedirect && primaryFinal !== secondaryExpected) {
            primary.redirectMismatch = true;
            primary.reason = "REDIRECT_MISMATCH";
          }
        }

        site.lastAffiliateCheck = new Date();
        await site.save();

      } catch (err) {
        console.error(
          `❌ Affiliate check failed for ${site.domain}:`,
          err.message
        );
      }
    }
  } finally {
    affiliateCronRunning = false;
    console.log("✅ Affiliate cron finished");
  }
});

