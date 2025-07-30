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
  refreshStatusesAndGetErrors,
  testAffiliateLinks,
  getExpiringDomains,
  renewDomain,
  updateNote,
  deleteNote,
  checkBingIndex,
  getUnindexedDomains,
  saveHostingInfo,
  getHostingInfo,
  updateDomainName,
} = require('../Controllers/ScraperDatingController');
const ensureAuthenticated = require('../Middlewares/Auth');
const auth = require("../Middlewares/Auth");
const { updateChangedDomains } = require('../Controllers/UpdaterController');

router.post('/scan', scrapeWebsite);
router.post('/save', auth, ensureAuthenticated, saveScrapedData);
router.get('/all', auth, ensureAuthenticated, getAllScrapedSites); 
router.get('/domain/:domain', auth, ensureAuthenticated, getScrapedSiteByDomain);
router.get('/categories', auth, ensureAuthenticated, getAllCategories);
router.get('/category-counts', auth, ensureAuthenticated, getCategoryCounts); 
router.get('/by-category/:category', auth, ensureAuthenticated, getDomainsByCategory);
router.delete('/domain/:domain', auth, ensureAuthenticated, deleteScrapedSite);
router.get('/refresh-and-errors', auth, ensureAuthenticated, refreshStatusesAndGetErrors);
router.get('/check-affiliate-errors', auth, ensureAuthenticated, testAffiliateLinks);
router.get('/expiring', auth, ensureAuthenticated, getExpiringDomains);
router.post('/renew', auth, ensureAuthenticated, renewDomain);
router.get('/update-changed', auth, ensureAuthenticated, updateChangedDomains);
router.put('/note/:domain', auth, ensureAuthenticated, updateNote);
router.delete('/note/:domain', auth, ensureAuthenticated, deleteNote);
router.get('/bing-check', auth, ensureAuthenticated, checkBingIndex);
router.get('/unindexed-domains', auth, ensureAuthenticated, getUnindexedDomains);
router.put('/hosting-info/:domain', auth, ensureAuthenticated, saveHostingInfo);
router.get('/hosting-info/:domain', auth, ensureAuthenticated, getHostingInfo);
router.put("/update-domain-name", auth, ensureAuthenticated, updateDomainName);



module.exports = router;
