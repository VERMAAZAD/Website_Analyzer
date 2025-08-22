const cron = require('node-cron');
const { updateChangedDomains } = require('../Controllers/UpdaterController');

const fakeReq = {
  user: {
    role: 'admin',
    _id: 'admin-cron-job',
  },
};

const fakeRes = {
  json: () => {},
  status: () => ({
    json: () => {},
  }),
};

let isUpdating = false;

cron.schedule('*/20 * * * *', async () => {
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
