import React, { useState } from 'react';
import { createLink, getStats } from './api';

export default function App(){
  const [target, setTarget] = useState('');
  const [result, setResult] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [linkId, setLinkId] = useState('');

  const handleCreate = async () => {
    if (!target) return alert('paste a target URL');
    setLoading(true);
    try {
      const data = await createLink(target);
      setResult(data);
      setLinkId(data.linkId);
      setStats(null);
    } catch (e) {
      alert('create failed: ' + (e.response?.data?.error || e.message));
    } finally { setLoading(false); }
  };

  const fetchStats = async () => {
    if (!linkId) return alert('no linkId');
    setLoading(true);
    try {
      const s = await getStats(linkId);
      setStats(s);
    } catch(e){
      alert('stats failed: ' + (e.response?.data?.error || e.message));
    } finally { setLoading(false); }
  };

  return (
    <div className="container">
      <h1>Tracking Link Creator</h1>
      <div className="card">
        <input placeholder="https://example.com/..." value={target} onChange={e=>setTarget(e.target.value)} />
        <button onClick={handleCreate} disabled={loading}>Create tracking link</button>
      </div>

      {result && (
        <div className="card">
          <h3>Created</h3>
          <p><strong>Tracking URL:</strong> <a href={result.trackingUrl} target="_blank" rel="noreferrer">{result.trackingUrl}</a></p>
          <p><strong>Target:</strong> {result.target}</p>
          {result.preflight && (
            <div>
              <strong>Preflight:</strong>
              <div>Final URL: {result.preflight.finalUrl}</div>
              <div>Hops: {result.preflight.hopCount}</div>
            </div>
          )}
          <button onClick={fetchStats}>Load Stats</button>
        </div>
      )}

      {stats && (
        <div className="card">
          <h3>Stats for {stats.linkId}</h3>
          <div>Total clicks: {stats.summary.totalClicks}</div>
          <div>Unique visitors: {stats.summary.uniqueVisitors}</div>
          <div>Clicks last 24h: {stats.summary.clicksLast24h}</div>
          <div>Bot clicks: {stats.summary.botClicks}</div>
          <h4>Top countries</h4>
          <ul>{stats.topCountries.map(c=> <li key={c.country}>{c.country}: {c.clicks}</li>)}</ul>
          <h4>Recent events</h4>
          <table className="events">
            <thead><tr><th>Time</th><th>Anon</th><th>Country</th><th>UA</th><th>Referer</th></tr></thead>
            <tbody>
              {stats.recentEvents.map(ev => (
                <tr key={ev._id || ev.ts}>
                  <td>{new Date(ev.ts).toLocaleString()}</td>
                  <td>{ev.anonId}</td>
                  <td>{ev.country}</td>
                  <td style={{maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis'}}>{ev.ua}</td>
                  <td>{ev.referer}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
