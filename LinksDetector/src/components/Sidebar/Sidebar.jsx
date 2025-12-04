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
          <div><strong>CMC</strong></div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <ul className="nav-links">
          <li className={location.pathname === "/createlink" ? "active" : ""}>
            <Link to="/createlink">
            <i class="fa-solid fa-plus"></i>
              <span className="link-text">Create Link</span>
            </Link>
          </li>

          <li className={location.pathname === "/domain-chain-links" ? "active" : ""}>
            <Link to="/domain-chain-links">
              <i class="fa-solid fa-arrows-split-up-and-left"></i>
              <span className="link-text">Chain Links</span>
            </Link>
          </li>

          <li className={location.pathname === "/domain-links" ? "active" : ""}>
            <Link to="/domain-links">
              <i class="fa-solid fa-arrow-turn-up"></i>
              <span className="link-text">Single Links</span>
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
