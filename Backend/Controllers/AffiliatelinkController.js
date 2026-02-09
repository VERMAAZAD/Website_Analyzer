const deepAffiliateCheck = require("../Utils/deepAffiliateCheck");
const ScrapedSite = require('../Models/ScrapedSite');

exports.categoryAffiliate = async (req, res) => {
  try {
    const affiliates = await ScrapedSite.aggregate([
      {
        $match: {
          categoryAffiliateLink: { $ne: "", $exists: true }
        }
      },
      {
        $group: {
          _id: "$brandCategory",
          affiliateLink: { $first: "$categoryAffiliateLink" }
        }
      }
    ]);

    const results = [];

    for (const item of affiliates) {
      const check = await deepAffiliateCheck(item.affiliateLink);

      results.push({
        category: item._id,
        affiliateLink: item.affiliateLink,
        affiliateStatus: check.status,
        errorReason: check.reason || null,
        finalUrl: check.finalUrl || null
      });
    }

    res.json(results);
  } catch (err) {
    console.error("Affiliate deep check error:", err);
    res.status(500).json({ error: "Affiliate validation failed" });
  }
};
