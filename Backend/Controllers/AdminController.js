const User = require('../Models/User');
const ScrapedSite = require('../Models/ScrapedSite');


// Get all users (only for master/admin)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, '-password'); // exclude password
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

// Delete a user by ID
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await User.findByIdAndDelete(id);
    await ScrapedSite.deleteMany({ user: id }); // delete user's data too

    res.json({ message: 'User and their data deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete user' });
  }
};

// Get all scraped domains across users
exports.getAllScrapedSites = async (req, res) => {
  try {
    const data = await ScrapedSite.find().populate('user', 'email name');
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch all scraped data' });
  }
};

// Get domains for a specific user
exports.getDomainsByUserId = async (req, res) => {
  try {
    const userId = req.params.id;
    const domains = await ScrapedSite.find({ user: userId });

    res.json(domains);
  } catch (err) {
    console.error('Error fetching user domains:', err);
    res.status(500).json({ message: 'Failed to fetch domains for user' });
  }
};

