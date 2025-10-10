const { signup, initiateLogin, requestPasswordReset, resetPassword, verifyLoginCode} = require('../Controllers/AuthController')
const { signupValidation, loginValidation } = require('../Middlewares/AuthValidation');
const ensureAuthenticated  = require("../Middlewares/Auth");


const router = require('express').Router();

router.post('/initiatelogin', loginValidation, initiateLogin)
router.post('/verify-code', verifyLoginCode);
router.post('/signup', ensureAuthenticated ,signupValidation, signup);
router.post('/request-reset-code', requestPasswordReset);
router.post('/reset-password', resetPassword);

module.exports = router;