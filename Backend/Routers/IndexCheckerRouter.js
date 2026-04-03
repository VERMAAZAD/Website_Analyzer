const express = require('express');
const router = express.Router();

const { 
  startBingCheck,
  getBingCheckStatus,
  captchaDetected,
  reportBingResult,
  getNextDomain,
  stopBingCheck,
  getBingCheckReport,
  getUnindexedDomains
} = require('../Controllers/BingIndexChecker');
const ensureAuthenticated = require('../Middlewares/Auth');

router.get('/bing-check-start', ensureAuthenticated, startBingCheck);
router.get('/bing-check-status', ensureAuthenticated, getBingCheckStatus);
router.post('/bing-captcha-detected', ensureAuthenticated, captchaDetected);
router.post('/bing-report-result', ensureAuthenticated, reportBingResult);
router.get('/bing-next-domain', ensureAuthenticated, getNextDomain);
router.post('/bing-check-stop', ensureAuthenticated, stopBingCheck);
router.get('/bing-check-report', ensureAuthenticated, getBingCheckReport);
router.get('/unindexed-domains', ensureAuthenticated, getUnindexedDomains);

module.exports = router;
