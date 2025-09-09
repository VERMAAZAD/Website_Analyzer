const express = require("express");
const router = express.Router();
const ensureAuthenticated = require("../Middlewares/Auth");
const { commentBot } = require("../Controllers/CommentBotController");

router.post("/run-bot", ensureAuthenticated, commentBot);


module.exports = router;
