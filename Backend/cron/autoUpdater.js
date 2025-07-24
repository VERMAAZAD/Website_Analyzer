const cron = require('node-cron');
// const ScrapedSite = require('../Models/ScrapedSite');
const { updateChangedDomains } = require('../Controllers/UpdaterController');

// Simulate admin request
const fakeReq = {
  user: {
    role: 'admin',
    _id: null
  }
};

const fakeRes = {
  json: () => {}, // Silent success
  status: () => ({ json: () => {} }) // Silent error
};

// Run every 2 minutes
cron.schedule('*/2 * * * *', async () => {
  await updateChangedDomains(fakeReq, fakeRes);
});
