import { useEffect, useState } from 'react';
import axios from 'axios';
import './ErrorDomain.css';

function ErrorDomains() {
  const [errorDomains, setErrorDomains] = useState(() => {
    const cached = localStorage.getItem("cachedErrorDomains");
    return cached ? JSON.parse(cached) : [];
  });
  const [loading, setLoading] = useState(true);

  const fetchRefreshedErrorDomains = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URI}/api/scraper/refresh-and-errors`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setErrorDomains(res.data);
      localStorage.setItem("cachedErrorDomains", JSON.stringify(res.data)); // ✅ cache new results
    } catch (err) {
      console.error("Fetch failed:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem("cachedErrorDomains")) {
      fetchRefreshedErrorDomains();
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <div className="errordomain-container">
      <div className="top-bar">
        <h2>Domains with Errors (StatusCode ≠ 200)</h2>
        <button className="add-url-btn" onClick={fetchRefreshedErrorDomains}>
          🔁 Refresh All
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
              <p><strong>Domain:</strong> {site.domain}</p>
              <p><strong>Status Code:</strong> {site.statusCode}</p>
              <p>
                <strong>Failing URL:</strong>{" "}
                <a href={site.failingUrl} target="_blank" rel="noreferrer">
                  {site.failingUrl}
                </a>
              </p>
              
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ErrorDomains;
