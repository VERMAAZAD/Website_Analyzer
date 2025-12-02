const express = require("express");
const router = express.Router();
const ChickLinkKey = require("../Middlewares/ChickLinkKey");
const { create, analytics } = require("../Controllers/LinkController");


router.post("/create", ChickLinkKey, create);
router.get("/analytics/:slug", ChickLinkKey, analytics );

module.exports = router;
