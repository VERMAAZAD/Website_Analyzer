const express = require("express");
const { checkTraffic, GetSiteState } = require("../Controllers/TrafficCheckerController");
const router = express.Router();


// Routes
router.post("/traffic-check", checkTraffic);
router.get('/stats/:siteId', GetSiteState);

module.exports = router;
