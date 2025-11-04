// utils/preflight.js
const fetch = require('node-fetch');
const { URL } = require('url');

async function preflightFollow(url, maxHops = 8, timeout = 10000) {
  const redirects = [];
  let current = url;
  try {
    for (let i = 0; i < maxHops; i++) {
      const res = await fetch(current, { method: 'GET', redirect: 'manual', timeout });
      const status = res.status;
      const loc = res.headers.get('location');

      if (status >= 300 && status < 400 && loc) {
        // resolve relative location
        const next = new URL(loc, current).toString();
        redirects.push({ from: current, status, to: next });
        current = next;
        continue;
      } else {
        // no more redirects
        break;
      }
    }
    const finalUrl = current;
    let finalDomain = null;
    try {
      finalDomain = new URL(finalUrl).hostname;
    } catch (e) { finalDomain = null; }
    return {
      redirects,
      finalUrl,
      hopCount: redirects.length,
      finalDomain
    };
  } catch (err) {
    // on error return what we gathered
    return {
      redirects,
      finalUrl: current,
      hopCount: redirects.length,
      finalDomain: (() => { try { return new URL(current).hostname } catch(e){return null}})()
    };
  }
}

module.exports = { preflightFollow };
