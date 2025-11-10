import axios from 'axios';

// your backend base URL
const API_BASE = import.meta.env.VITE_API_URI || 'http://localhost:5000';

// Create tracking link (single or multi)
export const createLink = async (payload) => {
  const res = await axios.post(`${API_BASE}/clockar/api/links`, payload);
  return res.data;
};

// Get link statistics
export const getStats = async (linkId) => {
  const res = await axios.get(`${API_BASE}/clockar/api/links/${linkId}/stats`);
  return res.data;
};


