const express = require('express');
const router = express.Router();
const { createLink, getLinkStats } = require('../Controllers/LinksDetectorController');

// POST /api/links
router.post('/', createLink);

// GET /api/links/:linkId/stats
router.get('/:linkId/stats', getLinkStats);

module.exports = router;
