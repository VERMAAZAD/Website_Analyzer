const express = require('express');
const router = express.Router();
const { handleRedirect } = require('../Controllers/LinksDetectorRedirectController');

// GET /r/:linkId
router.get('/r/:linkId', handleRedirect);

module.exports = router;
