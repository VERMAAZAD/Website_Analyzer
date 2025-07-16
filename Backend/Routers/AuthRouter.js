const { signup, login } = require('../Controllers/AuthController')
const { signupValidation, loginValidation } = require('../Middlewares/AuthValidation');
const ensureAuthenticated  = require("../Middlewares/Auth")


const router = require('express').Router();

router.post('/login', loginValidation, login)
router.post('/signup', ensureAuthenticated ,signupValidation, signup)


module.exports = router;