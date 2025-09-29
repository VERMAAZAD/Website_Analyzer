const dns = require("dns").promises;

function isValidEmailFormat(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

async function hasMxRecord(email) {
  try {
    const domain = email.split("@")[1];
    const records = await dns.resolveMx(domain);
    return records && records.length > 0;
  } catch {
    return false;
  }
}

const disposableDomains = ["tempmail.com", "10minutemail.com", "mailinator.com"];
function isDisposable(email) {
  const domain = email.split("@")[1];
  return disposableDomains.includes(domain);
}

module.exports = {
  isValidEmailFormat,
  hasMxRecord,
  isDisposable
};
