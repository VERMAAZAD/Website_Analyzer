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
const appendToSheet = require("../Utils/googleSheetLogger");

let affiliateCronRunning = false;

function normalizeUrl(url) {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}${u.pathname.replace(/\/+$/, "")}`;
  } catch {
    return url;
  }
}

cron.schedule("0 * * * *", async () => {
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
    }).populate("user", "email");

    // Group broken domains per user + category
    const brokenByUserCategory = {};

    for (const site of sites) {
      try {
        const primary = site.categoryAffiliateLinks.primary;
        const secondary = site.categoryAffiliateLinks.secondary;


        let primaryError = false;
        let secondaryError = false;
        let redirectMismatch = false;

        // Check primary link
        if (primary?.url) {
         let primaryResult = await deepAffiliateCheck(primary.url);
          Object.assign(primary, {
            status: primaryResult.status,
            reason: primaryResult.reason || null,
            finalUrl: primaryResult.finalUrl || "",
            lastChecked: new Date(),
            redirectMismatch: false
          });
            if (primary.status === "error") primaryError = true;
        }

        // Check secondary link
        if (!primaryError && secondary?.url) {
         let secondaryResult = await deepAffiliateCheck(secondary.url);
          Object.assign(secondary, {
            status: secondaryResult.status,
            reason: secondaryResult.reason || null,
            lastChecked: new Date()
          });
            if (secondary.status === "error") secondaryError = true;
        }

        // Check redirect mismatch
        if (!primaryError && !secondaryError && primary?.url && secondary?.url) {
          const primaryFinal = normalizeUrl(primaryResult.finalUrl);
          const secondaryExpected = normalizeUrl(secondary.url);

          if (primaryFinal !== secondaryExpected) {
            redirectMismatch = true;
            primary.redirectMismatch = true;
            primary.reason = "REDIRECT_MISMATCH";
          }
        }

        const isBrokenNow = primaryError || secondaryError || redirectMismatch;

        const userId = site.user?._id;
        const category = site.brandCategory;

        if (isBrokenNow && userId && category) {
          const key = `${userId}-${category}`;
          if (!brokenByUserCategory[key]) {
            brokenByUserCategory[key] = {
              email: site.user.email,
              category,
              domains: []
            };
          }

          brokenByUserCategory[key].domains.push({
            domain: site.domain,
            primary,
            secondary,
            primaryError,
            secondaryError,
            redirectMismatch
          });

          site.affiliateAlertSent = true;
          site.affiliateAlertSentAt = new Date();
          site.issueDate = new Date();
        } else {
          // Reset if fixed
          site.affiliateAlertSent = false;
          site.affiliateAlertSentAt = null;
          site.issueDate = null;
        }

        site.lastAffiliateCheck = new Date();
        await site.save();

      } catch (err) {
        console.error(`❌ Affiliate check failed for ${site.domain}:`, err.message);
      }
    }


    const rows = [];

for (const alert of Object.values(brokenByUserCategory)) {
  for (const domainData of alert.domains) {
    rows.push([
      new Date().toISOString(),
      alert.email,
      alert.category,
      domainData.domain,
      domainData.primary?.url || "",
      domainData.primary?.status || "",
      domainData.secondary?.url || "",
      domainData.secondary?.status || "",
      domainData.redirectMismatch ? "YES" : "NO"
    ]);
  }
}

if (rows.length > 0) {
  await appendToSheet(rows);
  console.log("📊 Affiliate issues saved to Google Sheets");
}

  } finally {
    affiliateCronRunning = false;
    console.log("✅ Affiliate cron finished");
  }
});

