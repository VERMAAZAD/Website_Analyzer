// src/api.js
import axios from 'axios';
const API = import.meta.env.VITE_API || 'http://localhost:5000';

export async function getDomainStats() {
  return axios.get(`${API}/api/analytics/domain-stats`).then(r => r.data);
}
export async function getRecentFlows() {
  return axios.get(`${API}/api/analytics/recent-flows`).then(r => r.data);
}
export async function getFlowCount(sequence) {
  return axios.post(`${API}/api/analytics/flow-count`, { sequence }).then(r => r.data);
}
export async function getUserPath(uid) {
  return axios.get(`${API}/api/analytics/user-path/${uid}`).then(r => r.data);
}
