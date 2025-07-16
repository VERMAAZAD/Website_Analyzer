const express = require('express');
const router = express.Router();
const {
  scrapeWebsite,
  saveScrapedData,
  getAllScrapedSites,
  getScrapedSiteByDomain,
  getAllCategories,
  getCategoryCounts,
  getDomainsByCategory,
  deleteScrapedSite,
  getErrorDomains
} = require('../Controllers/ScraperController');
const ensureAuthenticated = require('../Middlewares/Auth');
const auth = require("../Middlewares/Auth")

router.post('/scan', scrapeWebsite);
router.post('/save', auth, ensureAuthenticated, saveScrapedData);
router.get('/all', auth, ensureAuthenticated, getAllScrapedSites); 
router.get('/domain/:domain', auth, ensureAuthenticated, getScrapedSiteByDomain);
router.get('/categories', auth, ensureAuthenticated, getAllCategories);
router.get('/category-counts', auth, ensureAuthenticated, getCategoryCounts); 
router.get('/by-category/:category', auth, ensureAuthenticated, getDomainsByCategory);
router.delete('/domain/:domain', auth, ensureAuthenticated, deleteScrapedSite);
router.get('/error-domains', auth, ensureAuthenticated, getErrorDomains);




module.exports = router;
