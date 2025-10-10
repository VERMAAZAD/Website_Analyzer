const express = require("express");
const { checkTraffic, GetallUniqueDomains, domainTraffic, GetLast7DaysTraffic } = require("../Controllers/TrafficCheckerController");
const router = express.Router();
const ensureAuthenticated = require('../Middlewares/Auth');


// Routes
router.post("/traffic-check", checkTraffic);
router.get('/unique/domains', ensureAuthenticated, GetallUniqueDomains);
router.get('/stats/domain/:domain', ensureAuthenticated, domainTraffic);
router.get("/unique/domains/last7days", ensureAuthenticated, GetLast7DaysTraffic);

module.exports = router;
