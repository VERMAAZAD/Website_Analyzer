const API_BASE = import.meta.env.VITE_API_URI;
const API_KEY = import.meta.env.VITE_API_KEY;

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
  "x-api-key": API_KEY,
  "Content-Type": "application/json"
});

// ---------------- CREATE SHORT LINK ----------------
export const createShortLink = async (payload) => {
  const res = await fetch(`${API_BASE}/api/create`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload)
  });
  return res.json();
};

// ---------------- ALL LINKS ----------------
export const getAllCreatedLinks = async () => {
  const res = await fetch(`${API_BASE}/api/links`, {
    headers: authHeaders()
  });
  return res.json();
};

// ---------------- ANALYTICS ----------------
export const getAnalytics = async (slug) => {
  const res = await fetch(`${API_BASE}/api/analytics/${slug}`, {
    headers: authHeaders()
  });
  return res.json();
};

// ---------------- FUNNEL ----------------
export const getFunnelStats = async (slug) => {
  const res = await fetch(`${API_BASE}/api/funnel/${slug}`, {
    headers: authHeaders()
  });
  return res.json();
};

// ---------------- UPDATE CHAIN ----------------
export const updateChain = async (slug, nextSlug) => {
  const res = await fetch(`${API_BASE}/api/chain/${slug}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ nextSlug })
  });
  return res.json();
};


export const deleteLink = async (slug) => {
  const res = await fetch(`${API_BASE}/api/delete/link/${slug}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return res.json();
};

// ---------------- DELETE CHAIN ----------------
export const deleteChain = async (groupId) => {
  const res = await fetch(`${API_BASE}/api/delete/chain/${groupId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return res.json();
};

export const getAllFolders = async () => {
  const res = await fetch(`${API_BASE}/api/folders`, {
    headers: authHeaders(),
  });
  return res.json();
};

export const getDailyAnalytics = async (slug) => {
  const res = await fetch(`${API_BASE}/api/analytics/daily/${slug}`,{
      headers: authHeaders(),
  });
   return res.json();
};



export const getLinkBySlug = async (slug) => {
  const res = await fetch(`${API_BASE}/api/link/${slug}`, {
    headers: authHeaders(),
  });
  return res.json();
};