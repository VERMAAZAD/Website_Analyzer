const express = require("express");
const { checkTraffic, GetallUniqueDomains, domainTraffic, GetLast7DaysTraffic, GetTopCountries } = require("../Controllers/AdsWebsiteController");
const ensureAuthenticated = require("../Middlewares/Auth");
const router = express.Router();

// Routes
router.post("/traffic-check", checkTraffic);
router.get('/unique/domains', ensureAuthenticated, GetallUniqueDomains);
router.get('/stats/domain/:domain', ensureAuthenticated, domainTraffic);
router.get("/unique/domains/last7days", ensureAuthenticated, GetLast7DaysTraffic);
router.get("/stats/top-countries", ensureAuthenticated, GetTopCountries);
module.exports = router;
