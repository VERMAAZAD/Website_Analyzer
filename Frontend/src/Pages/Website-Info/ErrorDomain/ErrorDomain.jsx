import { useEffect, useState } from 'react';
import axios from 'axios';
import './ErrorDomain.css';

function ErrorDomains() {
  const superCategory = localStorage.getItem("superCategory") || "natural"; 
  const apiBase = superCategory === "casino"
    ? "casino/scraper"
    : superCategory === "dating"
    ? "dating/scraper"
    : "api/scraper";


  const [errorDomains, setErrorDomains] = useState(() => {

    const cached = localStorage.getItem("cachedErrorDomains");
    return cached ? JSON.parse(cached) : [];
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // State for error handling

  const fetchRefreshedErrorDomains = async () => {
    setLoading(true);
    setError(null); // Reset error state
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URI}/${apiBase}/refresh-and-errors`,
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
      setError("Failed to fetch error domains. Please try again later."); // Set error message
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
        <button 
          className="add-url-btn" 
          onClick={fetchRefreshedErrorDomains} 
          disabled={loading} // Disable button while loading
        >
          🔁 Refresh All
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="error-message">{error}</p> // Display error message
      ) : errorDomains.length === 0 ? (
        <p>All domains are healthy ✅</p>
      ) : (
        <ul className="errordomain-list">
          {errorDomains.map((site) => (
            <li key={site.domain} className="errordomain-card"> {/* Use unique key */}
              <p><strong>Domain:</strong> {site.domain}</p>
              <p><strong>Status Code:</strong> {site.statusCode}</p>
              <p>
                <strong>Failing URL:</strong>{" "}
                <a href={site.failingUrl} target="_blank" rel="noreferrer" aria-label={`Visit failing URL for ${site.domain}`}>
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
