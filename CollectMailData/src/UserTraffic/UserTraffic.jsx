import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./UserTraffic.css";
import Layout from "../components/Layouts/Layout";

const UserTraffic = () => {
  const [domains, setDomains] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [locationStats, setLocationStats] = useState([]);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URI}/traffic/unique/domains`)
      .then((res) => {
        console.log("Fetched domains:", res.data); // debug
        setDomains(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => console.error(err));
  }, []);

  const handleDomainClick = (domain) => {
    setSelectedDomain(domain);
    axios
      .get(`${import.meta.env.VITE_API_URI}/traffic/stats/domain/${domain}`)
      .then((res) => {
        console.log("Location stats:", res.data); // debug
        setLocationStats(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => console.error(err));
  };

  return (
    <Layout>
      <div className="allmail-container">
        <h2>All Domains Traffic</h2>

        <div className="table-wrapper">
          <table className="user-table">
            <thead>
              <tr>
                <th>Domain</th>
                <th>All-Time Views</th>
                <th>All-Time Unique</th>
                <th>Today Views</th>
                <th>Today Unique</th>
                <th>Yesterday Views</th>
                <th>Yesterday Unique</th>
                <th>Change (Views)</th>
                <th>Change (Unique)</th>
              </tr>
            </thead>
            <tbody>
              {domains.map((domain) => (
                <tr key={domain.domain} onClick={() => handleDomainClick(domain.domain)}>
                  <td>
                    <Link to={`/traffic/${domain.domain}`}>{domain.domain}</Link>
                  </td>
                  <td>{domain.allTimeTotal}</td>
                  <td>{domain.allTimeUnique}</td>
                  <td>{domain.todayTotal}</td>
                  <td>{domain.todayUnique}</td>
                  <td>{domain.yesterdayTotal}</td>
                  <td>{domain.yesterdayUnique}</td>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedDomain && (
          <div>
            <h2>Traffic for {selectedDomain}</h2>
            <ul>
              {locationStats.map((loc) => (
                <li key={loc.country}>
                  {loc.country}: {loc.count}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default UserTraffic;
