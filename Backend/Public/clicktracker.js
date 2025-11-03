(function () {
  try {
    var currentScript = document.currentScript || (function() {
      var scripts = document.getElementsByTagName('script');
      return scripts[scripts.length - 1];
    })();

    var SITE_ID = currentScript?.dataset?.siteId || 'unknown_site';
    var ENDPOINT = currentScript?.dataset?.endpoint || 'http://localhost:5000/trackweb/clicks';
    var ANON_KEY = 'clicktrack_anon_v1';
    var ANON = localStorage.getItem(ANON_KEY) || (function() {
      var id = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,9);
      localStorage.setItem(ANON_KEY, id);
      return id;
    })();

    var BUFFER = [];
    var BATCH = 6;
    var FLUSH_MS = 4000;
    var outboundClicked = false;

    function isOutbound(url) {
      try {
        var u = new URL(url);
        return u.hostname && u.hostname !== window.location.hostname;
      } catch (e) {
        return false;
      }
    }

    function shortSelector(el) {
      if (!el) return '';
      if (el.id) return '#' + el.id;
      var parts = [];
      var cur = el;
      while (cur && cur.tagName && cur.tagName.toLowerCase() !== 'html' && parts.length < 3) {
        var tag = cur.tagName.toLowerCase();
        var cls = (cur.className && typeof cur.className === 'string') ? cur.className.split(/\s+/)[0] : '';
        parts.unshift(tag + (cls ? '.' + cls : ''));
        cur = cur.parentNode;
      }
      return parts.join(' > ');
    }

    function captureClick(e) {
      try {
        var el = e.target.closest('a');
        if (!el) return;

        var outbound = isOutbound(el.href);
        if (outbound) outboundClicked = true;

        BUFFER.push({
          type: outbound ? 'outbound' : 'click',
          siteId: SITE_ID,
          anonId: ANON,
          href: el.href || null,
          page: location.href,
          selector: shortSelector(el),
          x: e.pageX,
          y: e.pageY,
          ts: Date.now()
        });

        if (BUFFER.length >= BATCH) flush();
      } catch (err) {}
    }

    function captureExit() {
      if (!outboundClicked) {
        BUFFER.push({
          type: 'exit',
          siteId: SITE_ID,
          anonId: ANON,
          page: location.href,
          ts: Date.now()
        });
        flush();
      }
    }

    function flush() {
      if (!BUFFER.length) return;
      var payload = {
        siteId: SITE_ID,
        anonId: ANON,
        events: BUFFER.splice(0, BUFFER.length),
        ts: Date.now()
      };
      try {
        navigator.sendBeacon(ENDPOINT, JSON.stringify(payload));
      } catch (err) {
        fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(()=>{});
      }
    }

    document.addEventListener('click', captureClick, true);
    document.addEventListener('visibilitychange', function() {
      if (document.visibilityState === 'hidden') captureExit();
    });
    setInterval(flush, FLUSH_MS);

  } catch (e) {
    console.error('tracker init failed', e);
  }
})();
