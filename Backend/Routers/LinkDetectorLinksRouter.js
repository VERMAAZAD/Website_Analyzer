  // routes/linkRoutes.js
  const express = require('express');
  const router = express.Router();

  const {
    createLink,
    getLinkStats,
    addBaseUrl,
    getBaseDomain,
    deleteBaseDomain,
    getAllLinks,
  } = require('../Controllers/LinksDetectorController');

  router.post('/links', createLink);
  router.get('/links/:linkId/stats', getLinkStats);
  router.get('/getAllLinks', getAllLinks);

  router.post('/addBaseUrl', addBaseUrl);
  router.get('/getBaseDomain', getBaseDomain);
  router.delete('/deleteBaseDomain/:id', deleteBaseDomain);
  
  module.exports = router;
