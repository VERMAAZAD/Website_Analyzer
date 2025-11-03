import React from "react";
import "./Sidebar.css";
import { Link, useLocation, useNavigate } from "react-router-dom";

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("loggedInUser");
    alert("User Logged Out");
    setTimeout(() => navigate("/login"), 1000);
  };

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? "show" : ""}`} onClick={onClose}></div>

      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div><strong>AMC</strong></div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <ul className="nav-links">
          <li className={location.pathname === "/dashboard" ? "active" : ""}>
            <Link to="/dashboard">
             <i class="fa-solid fa-house-user"></i>
              <span className="link-text">Home</span>
            </Link>
          </li>
          <li className={location.pathname === "/mail-collection" ? "active" : ""}>
            <Link to="/mail-collection">
              <i className="fa-solid fa-envelope-circle-check"></i>
              <span className="link-text">Mail Collection</span>
            </Link>
          </li>

          <li className={location.pathname === "/user-traffic" ? "active" : ""}>
            <Link to="/user-traffic">
            <i className="fa-solid fa-users"></i>
              <span className="link-text">Domain Traffic</span>
            </Link>
          </li>

          <li className={location.pathname === "/traffic/last7days" ? "active" : ""}>
            <Link to="/traffic/last7days">
              <i className="fa-solid fa-chart-line"></i>
              <span className="link-text">User Traffic</span>
            </Link>
          </li>

          <li className="logout" onClick={handleLogout}>
            <i className="fa-solid fa-right-from-bracket"></i>
            <span className="link-text">Logout</span>
          </li>
        </ul>
      </aside>
    </>
  );
};

export default Sidebar;
