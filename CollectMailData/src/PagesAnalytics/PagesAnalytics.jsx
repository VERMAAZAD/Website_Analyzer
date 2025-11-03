import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  PieChart,
  Pie,
  Tooltip,
  Cell,
  ResponsiveContainer,
  Legend,
} from "recharts";
import "./PagesAnalytics.css";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const PagesAnalytics = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [siteId, setSiteId] = useState("en-blacked.com");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/trackweb/summary?siteId=${siteId}`
        );
        if (res.data?.data) setData(res.data.data);
      } catch (err) {
        console.error("Error loading click summary:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [siteId]);

  if (loading) return <div className="analytics-loading">Loading data...</div>;

  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="analytics-container">
      <h2>📊 Click Analytics for {siteId}</h2>
      <div className="analytics-content">
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                dataKey="count"
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                label={(entry) => `${entry.type}: ${entry.count}`}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="summary-table">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Count</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.type}>
                  <td>{row.type}</td>
                  <td>{row.count}</td>
                  <td>{((row.count / total) * 100).toFixed(1)}%</td>
                </tr>
              ))}
              <tr className="total-row">
                <td><strong>Total</strong></td>
                <td colSpan="2"><strong>{total}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PagesAnalytics;
