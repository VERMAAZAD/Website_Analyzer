// Controllers/AffiliatelinkController.js
const ScrapedSite = require("../Models/ScrapedSite");

exports.categoryAffiliate = async (req, res) => {
  try {
    const affiliates = await ScrapedSite.aggregate([
      {
        $match: {
          categoryAffiliateLink: { $exists: true, $ne: "" }
        }
      },
      {
        $group: {
          _id: "$brandCategory",
          affiliateLink: { $first: "$categoryAffiliateLink" },
          affiliateStatus: { $first: "$affiliateCheckStatus" },
          affiliateCheckReason: { $first: "$affiliateCheckReason" },
          checking: { $max: "$affiliateCheckRunning" },
          lastAffiliateCheck: { $max: "$lastAffiliateCheck" }
        }
      }
    ]);

    return res.status(200).json(
      affiliates.map(item => ({
        category: item._id,
        affiliateLink: item.affiliateLink,
        affiliateStatus: item.affiliateStatus,
        affiliateReason: item.affiliateCheckReason,
        checking: item.checking,
        lastAffiliateCheck: item.lastAffiliateCheck
      }))
    );
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to load affiliates" });
  }
};
