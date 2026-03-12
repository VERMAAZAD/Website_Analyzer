const cron = require('node-cron');
const { updateChangedDomains } = require('../Controllers/UpdaterController');
const CronLock = require('../Models/CronLock');
const deepAffiliateCheck = require("../Utils/deepAffiliateCheck");
const { compareRedirectDestinations } = require("../Utils/deepAffiliateCheck");
const ScrapedSite = require("../Models/ScrapedSite");
const appendToSheet = require("../Utils/googleSheetLogger");

// ============================================
// DOMAIN UPDATE CRON (Unchanged)
// ============================================

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

cron.schedule("0 * * * *", async () => {
  const lockKey = 'domain-update';
  
  try {
    const lock = await CronLock.findOneAndUpdate(
      { key: lockKey },
      { 
        key: lockKey,
        lockedAt: new Date(),
        expiresAt: new Date(Date.now() + 75 * 60 * 1000)
      },
      { upsert: true, new: true }
    );

    if (lock.lockedAt !== new Date().toISOString()) {
      console.log('Another instance is already updating');
      return;
    }

    await updateChangedDomains(fakeReq, fakeRes);
    await CronLock.deleteOne({ key: lockKey });
  } catch (err) {
    console.error('❌ Domain update cron failed:', {
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ============================================
// AFFILIATE CHECK CRON - CHECK PER CATEGORY ONLY
// NOT per domain (all domains in same category have same links)
// ============================================

let affiliateCronRunning = false;
const CRON_TIMEOUT_MS = 55 * 60 * 1000;

cron.schedule("*/5 * * * *", async () => {
  if (affiliateCronRunning) {
    console.log("⏭️ Affiliate cron already running");
    return;
  }

  affiliateCronRunning = true;

  const timeoutHandle = setTimeout(() => {
    console.error('⏱️ Affiliate cron exceeded timeout!');
    affiliateCronRunning = false;
  }, CRON_TIMEOUT_MS);

  console.log("🔄 Affiliate cron started at", new Date().toISOString());

  try {
    // ========================================
    // STEP 1: Get all categories with affiliate links
    // Use aggregation to group by category (much more efficient!)
    // ========================================
    const categoriesData = await ScrapedSite.aggregate([
      {
        $match: {
          $or: [
            { "categoryAffiliateLinks.primary.url": { $ne: "" } },
            { "categoryAffiliateLinks.secondary.url": { $ne: "" } }
          ]
        }
      },
      {
        $group: {
          _id: {
            category: "$brandCategory",
            userId: "$user"
          },
          // Get first document from each category (they all have same links!)
          primary: { $first: "$categoryAffiliateLinks.primary" },
          secondary: { $first: "$categoryAffiliateLinks.secondary" },
          email: { $first: "$user" },
          domainsCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "email",
          foreignField: "_id",
          as: "userEmail"
        }
      },
      {
        $unwind: "$userEmail"
      }
    ]);

    console.log(`📊 Found ${categoriesData.length} categories with affiliate links`);

    // Track status changes
    const statusChanges = [];

    // ========================================
    // STEP 2: CHECK EACH CATEGORY ONCE
    // ========================================
    for (const catData of categoriesData) {
      try {
        const categoryName = catData._id.category;
        const userId = catData._id.userId;
        const domainsInCategory = catData.domainsCount;
        const userEmail = catData.userEmail.email;

        console.log(`\n🔍 Checking category: ${categoryName} (${domainsInCategory} domains)`);

        const primary = catData.primary;
        const secondary = catData.secondary;

        let primaryResult = null;
        let secondaryResult = null;
        let primaryError = false;
        let secondaryError = false;
        let primaryReason = null;
        let secondaryReason = null;

        // ========================================
        // CHECK PRIMARY LINK (ONCE per category)
        // ========================================
        if (primary?.url) {
          try {
            console.log(`   📍 Primary: ${primary.url}`);
            primaryResult = await deepAffiliateCheck(primary.url);

            primaryError = primaryResult.status === "error";
            primaryReason = primaryResult.reason;

            // Update primary data
            primary.status = primaryResult.status;
            primary.reason = primaryResult.reason || null;
            primary.finalUrl = primaryResult.finalUrl || "";
            primary.redirectChain = primaryResult.redirectChain || [];
            primary.responseTime = primaryResult.responseTime || 0;
            primary.httpStatus = primaryResult.httpStatus || null;
            primary.lastChecked = new Date();
            primary.redirectMismatch = false;

            console.log(`      Status: ${primaryResult.status} ${primaryResult.reason ? `(${primaryResult.reason})` : ''}`);

          } catch (err) {
            console.error(`      ❌ Primary check failed:`, err.message);
            primaryError = true;
            primaryReason = "CHECK_FAILED";
            primary.status = "error";
            primary.reason = "CHECK_FAILED";
            primary.finalUrl = "";
            primary.redirectChain = [];
            primary.lastChecked = new Date();
          }
        }

        // ========================================
        // CHECK SECONDARY LINK (ONCE per category)
        // ========================================
        if (secondary?.url) {
          try {
            console.log(`   📍 Secondary: ${secondary.url}`);
            secondaryResult = await deepAffiliateCheck(secondary.url);

            secondaryError = secondaryResult.status === "error";
            secondaryReason = secondaryResult.reason;

            // Update secondary data
            secondary.status = secondaryResult.status;
            secondary.reason = secondaryResult.reason || null;
            secondary.finalUrl = secondaryResult.finalUrl || "";
            secondary.redirectChain = secondaryResult.redirectChain || [];
            secondary.responseTime = secondaryResult.responseTime || 0;
            secondary.httpStatus = secondaryResult.httpStatus || null;
            secondary.lastChecked = new Date();

            console.log(`      Status: ${secondaryResult.status} ${secondaryResult.reason ? `(${secondaryResult.reason})` : ''}`);

          } catch (err) {
            console.error(`      ❌ Secondary check failed:`, err.message);
            secondaryError = true;
            secondaryReason = "CHECK_FAILED";
            secondary.status = "error";
            secondary.reason = "CHECK_FAILED";
            secondary.finalUrl = "";
            secondary.redirectChain = [];
            secondary.lastChecked = new Date();
          }
        }

        // ========================================
        // CHECK REDIRECT MISMATCH
        // ========================================
        if (!primaryError && !secondaryError && primaryResult && secondaryResult) {
          try {
            const doRedirectsMatch = compareRedirectDestinations(
              primaryResult.finalUrl,
              secondaryResult.finalUrl
            );

            if (!doRedirectsMatch) {
              primary.redirectMismatch = true;
              primary.status = "error";
              primary.reason = "REDIRECT_MISMATCH";
              primaryError = true;
              primaryReason = "REDIRECT_MISMATCH";
              console.log(`      ⚠️  REDIRECT MISMATCH DETECTED!`);
            } else {
              console.log(`      ✅ Redirects match!`);
            }
          } catch (err) {
            console.error(`      ❌ Redirect comparison failed:`, err.message);
          }
        }

        // ========================================
        // TRACK STATUS CHANGES FOR THIS CATEGORY
        // ========================================
        const isBrokenNow = primaryError || secondaryError;

        // Get current status from database (check if was broken before)
        const firstSiteInCategory = await ScrapedSite.findOne({
          user: userId,
          brandCategory: categoryName
        });

        const wasBrokenBefore = firstSiteInCategory?.affiliateAlertSent || false;

        // NEW ISSUE: Working → Broken
        if (isBrokenNow && !wasBrokenBefore) {
          console.log(`      🚨 NEW ISSUE: Links now broken for category`);

          statusChanges.push({
            timestamp: new Date(),
            email: userEmail,
            category: categoryName,
            status: '❌ Broken',
            issue: translateReason(primaryReason || secondaryReason)
          });
        }

        // RECOVERED: Broken → Working
        else if (!isBrokenNow && wasBrokenBefore) {
          console.log(`      ✅ RECOVERED: Links working again for category`);

          statusChanges.push({
            timestamp: new Date(),
            email: userEmail,
            category: categoryName,
            status: '✅ Working',
            issue: '(recovered)'
          });
        }

        // ========================================
        // UPDATE ALL DOMAINS IN THIS CATEGORY
        // This is the key optimization - one update for all domains!
        // ========================================
        const updateResult = await ScrapedSite.updateMany(
          {
            user: userId,
            brandCategory: categoryName
          },
          {
            $set: {
              'categoryAffiliateLinks.primary': primary,
              'categoryAffiliateLinks.secondary': secondary,
              'affiliateAlertSent': isBrokenNow,
              'affiliateAlertSentAt': isBrokenNow ? new Date() : null,
              'issueDate': isBrokenNow ? new Date() : null,
              'lastAffiliateCheck': new Date()
            }
          }
        );

        console.log(`   ✅ Updated ${updateResult.modifiedCount} domains in category: ${categoryName}`);

      } catch (err) {
        console.error(`❌ Check failed for category:`, err.message);
      }
    }

    // ========================================
    // SAVE STATUS CHANGES TO GOOGLE SHEETS
    // ========================================
    if (statusChanges.length > 0) {
      console.log(`\n📊 ${statusChanges.length} category status changes detected`);
      console.log(`   Logging to Google Sheets...`);

      try {
        // Format rows for sheet (only 5 columns)
        const rows = statusChanges.map(change => {
          const dateStr = change.timestamp.toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: '2-digit'
          });
          const timeStr = change.timestamp.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          });

          return [
            `${dateStr} ${timeStr}`,
            change.email || 'Unknown',
            change.category || 'Unknown',
            change.status,
            change.issue
          ];
        });

        // Append to sheet
        await appendToSheet(rows);
        console.log(`   ✅ Successfully logged ${rows.length} changes`);
      } catch (err) {
        console.error('❌ Failed to save to Google Sheets:', err.message);
      }
    } else {
      console.log(`\n✅ No status changes - all affiliate links for all categories are stable!`);
    }

  } catch (err) {
    console.error("❌ Affiliate cron job failed:", err.message);
  } finally {
    clearTimeout(timeoutHandle);
    affiliateCronRunning = false;
    console.log("✅ Affiliate cron finished at", new Date().toISOString());
  }
});

// ============================================
// HELPER: Translate technical terms to plain English
// ============================================
function translateReason(reason) {
  const reasonMap = {
    'REDIRECT_MISMATCH': 'Links redirect differently',
    'SERVER_ERROR': 'Server error (5xx)',
    'HTTP_ERROR': '404 Not Found',
    'OFFER_EXPIRED': 'Offer expired',
    'TEMP_BLOCKED': 'Temporarily blocked',
    'TIMEOUT': 'Link timeout',
    'DOMAIN_NOT_FOUND': 'Domain down',
    'CONNECTION_REFUSED': 'Connection refused',
    'NETWORK_ERROR': 'Network error',
    'SLOW_RESPONSE': 'Slow response',
    'CHECK_FAILED': 'Check failed',
    'RATE_LIMITED': 'Rate limited'
  };

  return reasonMap[reason] || reason || 'Unknown';
}