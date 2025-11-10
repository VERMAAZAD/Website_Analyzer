import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Layout from "../components/Layouts/Layout";
import DashboardStats from "../Dashboard/DashboardStats";
import LineChartComponent from "../LineChart/LineChartComponent";
import TopCountriesChart from "../CircleChart/TopCountriesChart";
import { useParams } from "react-router-dom";
import "./Dashboard.css";

const DomainDashboard = () => {
  const { domain } = useParams();

  const [loading, setLoading] = useState(true);
  const [domainData, setDomainData] = useState(null);
  const [topCountriesData, setTopCountriesData] = useState([]);
  const [last7DaysData, setLast7DaysData] = useState([]);
  const [totalTraffic, setTotalTraffic] = useState(0);
  const [uniqueTraffic, setUniqueTraffic] = useState(0);
  const [todayTraffic, setTodayTraffic] = useState(0);
  const [todayUniqueTraffic, setTodayUniqueTraffic] = useState(0);
  const [category, setCategory] = useState(
    localStorage.getItem("selectedCategory") || "traffic"
  );
  const [error, setError] = useState("");

  // ✅ Utility: Get last 7 days
  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }
    return days;
  };

  // ✅ Fetch Data (memoized)
  const fetchDomainData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Unauthorized: No token found");
        setLoading(false);
        return;
      }

      // --- Main stats ---
      const res = await axios.get(
        `${import.meta.env.VITE_API_URI}/${category}/stats/domains/${domain}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = res.data || {};
      setDomainData(data);

      const days = getLast7Days();
      let total = 0,
        unique = 0,
        todayTotal = 0,
        todayUnique = 0;
      const todayStr = new Date().toISOString().slice(0, 10);

      // --- Prepare last 7 days chart data ---
      const dailyTotals = days.map((day) => {
        const dayData = data.daily?.[day] || { total: 0, unique: 0 };
        total += dayData.total;
        unique += dayData.unique;
        if (day === todayStr) {
          todayTotal = dayData.total;
          todayUnique = dayData.unique;
        }
        return {
          date: new Date(day).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          total: dayData.total,
          unique: dayData.unique,
        };
      });

      // --- Country stats ---
      const countryRes = await axios.get(
        `${import.meta.env.VITE_API_URI}/${category}/stats/domain/${domain}/countries`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const countries = (countryRes.data || []).map((c) => ({
        country: c.country || "Unknown",
        traffic: c.totalViews || 0,
      }));

      // --- Update states ---
      setLast7DaysData(dailyTotals);
      setTopCountriesData(countries);
      setTotalTraffic(total);
      setUniqueTraffic(unique);
      setTodayTraffic(todayTotal);
      setTodayUniqueTraffic(todayUnique);
    } catch (err) {
      console.error("Domain stats fetch error:", err);
      setError("Failed to fetch analytics data. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [domain, category]);

  // ✅ Fetch when domain/category changes
  useEffect(() => {
    fetchDomainData();
  }, [fetchDomainData]);

  // ✅ Handle category change (triggered elsewhere in app)
  useEffect(() => {
    const handleCategoryChange = () => {
      const newCategory = localStorage.getItem("selectedCategory") || "traffic";
      setCategory(newCategory);
    };
    window.addEventListener("categoryChange", handleCategoryChange);
    return () => {
      window.removeEventListener("categoryChange", handleCategoryChange);
    };
  }, []);

  return (
    <Layout>
      <div className="domain-dashboard-container">
        {loading ? (
          <div className="spinner-container">
            <div className="spinner"></div>
            <p>Loading {domain} data...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p className="error-text">⚠️ {error}</p>
          </div>
        ) : (
          <>
            <h2 className="domain-title">📊 {domain} Analytics</h2>

            <DashboardStats
              totalTraffic={totalTraffic}
              uniqueTraffic={uniqueTraffic}
              todayTraffic={todayTraffic}
              todayUniqueTraffic={todayUniqueTraffic}
              totalDomains={1}
            />

            <div className="dashboard-row middle">
              <div className="card project-analytics">
                <h3 className="chart-title">Traffic - Last 7 Days</h3>
                <LineChartComponent data={last7DaysData} />
              </div>

              <div className="card progress-card">
                <h3 className="chart-title">Top Countries</h3>
                <TopCountriesChart countryData={topCountriesData} />
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default DomainDashboard;
