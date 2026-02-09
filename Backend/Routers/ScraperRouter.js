const express = require('express');
const router = express.Router();
const { checkBingIndex } = require('../Controllers/BingIndexChecker');
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
  getExpiringDomains,
  renewDomain,
  updateNote,
  deleteNote,
  getUnindexedDomains,
  saveHostingInfo,
  getHostingInfo,
  updateDomainName,
  getErrorDomains,
  getManualErrorDomains,
  addManualErrorDomain,
  restoreManualErrorDomain,
  getAffiliateMismatch,
  saveCategoryAffiliate,
  getAffiliateMismatchCounts,
  getCategoryAffiliate,
  getCategoryAffiliateStatus,
  getMe,
  categoryAffiliate,
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
router.get('/affiliate-mismatch', ensureAuthenticated, getAffiliateMismatch);
router.post('/category-affiliate', ensureAuthenticated, saveCategoryAffiliate);
router.get('/affiliate-mismatch-counts', ensureAuthenticated, getAffiliateMismatchCounts);
router.get('/category-affiliate-status', ensureAuthenticated, getCategoryAffiliateStatus);
router.get('/category-affiliate/:category', ensureAuthenticated, getCategoryAffiliate);
router.get("/auth/me", ensureAuthenticated, getMe);

router.get('/expiring', ensureAuthenticated, getExpiringDomains);
router.post('/renew', ensureAuthenticated, renewDomain);
router.get('/update-changed', ensureAuthenticated, updateChangedDomains);
router.put('/note/:domain', ensureAuthenticated, updateNote);
router.delete('/note/:domain', ensureAuthenticated, deleteNote);
router.get('/bing-check', ensureAuthenticated, checkBingIndex);
router.get('/unindexed-domains', ensureAuthenticated, getUnindexedDomains);
router.put('/hosting-info/:domain', ensureAuthenticated, saveHostingInfo);
router.get('/hosting-info/:domain', ensureAuthenticated, getHostingInfo);
router.put("/update-domain-name", ensureAuthenticated, updateDomainName);
router.get("/error-domain", ensureAuthenticated, getErrorDomains);
router.get("/error-domain", ensureAuthenticated, getErrorDomains);
router.get("/error-domain/manual", ensureAuthenticated, getManualErrorDomains);
router.post("/error-domain/manual", ensureAuthenticated, addManualErrorDomain);
router.put("/error-domain/manual/restore/:domain", ensureAuthenticated, restoreManualErrorDomain);



module.exports = router;
