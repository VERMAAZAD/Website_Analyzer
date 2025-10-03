const express = require("express");
const { checkTraffic, GetallUniqueDomains, domainTraffic, GetLast7DaysTraffic } = require("../Controllers/TrafficCheckerController");
const router = express.Router();


// Routes
router.post("/traffic-check", checkTraffic);
router.get('/unique/domains', GetallUniqueDomains);
router.get('/stats/domain/:domain', domainTraffic);
// router.get('/stats/domain/:domain/daily', GetDailyDomainTraffic);
router.get("/unique/domains/last7days", GetLast7DaysTraffic);

module.exports = router;
