import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getAnalytics, getFunnelStats, getDailyAnalytics, getLinkBySlug } from "../api";
import Layout from "../components/Layouts/Layout";

import { Bar, Pie, Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
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
  PointElement,
  Tooltip,
  Legend
);

export default function AnalyticsPage() {
  const { slug } = useParams();

  const [analytics, setAnalytics] = useState([]);
  const [funnel, setFunnel] = useState([]);
  const [daily, setDaily] = useState([]);
  const [originalUrl, setOriginalUrl] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try{
      const a = await getAnalytics(slug);
    const f = await getFunnelStats(slug);
    const d = await getDailyAnalytics(slug);
    const linkData = await getLinkBySlug(slug)

    setAnalytics(a || []);
    setFunnel(f || []);
    setDaily(d || []);
    setOriginalUrl(linkData?.originalUrl || "");
    }catch(err){
        console.error("Error loading analytics:", err);
    }
     setLoading(false);
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
  if (loading) {
    return (
      <Layout>
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
      </Layout>
    );
  }
  return (
    <Layout>
      <div className="analytics-container fade-in">

        <p className="original_url">
          Original URL:{" "}
          <a href={originalUrl} target="_blank" rel="noopener noreferrer">
            {originalUrl}
          </a>
        </p>
        <p>Total Visits: <b>{analytics.length}</b></p>

        {/* Charts */}
        <div className="charts-grid">

             {/* Daily Traffic */}
        <div className="chart-card">
          <h3>📅 Daily Traffic</h3>

          {daily.length === 0 ? (
            <p>No daily traffic recorded.</p>
          ) : (
            <>
              {/** Filter last 7 days */}
              {(() => {
                const last7Days = daily
                  .sort((a, b) => new Date(a.date) - new Date(b.date)) // ensure sorted by date
                  .slice(-7); // take last 7 days

                return (
                  <>
                    <Line
                      key="daily-traffic"
                      data={{
                        labels: last7Days.map((d) => d.date),
                        datasets: [
                          {
                            label: "Visits Per Day",
                            data: last7Days.map((d) => d.clicks),
                            borderWidth: 1,
                            borderColor: "#20bf6b",
                            backgroundColor: "rgba(32,191,107,0.3)",
                            tension: 0.4
                          }
                        ]
                      }}
                      options={{
                        responsive: true,
                        plugins: { legend: { display: true } }
                      }}
                    />

                    {/* DATE + VIEWS LIST */}
                    <div className="daily-list">
                      <ul>
                        {last7Days.map((d, i) => (
                          <li key={i}>
                            <span className="date">{d.date}</span>
                            <span className="views">{d.clicks} Click</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                );
              })()}
            </>
          )}
        </div>

           {/* Country */}
          <div className="chart-card">
            <h4>Country</h4>

            {Object.keys(countries).length === 0 ? (
              <p>No country data available.</p>
            ) : (
              <>
                {/* Prepare top 5 countries for chart */}
                {(() => {
                  const sorted = Object.entries(countries).sort(([, a], [, b]) => b - a);
                  const top5 = sorted.slice(0, 5);
                  return (
                    <Bar
                      key="country-chart"
                      data={{
                        labels: top5.map(([country]) => country),
                        datasets: [
                          {
                            label: "Visits",
                            backgroundColor: "#20bf6b",
                            data: top5.map(([, count]) => count)
                          }
                        ]
                      }}
                    />
                  );
                })()}

                {/* COUNTRY LIST WITH VIEWS */}
                <div className="country-list">
                  <ul>
                    {Object.entries(countries)
                      .sort(([, a], [, b]) => b - a) // sort descending
                      .map(([country, count], i) => (
                        <li key={i}>
                          <span className="country">{country}</span>
                          <span className="views">{count} Views</span>
                        </li>
                      ))}
                  </ul>
                </div>
              </>
            )}
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
