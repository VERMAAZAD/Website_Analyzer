const express = require('express');
const router = express.Router();
const { categoryAffiliate } = require('../Controllers/AffiliatelinkController');
const ensureAuthenticated = require('../Middlewares/Auth');

router.get("/category-affiliates", ensureAuthenticated, categoryAffiliate);

module.exports = router;
