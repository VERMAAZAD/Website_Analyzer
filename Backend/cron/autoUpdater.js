const cron = require('node-cron');
const { updateChangedDomains } = require('../Controllers/UpdaterController');

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

// Update website data every 2 minutes
cron.schedule('*/2 * * * *', async () => {
  if (isUpdating) {
    console.log('[CRON] Starting updateChangedDomains at', new Date().toString());
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


