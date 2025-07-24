const { signup, login, requestPasswordReset, resetPassword} = require('../Controllers/AuthController')
const { signupValidation, loginValidation } = require('../Middlewares/AuthValidation');
const ensureAuthenticated  = require("../Middlewares/Auth")


const router = require('express').Router();

router.post('/login', loginValidation, login)
router.post('/signup', ensureAuthenticated ,signupValidation, signup);
router.post('/request-reset-code', requestPasswordReset);
router.post('/reset-password', resetPassword);

module.exports = router;