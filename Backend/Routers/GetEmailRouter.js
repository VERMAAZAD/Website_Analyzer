const { getVrfyEmailData } = require('../Controllers/GetEmailsController');

const router = require('express').Router();

router.post('/get-mailData', getVrfyEmailData)

module.exports = router;