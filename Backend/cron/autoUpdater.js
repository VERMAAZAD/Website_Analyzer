const cron = require('node-cron');
const { updateChangedDomains } = require('../Controllers/UpdaterController');
const { checkBingIndex } = require('../Controllers/ScraperController');


const fakeReq = {
  user: {
    role: 'admin',
     _id: 'admin-cron-job',
  },
};

const fakeRes = {
  json: (data) => console.log('[Cron Response]', data),
  status: (code) => ({
    json: (data) => console.error(`[Cron Error ${code}]`, data),
  }),
};

let isUpdating = false;
let isCheckingIndex = false;

// Update website data every 2 minutes
cron.schedule('*/2 * * * *', async () => {
  if (isUpdating) {
    return;
  }

  isUpdating = true;

  try {
    await updateChangedDomains(fakeReq, fakeRes);
  } catch (err) {
  } finally {
    isUpdating = false;
  }
});
// check at 1:01 AM daily
cron.schedule('1 1 * * *', async () => {
  if (isCheckingIndex) return;
  isCheckingIndex = true;

  try {
    await checkBingIndex(fakeReq, fakeRes);
  } catch (err) {
  } finally {
    isCheckingIndex = false;
  }
});
