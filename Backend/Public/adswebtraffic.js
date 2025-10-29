(function () {
  function getVisitorId() {
    const cookieName = "visitorId=";
    const cookies = document.cookie.split(";");
    for (let c of cookies) {
      while (c.charAt(0) === " ") c = c.substring(1);
      if (c.indexOf(cookieName) === 0) {
        return c.substring(cookieName.length, c.length);
      }
    }
    const newId = self.crypto?.randomUUID?.() || Math.random().toString(36).substring(2);
    document.cookie = "visitorId=" + newId + ";path=/;max-age=" + 60 * 60 * 24 * 365;
    return newId;
  }

  const script = document.currentScript; 
  const siteId = script.getAttribute("data-site-id");
  const visitorId = getVisitorId();
  const userId = script.getAttribute("data-user-id");
  
  const domain = script.getAttribute("data-domain") || window.location.hostname;

  if (domain !== window.location.hostname && window.location.hostname.includes("proxy")) {
    console.warn("Blocked proxy tracking request");
  } else {
    fetch(`https://api.monitorchecker.com/adswebsite/traffic-check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        siteId,
        visitorId,
        domain: window.location.hostname,
        path: window.location.pathname,
      }),
    }).catch(err => console.error("Track error:", err));
  }
  })();


