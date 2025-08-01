const User = require('../Models/User');
const ScrapedSite = require('../Models/ScrapedSite');
const ScrapedGameSite = require('../Models/ScrapedGameSite');
const ScrapedDatingSite = require('../Models/ScrapedDatingSite');

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
    const naturalDomains = await ScrapedSite.find({ user: userId });
    const casinoDomains = await ScrapedGameSite.find({ user: userId });
    const datingDomains = await ScrapedDatingSite.find({ user: userId });

    const tagged = [
      ...naturalDomains.map(d => ({ ...d.toObject(), superCategory: 'natural' })),
      ...casinoDomains.map(d => ({ ...d.toObject(), superCategory: 'casino' })),
      ...datingDomains.map(d => ({ ...d.toObject(), superCategory: 'dating' })),
    ];

    res.json(tagged);
  } catch (err) {
    console.error('Error fetching user domains:', err);
    res.status(500).json({ message: 'Failed to fetch domains for user' });
  }
};



// Get domain count based on superCategory
exports.getDomainCountByCategory = async (req, res) => {
  const { superCategory } = req.params;

  try {
    let Model;

    switch (superCategory) {
      case 'casino':
        Model = ScrapedGameSite;
        break;
      case 'dating':
        Model = ScrapedDatingSite;
        break;
      default:
        Model = ScrapedSite; // natural or fallback
    }

    const count = await Model.countDocuments();
    res.json({ count });
  } catch (err) {
    console.error('Error getting domain count:', err);
    res.status(500).json({ message: 'Failed to fetch domain count' });
  }
};


