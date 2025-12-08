import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getAnalytics, getFunnelStats } from "../api";
import Layout from "../components/Layouts/Layout";

import { Bar, Pie, Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement, // REQUIRED FOR LINE CHART
  Tooltip,
  Legend
} from "chart.js";

import "./AnalyticsPage.css";

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement, // REGISTER HERE
  Tooltip,
  Legend
);

export default function AnalyticsPage() {
  const { slug } = useParams();

  const [analytics, setAnalytics] = useState([]);
  const [funnel, setFunnel] = useState([]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const a = await getAnalytics(slug);
    const f = await getFunnelStats(slug);
    setAnalytics(a || []);
    setFunnel(f || []);
  };

  // Safe grouping
  const groupBy = (key) =>
    analytics.reduce((acc, cur) => {
      const v = cur[key] || "Unknown";
      acc[v] = (acc[v] || 0) + 1;
      return acc;
    }, {});

  const countries = groupBy("country");
  const devices = groupBy("device");
  const os = groupBy("os");
  const browsers = groupBy("browser");

  const sortedFunnel = [...funnel].sort((a, b) => a.step - b.step);

  return (
    <Layout>
      <div className="analytics-container fade-in">

        <h2>📈 Analytics — <span className="slug">{slug}</span></h2>
        <p>Total Visits: <b>{analytics.length}</b></p>

        {/* Funnel */}
        <div className="funnel-box">
          <h3>🔗 Chain Funnel</h3>

          {sortedFunnel.length === 0 ? (
            <p>No funnel data available.</p>
          ) : (
            <Line
                key={`funnel-${slug}`}
                data={{
                  labels: sortedFunnel.map((d) => `Step ${d.step} (${d.slug})`),
                  datasets: [
                    {
                      label: "Users",
                      data: sortedFunnel.map((d) => d.clicks),
                      borderWidth: 2,
                      borderColor: "#4b7bec",
                      backgroundColor: "rgba(75, 123, 236, 0.3)",
                      tension: 0.3
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  plugins: { legend: { display: true } }
                }}
              />
          )}
        </div>

        {/* Charts */}
        <div className="charts-grid">

          {/* Country */}
          <div className="chart-card">
            <h4>Country</h4>
            <Bar
              key="country-chart"
              data={{
                labels: Object.keys(countries),
                datasets: [
                  {
                    label: "Visits",
                    backgroundColor: "#20bf6b",
                    data: Object.values(countries)
                  }
                ]
              }}
            />
          </div>

          {/* Device */}
          <div className="chart-card">
            <h4>Devices</h4>
            <Pie
              key="device-chart"
              data={{
                labels: Object.keys(devices),
                datasets: [
                  {
                    backgroundColor: ["#8854d0", "#fa8231", "#eb3b5a"],
                    data: Object.values(devices)
                  }
                ]
              }}
            />
          </div>

          {/* OS */}
          <div className="chart-card">
            <h4>Operating Systems</h4>
            <Doughnut
              key="os-chart"
              data={{
                labels: Object.keys(os),
                datasets: [
                  {
                    backgroundColor: ["#3867d6", "#fc5c65", "#26de81"],
                    data: Object.values(os)
                  }
                ]
              }}
            />
          </div>

          {/* Browsers */}
          <div className="chart-card">
            <h4>Browsers</h4>
            <Pie
              key="browser-chart"
              data={{
                labels: Object.keys(browsers),
                datasets: [
                  {
                    backgroundColor: ["#2bcbba", "#a55eea", "#fed330"],
                    data: Object.values(browsers)
                  }
                ]
              }}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}
