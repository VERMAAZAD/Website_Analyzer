import { useEffect, useState } from 'react';
import axios from 'axios';
import './ErrorDomain.css';

function ErrorDomains() {
  const [errorDomains, setErrorDomains] = useState([]);
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
      console.log("Refreshed Error Domains →", res.data);
      setErrorDomains(res.data);
    } catch (err) {
      console.error("❌ Failed to fetch error domains", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefreshedErrorDomains();
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
          {errorDomains.map((domain, index) => (
            <li key={index} className="errordomain-card">
              <strong>{domain}</strong>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ErrorDomains;
