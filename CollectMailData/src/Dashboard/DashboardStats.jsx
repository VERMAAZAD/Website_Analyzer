import React from "react";
import {
  FaUsers,
  FaUserCheck,
  FaChartLine,
  FaUserAlt,
  FaGlobe,
} from "react-icons/fa";

const DashboardStats = ({
  totalTraffic,
  uniqueTraffic,
  todayTraffic,
  todayUniqueTraffic,
  totalDomains,
}) => {
  return (
    <div className="dashboard-row top-cards">
      <div className="card stat-card green">
       
        <div>
          <h3>Total Traffic</h3>
          <h1>{totalTraffic.toLocaleString()}</h1>
          <p>Total visitors in 7 days</p>
        </div>
      </div>

      <div className="card stat-card light-green">
        
        <div>
          <h3>Unique Traffic</h3>
          <h1>{uniqueTraffic.toLocaleString()}</h1>
          <p>Unique visitors in 7 days</p>
        </div>
      </div>

      <div className="card stat-card gray">
       
        <div>
          <h3>Today’s Traffic</h3>
          <h1>{todayTraffic.toLocaleString()}</h1>
          <p>All visits today</p>
        </div>
      </div>

      <div className="card stat-card teal">
        
        <div>
          <h3>Today’s Unique Traffic</h3>
          <h1>{todayUniqueTraffic.toLocaleString()}</h1>
          <p>Unique visits today</p>
        </div>
      </div>

      <div className="card stat-card light-green">
   
        <div>
          <h3>Total Domains</h3>
          <h1>{totalDomains}</h1>
          <p>Active tracked domains</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;
