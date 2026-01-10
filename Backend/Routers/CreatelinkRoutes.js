const express = require("express");
const router = express.Router();
const ensureAuthenticated = require("../Middlewares/Auth");
const ChickLinkKey = require("../Middlewares/ChickLinkKey");
const { create, analytics, getAllLinks, funnel, updateChain, deleteLink, deleteChain, getAllFolders, dailyAnalytics, getLinkBySlug, updateOriginalUrl } = require("../Controllers/LinkController");


router.post("/create", ensureAuthenticated, ChickLinkKey, create);
router.get("/analytics/:slug", ensureAuthenticated, ChickLinkKey, analytics );
router.get("/links", ensureAuthenticated, ChickLinkKey, getAllLinks);
router.get("/funnel/:slug", ensureAuthenticated, ChickLinkKey, funnel);
router.patch("/chain/:slug", ensureAuthenticated, ChickLinkKey, updateChain);
router.delete("/delete/link/:slug", ensureAuthenticated, ChickLinkKey, deleteLink);
router.delete("/delete/chain/:groupId", ensureAuthenticated, ChickLinkKey, deleteChain);
router.get("/folders", ensureAuthenticated, getAllFolders);
router.get("/analytics/daily/:slug", ensureAuthenticated, dailyAnalytics);
router.get("/link/:slug", ensureAuthenticated, ChickLinkKey, getLinkBySlug);
router.put("/update-url/:slug", ensureAuthenticated, ChickLinkKey, updateOriginalUrl);


module.exports = router;
