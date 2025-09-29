// tracker.js  (serve as static, allow cross-origin)
(function () {
  try {
    // read site id from script tag attribute
    var currentScript = document.currentScript || (function() {
      var scripts = document.getElementsByTagName('script');
      return scripts[scripts.length - 1];
    })();
    var SITE_ID = (currentScript && currentScript.dataset && currentScript.dataset.siteId) || 'unknown_site';
    var ENDPOINT = (currentScript && currentScript.dataset && currentScript.dataset.endpoint) || 'https://your-backend.com/api/track/clicks';

    // persisted anon id per browser
    function getAnon() {
      var key = 'clicktrack_anon_v1';
      var id = localStorage.getItem(key);
      if (!id) {
        id = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,9);
        try { localStorage.setItem(key, id); } catch(e){}
      }
      return id;
    }
    var ANON = getAnon();

    var BUFFER = [];
    var BATCH = 8;
    var FLUSH_MS = 4000;

    function shortSelector(el) {
      if (!el) return '';
      if (el.id) return '#' + el.id;
      var parts = [];
      var cur = el;
      while (cur && cur.tagName && cur.tagName.toLowerCase() !== 'html' && parts.length < 4) {
        var tag = cur.tagName.toLowerCase();
        var cls = (cur.className && typeof cur.className === 'string') ? cur.className.split(/\s+/)[0] : '';
        var seg = tag + (cls ? ('.' + cls) : '');
        var parent = cur.parentNode;
        if (parent) {
          // nth-of-type for precision
          var siblings = Array.prototype.filter.call(parent.children || [], function(x){ return x.tagName === cur.tagName; });
          if (siblings.length > 1) {
            var idx = siblings.indexOf(cur) + 1;
            seg += ':nth-of-type(' + idx + ')';
          }
        }
        parts.unshift(seg);
        cur = cur.parentNode;
      }
      return parts.join(' > ');
    }

    function captureClick(e) {
      try {
        var el = e.target || e.srcElement;
        var rect = el && el.getBoundingClientRect ? el.getBoundingClientRect() : {left:0, top:0};
        var evt = {
          siteId: SITE_ID,
          anonId: ANON,
          page: window.location.pathname + window.location.search,
          selector: shortSelector(el),
          tag: el && el.tagName,
          text: (el && (el.innerText || el.textContent) || '').slice(0,120),
          href: el && el.href || null,
          x: Math.round(e.clientX),
          y: Math.round(e.clientY),
          elLeft: Math.round(rect.left || 0),
          elTop: Math.round(rect.top || 0),
          viewportW: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
          viewportH: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0),
          ts: Date.now()
        };
        BUFFER.push(evt);
        if (BUFFER.length >= BATCH) flush();
      } catch (err) { /* ignore */ }
    }

    function flush() {
      if (!BUFFER.length) return;
      var payload = {
        siteId: SITE_ID,
        anonId: ANON,
        page: window.location.pathname + window.location.search,
        ts: Date.now(),
        events: BUFFER.splice(0, BUFFER.length)
      };
      try {
        var blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        if (navigator.sendBeacon) {
          navigator.sendBeacon(ENDPOINT, blob);
        } else {
          fetch(ENDPOINT, { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } }).catch(()=>{});
        }
      } catch (e) {}
    }

    document.addEventListener('click', captureClick, true);
    setInterval(flush, FLUSH_MS);
    window.addEventListener('beforeunload', flush);
    // Optionally expose one-off flush
    window.__clickTrackerFlush = flush;
  } catch (e) {
    console.error('tracker init failed', e);
  }
})();
