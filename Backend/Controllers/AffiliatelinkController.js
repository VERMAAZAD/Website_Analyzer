const User = require("../Models/User");
const ScrapedSite = require("../Models/ScrapedSite");

exports.categoryAffiliate = async (req, res) => {
  try {
    const ownerId =
    req.user.role === "sub-user"
      ? req.user.parentUser
      : req.user._id;

    const affiliates = await ScrapedSite.aggregate([
  {
    $match: {
      user: ownerId,
      $or: [
        { "categoryAffiliateLinks.primary.url": { $ne: "" } },
        { "categoryAffiliateLinks.secondary.url": { $ne: "" } }
      ]
    }
  },

  {
     $sort: { lastAffiliateCheck: -1 }
  },

  {
    $group: {
      _id: "$brandCategory",
          primary: { $first: "$categoryAffiliateLinks.primary" },
          secondary: { $first: "$categoryAffiliateLinks.secondary" }
    }
  }
]);


    res.json(
      affiliates.map(a => ({
        category: a._id,
        categoryAffiliateLinks: {
          primary: a.primary,
          secondary: a.secondary
        }
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load affiliates" });
  }
};
