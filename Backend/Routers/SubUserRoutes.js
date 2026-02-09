const express = require('express');
const router = express.Router();
const { createSubUser, getSubUsers, forceLogoutSubUser, deleteSubUser, updateAffiliateAccess } = require('../Controllers/SubUserController');
const ensureAuthenticated = require('../Middlewares/Auth');

router.post('/', ensureAuthenticated, createSubUser);
router.get('/', ensureAuthenticated, getSubUsers);
router.patch('/:subUserId/logout', ensureAuthenticated, forceLogoutSubUser);
router.delete('/:subUserId', ensureAuthenticated, deleteSubUser);
router.patch('/:subUserId/affiliate-access', ensureAuthenticated, updateAffiliateAccess);

module.exports = router;
