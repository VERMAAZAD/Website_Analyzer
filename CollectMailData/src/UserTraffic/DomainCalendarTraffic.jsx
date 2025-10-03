// src/pages/DomainCalendarTraffic.jsx
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import axios from "axios";
import Layout from "../components/Layouts/Layout";

const DomainCalendarTraffic = () => {
  const { domain } = useParams();
  const [dailyStats, setDailyStats] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedData, setSelectedData] = useState(null);

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URI}/traffic/stats/domain/${domain}/daily?days=7`)
      .then(res => {
        setDailyStats(res.data);
      })
      .catch(err => console.error(err));
  }, [domain]);

  const handleDateChange = (date) => {
    setSelectedDate(date);
    const dayStr = date.toISOString().split("T")[0];
    const dayData = dailyStats.find(d => d.day === dayStr);
    setSelectedData(dayData || { totalViews: 0, uniqueVisitors: 0 });
  };

  return (
    <Layout>
      <div className="calendar-traffic-container">
        <h2>Traffic Calendar for {domain}</h2>

        <div className="calendar-wrapper">
          <Calendar onChange={handleDateChange} value={selectedDate} />
        </div>

        <div className="stats-box">
          <h3>Stats for {selectedDate.toISOString().split("T")[0]}</h3>
          <p><strong>Total Views:</strong> {selectedData?.totalViews || 0}</p>
          <p><strong>Unique Visitors:</strong> {selectedData?.uniqueVisitors || 0}</p>
        </div>
      </div>
    </Layout>
  );
};

export default DomainCalendarTraffic;
