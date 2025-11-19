// UserAnalyticsRouter.js

const express = require('express');
const router = express.Router();
const { domainStats, flowCount, recentFlows, getUserPath } = require('../Controllers/AnalyticsController');

router.get('/domain-stats', domainStats);
router.post('/flow-count', flowCount);
router.get('/recent-flows', recentFlows);
router.get('/user-path/:uid', getUserPath);

module.exports = router;
