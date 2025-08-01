const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  deleteUser,
  getAllScrapedSites,
  getDomainsByUserId,
  getDomainCountByCategory,
} = require('../Controllers/AdminController');

const ensureAuthenticated = require('../Middlewares/Auth');

// Role-based middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: admin only' });
  }
  next();
};



// Apply both middlewares
router.use(ensureAuthenticated, requireAdmin);

router.get('/users', getAllUsers);
router.delete('/user/:id', deleteUser);
router.get('/scraped-data', getAllScrapedSites);
router.get('/user/:id/domains', getDomainsByUserId);
router.get('/domain-count/:superCategory', getDomainCountByCategory);


module.exports = router;
