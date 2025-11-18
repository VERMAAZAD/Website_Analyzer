// routes/trackRoutes.js
const express = require('express');
const router = express.Router();
const trackController = require('../Controllers/trackController');

router.post('/log-visit', trackController.logVisit);
router.post('/outbound', trackController.outboundClick);

module.exports = router;
