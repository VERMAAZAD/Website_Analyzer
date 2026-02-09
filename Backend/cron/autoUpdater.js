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

cron.schedule("0 * * * *", async () => {
  if (affiliateCronRunning) {
    console.log("⏭ Affiliate cron already running, skipping");
    return;
  }

  affiliateCronRunning = true;
  console.log("🔄 Affiliate cron started");

  try {
    const affiliates = await ScrapedSite.find({
      categoryAffiliateLink: { $ne: "" }
    });

    for (const site of affiliates) {
      try {
        site.affiliateCheckRunning = true;
        site.affiliateCheckStatus = "checking";
        await site.save();

        const result = await deepAffiliateCheck(site.categoryAffiliateLink);

        site.affiliateCheckStatus = result.status;
        site.affiliateCheckReason = result.reason || null;
        site.lastAffiliateCheck = new Date();
      } catch (e) {
        site.affiliateCheckStatus = "error";
        site.affiliateCheckReason = "CRON_FAILED";
      } finally {
        site.affiliateCheckRunning = false;
        await site.save();
      }
    }
  } finally {
    affiliateCronRunning = false;
    console.log("✅ Affiliate cron finished");
  }
});
