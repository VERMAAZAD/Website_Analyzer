const express = require("express");
const router = express.Router();
const { ssoroute } = require("../Controllers/SSOController");


router.get("/sso-login", ssoroute);

module.exports = router;
