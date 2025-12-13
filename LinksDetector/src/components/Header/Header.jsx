import React, { useState, useEffect, useRef } from "react";
import "./Header.css";
import { useNavigate } from "react-router-dom";
import { handleError, handleSuccess } from "../../utils/toastutils";

const Header = ({ toggleSidebar }) => {
  // ---- User & SSO
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
     const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
      if (loggedInUser) {
        setUser(loggedInUser);
      } 
  }, []);

  const handleSwitch = (url) => {
    const ssoToken = localStorage.getItem("ssoToken");
    if (!ssoToken) {
      handleError("Session expired. Please login again.");
      navigate("/login");
      return;
    }
    window.location.href = url;
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("ssoToken");
    localStorage.removeItem("ssoExpiry");
    handleSuccess("User Logged Out");
    setUser(null);
    setSidebarOpen(false);
    setTimeout(() => navigate("/login"), 1500);
  };

  return (
    <>
      {/* ===== HEADER ===== */}
      <div className="header">
        <button className="menu-btn" onClick={toggleSidebar}>
          <i className="fa-solid fa-bars"></i>
        </button>

        <div className="header-right">
          <div>{user?.name}</div>
          {/* PROFILE ICON */}
          <div className="profile-icon" onClick={() => setSidebarOpen(true)}>
            <i className="fa-solid fa-user"></i>
          </div>
        </div>
      </div>


      {/* ===== PROFILE SIDEBAR ===== */}
      {sidebarOpen && <div className="profile-overlay" onClick={() => setSidebarOpen(false)} />}
      <div className={`profile-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header-right">
          <div>
            <h3>{user?.name || "Guest User"}</h3>
            <p className="sidebar-email">{user?.email}</p>
          </div>
          <span className="close-btn-rightbar" onClick={() => setSidebarOpen(false)}>
            <i className="fa-solid fa-xmark"></i>
          </span>
        </div>
        <ul className="sidebar-links">
          <li onClick={() => handleSwitch("https://clicker.monitorchecker.com")}>
            <i className="fa-solid fa-house"></i>
            <span>Main Dashboard</span>
          </li>
          <li onClick={() => handleSwitch("https://analytics.monitorchecker.com")}>
            <i className="fa-solid fa-chart-line"></i>
            <span>Traffic Checker</span>
          </li>
          <li onClick={() => handleSwitch("https://monitorchecker.com")}>
            <i class="fa-solid fa-passport"></i>
            <span>Monitor Checker</span>
          </li>
          <li className="logout" onClick={handleLogout}>
            <i className="fa-solid fa-right-from-bracket"></i>
            <span>Logout</span>
          </li>
        </ul>
      </div>
    </>
  );
};

export default Header;
