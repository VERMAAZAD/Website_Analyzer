// routes/analyticsRoutes.js
const express = require('express');
const router = express.Router();
const analyticsController = require('../Controllers/AnalyticsController');

router.get('/domain-stats', analyticsController.domainStats);
router.post('/flow-count', analyticsController.flowCount);
router.get('/recent-flows', analyticsController.recentFlows);
router.get('/user-path/:uid', analyticsController.getUserPath);

module.exports = router;
