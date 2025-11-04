import axios from 'axios';

const API_BASE = (import.meta.env.VITE_API_URI) || 'http://localhost:5000';

export const createLink = async (target) => {
  const res = await axios.post(`${API_BASE}/api/links`, { target });
  return res.data;
};

export const getStats = async (linkId) => {
  const res = await axios.get(`${API_BASE}/api/links/${linkId}/stats`);
  return res.data;
};
