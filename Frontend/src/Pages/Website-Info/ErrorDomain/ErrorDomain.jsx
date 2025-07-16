import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Layout from '../../../components/Layouts/Layout';
import { useNavigate } from 'react-router-dom';
import "./ErrorDomain.css"

function ErrorDomains() {
  const [errorDomains, setErrorDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchErrorDomains = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_APP_URI}/api/scraper/errors`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        setErrorDomains(res.data);
      } catch (err) {
        console.error("Failed to fetch error domains", err);
      } finally {
        setLoading(false);
      }
    };

    fetchErrorDomains();
  }, []);

  return (
    <Layout>
      <div className="errordomain-container">
        <div className="top-bar">
          <h2>Domains with Errors (StatusCode ≠ 200)</h2>
          <button className="add-url-btn" onClick={() => navigate('/urlscan')}>
            + Add URL
          </button>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : errorDomains.length === 0 ? (
          <p>All domains are healthy ✅</p>
        ) : (
          <ul className="errordomain-list">
            {errorDomains.map((site, index) => (
              <li key={index} className="errordomain-card">
                <strong>{site.domain}</strong>
                <p>Status Code: {site.statusCode || 'Unknown'}</p>
                <p>Last Checked: {new Date(site.lastChecked).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Layout>
  );
}

export default ErrorDomains;
