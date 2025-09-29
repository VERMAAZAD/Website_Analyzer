const express = require("express");
const router = express.Router();

const { clickTracker, trackSummery } = require("../Controllers/ClickTrackController");

// Routes
router.post("/clicks", clickTracker);
router.get('/summary', trackSummery);

module.exports = router;
