import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layouts/Layout";
import "./DomainTraffic.css";

const DomainTraffic = () => {
  const { domain } = useParams();
  const [locationStats, setLocationStats] = useState([]);
  const [loading, setLoading] = useState(true);

  const category = localStorage.getItem('selectedCategory') || 'traffic';

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URI}/${category}/stats/domain/${domain}`)
      .then((res) => {
        console.log("Location stats:", res.data);
        setLocationStats(Array.isArray(res.data) ? res.data : []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [domain]);

  return (
    <Layout>
      <div className="allmail-container">
        <h2>Traffic for {domain}</h2>

        {loading ? (
          <div className="spinner-container">
            <div className="spinner"></div>
          </div>
        ) : (
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
                {locationStats.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ textAlign: "center", color: "#888" }}>
                      No data available
                    </td>
                  </tr>
                ) : (
                  locationStats.map((loc, idx) => (
                    <tr key={idx}>
                      <td>{loc.country}</td>
                      <td>{loc.totalViews}</td>
                      <td>{loc.uniqueVisitors}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && (
          <Link to="/user-traffic" style={{ display: "inline-block", marginTop: "15px" }}>
            ⬅ Back to all domains
          </Link>
        )}
      </div>
    </Layout>
  );
};

export default DomainTraffic;
