(function () {
  try {
    function getVisitorId() {
      try {
        const key = "mc_vid";
        let id = localStorage.getItem(key);
        if (id) return id;
        const match = document.cookie.match(new RegExp("(^| )" + key + "=([^;]+)"));
        if (match) {
          localStorage.setItem(key, match[2]);
          return match[2];
        }
        id = crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36).substring(2);

        localStorage.setItem(key, id);
        document.cookie = `${key}=${id};path=/;max-age=${60 * 60 * 24 * 365}`;

        return id;
      } catch {
        return Math.random().toString(36).substring(2);
      }
    }

    const script =
      document.currentScript ||
      document.querySelector("script[data-site-id][data-user-id]");

    if (!script) return;

    const siteId = script.getAttribute("data-site-id");
    const userId = script.getAttribute("data-user-id");

    if (!siteId || !userId) return;

    const visitorId = getVisitorId();

    fetch("https://api.monitorchecker.com/traffic/traffic-check", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      keepalive: true,
      body: JSON.stringify({
        userId,
        siteId,
        visitorId,
        domain: location.hostname,
        path: location.pathname,
      }),
    }).catch(() => {});
  } catch (e) {
    // fail silently
  }
})();
