const API_BASE = import.meta.env.VITE_API_URI;

export const createShortLink = async (originalUrl) => {
  console.log("API Key:", import.meta.env.VITE_API_KEY);
  const res = await fetch(`${API_BASE}/api/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": import.meta.env.VITE_API_KEY
    },
    body: JSON.stringify({ url: originalUrl })
  });
  
  return res.json();
};

export const getLinkStats = async (shortId) => {
  const res = await fetch(`${API_BASE}/api/stats/${shortId}`);
  return res.json();
};
