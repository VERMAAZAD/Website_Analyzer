// src/pages/DomainTraffic.jsx
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layouts/Layout";

const DomainTraffic = () => {
  const { domain } = useParams(); // get domain from URL
  const [locationStats, setLocationStats] = useState([]);

  useEffect(() => {
    axios.get(`http://localhost:5000/traffic/stats/domain/${domain}`)
      .then(res => {
        console.log("Location stats:", res.data);
        setLocationStats(Array.isArray(res.data) ? res.data : []);
      })
      .catch(err => console.error(err));
  }, [domain]);

  return (
    <Layout>
      <div className="allmail-container">
        <h2>Traffic for {domain}</h2>

        <div className="table-wrapper">
          <table className="user-table">
            <thead>
              <tr>
                <th>Country</th>
                <th>Total Views</th>
                <th>Unique Visitors</th>
              </tr>
            </thead>
            <tbody>
              {locationStats.map((loc, idx) => (
                <tr key={idx}>
                  <td>{loc.country}</td>
                  <td>{loc.totalViews}</td>
                  <td>{loc.uniqueVisitors}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Link to="/traffic">⬅ Back to all domains</Link>
      </div>
    </Layout>
  );
};

export default DomainTraffic;
