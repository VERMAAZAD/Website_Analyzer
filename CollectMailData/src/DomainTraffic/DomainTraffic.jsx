import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import Layout from "../components/Layouts/Layout";
import "./DomainTraffic.css";

const DomainTraffic = () => {
  const { domain } = useParams();
  const [locationStats, setLocationStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");

  const category = localStorage.getItem("selectedCategory") || "traffic";

  const fetchTrafficData = async (filter = "all") => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${import.meta.env.VITE_API_URI}/${category}/stats/domain/${domain}?filter=${filter}`,{
          headers: {
          Authorization: `Bearer ${token}`,
        },
        }
      );
      const sortedData = Array.isArray(res.data)
        ? [...res.data].sort((a, b) => (b.totalViews || 0) - (a.totalViews || 0))
        : [];
      setLocationStats(sortedData);
      setFilterType(filter);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrafficData(filterType);
  }, [domain, category]);

  return (
    <Layout>
      <div className="allmail-container">
        <h2>Traffic for {domain}</h2>

        <div className="traffic-filter-buttons">
          <button
            className={filterType === "all" ? "active" : ""}
            onClick={() => fetchTrafficData("all")}
          >
            All Traffic
          </button>
           <button
            className={filterType === "today" ? "active" : ""}
            onClick={() => fetchTrafficData("today")}
          >
            Today's Traffic
          </button>
        </div>

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
