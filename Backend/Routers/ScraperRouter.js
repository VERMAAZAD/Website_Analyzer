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
  getErrorDomains,
  getAffiliateErrors,
  getExpireHosting,
  renewHosting,
} = require('../Controllers/ScraperController');
const ensureAuthenticated = require('../Middlewares/Auth');
const { updateChangedDomains } = require('../Controllers/UpdaterController');

router.post('/scan', scrapeWebsite);
router.post('/save', ensureAuthenticated, saveScrapedData);
router.get('/all', ensureAuthenticated, getAllScrapedSites); 
router.get('/domain/:domain', ensureAuthenticated, getScrapedSiteByDomain);
router.get('/categories', ensureAuthenticated, getAllCategories);
router.get('/category-counts', ensureAuthenticated, getCategoryCounts); 
router.get('/by-category/:category', ensureAuthenticated, getDomainsByCategory);
router.delete('/domain/:domain', ensureAuthenticated, deleteScrapedSite);
router.get('/refresh-and-errors', ensureAuthenticated, refreshStatusesAndGetErrors);
router.get('/check-affiliate-errors', ensureAuthenticated, testAffiliateLinks);
router.get('/get-affiliate-errors', ensureAuthenticated, getAffiliateErrors);
router.get('/expiring', ensureAuthenticated, getExpiringDomains);
router.post('/renew', ensureAuthenticated, renewDomain);
router.get('/update-changed', ensureAuthenticated, updateChangedDomains);
router.put('/note/:domain', ensureAuthenticated, updateNote);
router.delete('/note/:domain', ensureAuthenticated, deleteNote);
router.get('/bing-check', ensureAuthenticated, checkBingIndex);
router.get('/unindexed-domains', ensureAuthenticated, getUnindexedDomains);
router.put('/hosting-info/:domain', ensureAuthenticated, saveHostingInfo);
router.get('/hosting-info/:domain', ensureAuthenticated, getHostingInfo);
router.get('/expire-hosting', ensureAuthenticated, getExpireHosting);
router.get('/renew-hosting', ensureAuthenticated, renewHosting);
router.put("/update-domain-name", ensureAuthenticated, updateDomainName);
router.get("/error-domain", ensureAuthenticated, getErrorDomains);



module.exports = router;
