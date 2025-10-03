import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./UserTraffic.css";
import Layout from "../components/Layouts/Layout";

const UserTraffic = () => {
  const [domains, setDomains] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [locationStats, setLocationStats] = useState([]);

   const [loadingDomains, setLoadingDomains] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    setLoadingDomains(true);
    axios
      .get(`${import.meta.env.VITE_API_URI}/traffic/unique/domains`)
      .then((res) => {
        console.log("Fetched domains:", res.data); // debug
        setDomains(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingDomains(false));
  }, []);

  const handleDomainClick = (domain) => {
    setSelectedDomain(domain);
    setLoadingStats(true);
    axios
      .get(`${import.meta.env.VITE_API_URI}/traffic/stats/domain/${domain}`)
      .then((res) => {
        console.log("Location stats:", res.data); // debug
        setLocationStats(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingStats(false));
  };

  return (
    <Layout>
      <div className="allmail-container">
        <h2>All Domains Traffic</h2>
        {loadingDomains ? (
          <div className="spinner-container">
            <div className="spinner"></div>
            <p>Loading domains...</p>
          </div>
        ) : (
         <div className="table-wrapper">
            <table className="user-table">
              <thead>
                <tr>
                  <th>Domain</th>
                  <th>Change (Views)</th>
                  <th>Change (Unique)</th>
                  <th>Today Traffic</th>
                  <th>Today Unique Traffic</th>
                </tr>
              </thead>
              <tbody>
                {domains.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", color: "#888" }}>
                      No domain data available
                    </td>
                  </tr>
                ) : (
                  domains.map((domain) => (
                    <tr
                      key={domain.domain}
                      onClick={() => handleDomainClick(domain.domain)}
                      style={{ cursor: "pointer" }}
                    >
                      <td>
                        <Link to={`/traffic/${domain.domain}`}>{domain.domain}</Link>
                      </td>
                      <td
                        style={{
                          color:
                            domain.totalChangePercent === "N/A"
                              ? "gray"
                              : domain.totalChangePercent < 0
                              ? "red"
                              : "green",
                        }}
                      >
                        {domain.totalChangePercent !== undefined
                          ? `${domain.totalChangePercent}%`
                          : "N/A"}
                      </td>
                      <td
                        style={{
                          color:
                            domain.uniqueChangePercent === "N/A"
                              ? "gray"
                              : domain.uniqueChangePercent < 0
                              ? "red"
                              : "green",
                        }}
                      >
                        {domain.uniqueChangePercent !== undefined
                          ? `${domain.uniqueChangePercent}%`
                          : "N/A"}
                      </td>
                      <td>{domain.todayTotal}</td>
                      <td>{domain.todayUnique}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {selectedDomain && (
          <div style={{ marginTop: "30px" }}>
            <h2>Traffic for {selectedDomain}</h2>

            {loadingStats ? (
              <div className="spinner-container">
                <div className="spinner"></div>
                <p>Loading traffic stats...</p>
              </div>
            ) : locationStats.length === 0 ? (
              <p style={{ color: "#888" }}>No location stats available</p>
            ) : (
              <ul>
                {locationStats.map((loc) => (
                  <li key={loc.country}>
                    {loc.country}: {loc.count}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default UserTraffic;