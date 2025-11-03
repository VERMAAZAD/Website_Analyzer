import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Dashboard.css";
import Layout from "../components/Layouts/Layout";
import DashboardStats from "./DashboardStats";
import LineChartComponent from "../LineChart/LineChartComponent";
import TopCountriesChart from "../CircleChart/TopCountriesChart";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [domains, setDomains] = useState([]);
  const [totalTraffic, setTotalTraffic] = useState(0);
  const [todayTraffic, setTodayTraffic] = useState(0);
  const [uniqueTraffic, setUniqueTraffic] = useState(0);
  const [todayUniqueTraffic, setTodayUniqueTraffic] = useState(0);
  const [totalDomains, setTotalDomains] = useState(0);
  const [last7DaysData, setLast7DaysData] = useState([]);
  const [topCountriesData, setTopCountriesData] = useState([]);
  const [category, setCategory] = useState(
    localStorage.getItem("selectedCategory") || "traffic"
  );

  // ===== Helper to get last 7 days =====
  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }
    return days;
  };

  // ===== Fetch Dashboard Data =====
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${import.meta.env.VITE_API_URI}/${category}/unique/domains/last7days`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const domains = Array.isArray(res.data) ? res.data : [];

         const countryRes = await axios.get(
      `${import.meta.env.VITE_API_URI}/${category}/stats/top-countries`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const topCountries = countryRes.data.map((c) => ({
      country: c.country,
      traffic: c.totalViews,
    }));

      const days = getLast7Days();
      setDomains(domains);
      setTotalDomains(domains.length);

      let total = 0;
      let unique = 0;
      let todayTotal = 0;
      let todayUnique = 0;
      const todayStr = new Date().toISOString().slice(0, 10);

      const dailyTotals = days.map((day) => {
        const totalForDay = domains.reduce(
          (sum, d) => sum + (d.daily?.[day]?.total || 0),
          0
        );
        const uniqueForDay = domains.reduce(
          (sum, d) => sum + (d.daily?.[day]?.unique || 0),
          0
        );
        if (day === todayStr) {
          todayTotal = totalForDay;
          todayUnique = uniqueForDay;
        }
        total += totalForDay;
        unique += uniqueForDay;
        return {
          date: new Date(day).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          total: totalForDay,
          unique: uniqueForDay,
        };
      });

  
      // === Update State ===
      setTotalTraffic(total);
      setTodayTraffic(todayTotal);
      setUniqueTraffic(unique);
      setTodayUniqueTraffic(todayUnique);
      setLast7DaysData(dailyTotals);
      setTopCountriesData(topCountries);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ===== Handle Category Change =====
  useEffect(() => {
    fetchDashboardData();
    const handleCategoryChange = () => {
      const newCat = localStorage.getItem("selectedCategory") || "traffic";
      setCategory(newCat);
      fetchDashboardData();
    };
    window.addEventListener("categoryChange", handleCategoryChange);
    return () =>
      window.removeEventListener("categoryChange", handleCategoryChange);
  }, []);

  // ===== JSX Render =====
  return (
    <Layout>
      <div className="dashboard-container">
        {loading ? (
          <div className="spinner-container">
            <div className="spinner"></div>
            <p>Loading dashboard...</p>
          </div>
        ) : (
          <>
            {/* ===== Top Stats ===== */}
            <DashboardStats
              totalTraffic={totalTraffic}
              uniqueTraffic={uniqueTraffic}
              todayTraffic={todayTraffic}
              todayUniqueTraffic={todayUniqueTraffic}
              totalDomains={totalDomains}
              last7DaysData={last7DaysData}
            />

            {/* ===== Middle Row ===== */}
            <div className="dashboard-row middle">
              <div className="card project-analytics">
                <LineChartComponent data={last7DaysData} />
              </div>

              <div className="card progress-card">
                <TopCountriesChart countryData={topCountriesData} />
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
