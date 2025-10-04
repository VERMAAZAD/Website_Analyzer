import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Layout from "../components/Layouts/Layout";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "./UserTraffic.css";

const Last7DaysTraffic = () => {
  const [domains, setDomains] = useState([]);
  const [last7Days, setLast7Days] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [loading, setLoading] = useState(true);
   const [searchTerm, setSearchTerm] = useState("");
  

  useEffect(() => {
    setLoading(true);
    axios
      .get(`${import.meta.env.VITE_API_URI}/traffic/unique/domains/last7days`)
      .then((res) => {
        setDomains(Array.isArray(res.data) ? res.data : []);
        generateLast7Days();
        setLoading(false);
      })
      .catch((err) => console.error(err));
       setLoading(false);
  }, []);

  const generateLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }
    setLast7Days(days);
  };

  const formatDateLabel = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { day: "2-digit", month: "short" });
  };

  // Prepare chart data
  const getChartData = (domain) => {
    return last7Days.map((day) => ({
      date: formatDateLabel(day),
      total: domain.daily[day]?.total || 0,
      unique: domain.daily[day]?.unique || 0,
    }));
  };

   const filteredDomains = domains.filter((d) =>
    d.domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedDomains = [...filteredDomains].sort((a, b) => {
    const aVal = last7Days.reduce(
      (sum, day) => sum + (a.daily[day]?.total || 0),
      0
    );
    const bVal = last7Days.reduce(
      (sum, day) => sum + (b.daily[day]?.total || 0),
      0
    );
    return bVal - aVal;
  });

    const totalTraffic = sortedDomains.reduce(
    (sum, d) => sum + last7Days.reduce((acc, day) => acc + (d.daily[day]?.total || 0), 0),
    0
  );

  const totalUniqueTraffic = sortedDomains.reduce(
    (sum, d) => sum + last7Days.reduce((acc, day) => acc + (d.daily[day]?.unique || 0), 0),
    0
  );

  return (
    <Layout>
      <div className="allmail-container">
        <h2>User Traffic</h2>
         <div className="traffic-controls">
          <input
            type="text"
            className="domain-search"
            placeholder="Search domain..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
          {loading ? (
          <div className="spinner-container">
            <div className="spinner"></div>
            <p>Loading data...</p>
          </div>
        ) : (
        <div className="table-wrapper">
          <table className="user-table">
            <thead>
              <tr>
                <th>Domain</th>
                <th>Total User Traffic({totalTraffic})</th>
                <th>Unique User Traffic({totalUniqueTraffic})</th>
              </tr>
            </thead>
            <tbody>
              {sortedDomains.map((domain) => {
                const totalViews = last7Days.reduce(
                  (sum, day) => sum + (domain.daily[day]?.total || 0),
                  0
                );
                const uniqueViews = last7Days.reduce(
                  (sum, day) => sum + (domain.daily[day]?.unique || 0),
                  0
                );

                return (
                  <>
                    <tr
                      key={domain.domain}
                      onClick={() =>
                        setSelectedDomain(
                          selectedDomain === domain.domain
                            ? null
                            : domain.domain
                        )
                      }
                      style={{ cursor: "pointer" }}
                    >
                      <td>
                        <Link>{domain.domain}</Link>
                      </td>
                      <td>{totalViews}</td>
                      <td>{uniqueViews}</td>
                    </tr>

                    {/* Inline chart when domain is clicked */}
                    {selectedDomain === domain.domain && (
                      <tr>
                        <td colSpan={3}>
                          <div style={{ margin: "20px 0" }}>
                            <ResponsiveContainer width="100%" height={300}>
                              <LineChart
                                data={getChartData(domain)}
                                margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line
                                  type="monotone"
                                  dataKey="total"
                                  stroke="#8884d8"
                                  name="Total Views"
                                />
                                <Line
                                  type="monotone"
                                  dataKey="unique"
                                  stroke="#82ca9d"
                                  name="Unique Views"
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
         )}
      </div>
    </Layout>
  );
};

export default Last7DaysTraffic;
