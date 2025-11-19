// UsertrackRouter.js

const express = require('express');
const router = express.Router();
const { logVisit, outboundClick } = require('../Controllers/TrackController');


router.post('/log-visit', logVisit);
router.post('/outbound', outboundClick);

module.exports = router;
