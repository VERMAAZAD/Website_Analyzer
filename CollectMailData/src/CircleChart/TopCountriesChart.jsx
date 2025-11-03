import React from "react";
import "./TopCountriesChart.css";

const TopCountriesChart = ({ countryData }) => {
  const totalTraffic = countryData.reduce((sum, c) => sum + c.traffic, 0);

  return (
    <div className="top-countries-chart">
      <h3 className="chart-title">Top 5 Countries</h3>
      <div className="countries-list">
        {countryData.map((c, i) => {
          const percent = ((c.traffic / totalTraffic) * 100).toFixed(1);
          return (
            <div className="country-item" key={i}>
              <div className="country-circle">
                <svg viewBox="0 0 36 36" className="country-svg">
                  <path
                    className="bg"
                    d="M18 2.0845
                       a 15.9155 15.9155 0 0 1 0 31.831
                       a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="progress"
                    strokeDasharray={`${percent}, 100`}
                    d="M18 2.0845
                       a 15.9155 15.9155 0 0 1 0 31.831
                       a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="percent-text">{percent}%</div>
              </div>
              <div className="country-info">
                <span className="country-name">{c.country}</span>
                <span className="country-value">{c.traffic.toLocaleString()}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TopCountriesChart;
