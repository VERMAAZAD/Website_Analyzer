const cron = require('node-cron');
const { updateChangedDomains } = require('../Controllers/UpdaterController');


const fakeReq = {
  user: {
    role: 'admin',   
    _id: 'admin-cron-job',
  },
};

const fakeRes = {
  json: (data) => console.log('Cron Update Done:', data),
  status: (code) => ({
    json: (err) => console.error(`Cron Update Failed [${code}]:`, err),
  }),
};

let isUpdating = false;

cron.schedule('* * * * *', async () => {   
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
