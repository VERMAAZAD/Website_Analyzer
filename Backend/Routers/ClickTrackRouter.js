const express = require("express");
const router = express.Router();

const { clickTracker, trackSummary } = require("../Controllers/ClickTrackController");

// Routes
router.post("/clicks", clickTracker);
router.get('/summary', trackSummary);

module.exports = router;
