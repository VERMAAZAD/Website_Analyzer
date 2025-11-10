// api.js
import axios from 'axios';

// Use your base URL from environment variables or set a default URL
const API_BASE = import.meta.env.VITE_API_URI || 'http://localhost:5000';

// Function to create a new tracking link (single or multi-step)
export const createLink = async (payload) => {
  try {
    const res = await axios.post(`${API_BASE}/clockar/api/links`, payload);
    return res.data;
  } catch (error) {
    throw new Error('Failed to create link: ' + error.message);
  }
};

// Function to get statistics for a link
export const getStats = async (linkId) => {
  try {
    const res = await axios.get(`${API_BASE}/clockar/api/links/${linkId}/stats`);
    return res.data;
  } catch (error) {
    throw new Error('Failed to fetch link stats: ' + error.message);
  }
};

// Fetch base domains for the dropdown
export const getBaseDomains = async () => {
  try {
    const res = await axios.get(`${API_BASE}/clockar/api/getBaseDomain`);
    return res.data.domains || [];
  } catch (error) {
    throw new Error('Failed to fetch base domains: ' + error.message);
  }
};

export const getAllLinks = async () => {
  try {
    const res = await axios.get(`${API_BASE}/clockar/api/getAllLinks`);
    return res.data;
  } catch (error) {
    throw new Error('Failed to fetch all links: ' + error.message);
  }
};

export const getLinkStats = async (linkId) => {
  try{
    const res = await axios.get(`${API_BASE}/clockar/api/links/${linkId}/stats`);
    return res.data;
  }catch(error){
    throw new Error('Failed to fetch all links: ' + error.message);
  }
};

// Add a new base domain
export const addBaseDomain = async (baseUrl) => {
  try{
    const payload = { baseUrl };
    const res = await axios.post(`${API_BASE}/clockar/api/addBaseUrl`, payload);
  return res.data;
  }catch(error){
    console.error("❌ addBaseDomain Error:", error.response?.data || error.message);
    throw new Error('Failed to fetch all links: ' + error.message);
  }
};

// Delete base domain by ID
export const deleteBaseDomain = async (id) => {
  try{
    const res = await axios.delete(`${API_BASE}/clockar/api/deleteBaseDomain/${id}`);
  return res.data;
  }catch(error){
     throw new Error('Failed to fetch all links: ' + error.message);
  }
};
