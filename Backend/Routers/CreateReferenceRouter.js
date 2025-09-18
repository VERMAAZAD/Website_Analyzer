const express = require("express");
const { createRefer, handleRedirect } = require("../Controllers/CreateReferenceController");
const router = express.Router();

router.post('/create-reference', createRefer);
router.get('/ref/:slug', handleRedirect);

module.exports = router;
