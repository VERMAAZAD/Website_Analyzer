// parseDomain.js
const extractBaseDomain = (url) => {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^https?:\/\//, '')
               .replace(/^www\./, '')
               .replace(/\/$/, '');
  }
};

module.exports = extractBaseDomain;
