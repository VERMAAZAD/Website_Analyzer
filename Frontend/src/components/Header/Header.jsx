import React, { useState, useEffect, useRef } from "react";
import "./Header.css";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { handleError, handleSuccess } from "../../toastutils";

const Header = ({ onMenuClick, user }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState("Category");

  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
  const role = loggedInUser?.role || "user";

  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // 🔹 Convert route type → label
  const getDisplayName = (type) => {
    switch (type) {
      case "natural":
        return "Supplement";
      case "casino":
        return "Casino";
      case "dating":
        return "Dating";
      default:
        return "Category";
    }
  };

  // 🔹 Category select
  const handleSelect = (type) => {
    if (type === "dating") {
      const password = prompt("Enter password to access Dating category:");
      if (password !== "Dating@Web") {
        alert("Incorrect password.");
        return;
      }
    }

    localStorage.setItem("superCategory", type);
    navigate(`/products/${type}`);
    setDropdownOpen(false);
  };

  // 🔹 Detect category from URL
  useEffect(() => {
    setDropdownOpen(false);

    const lastSegment = location.pathname.split("/").pop();

    if (["natural", "casino", "dating"].includes(lastSegment)) {
      setCurrentCategory(getDisplayName(lastSegment));
      localStorage.setItem("superCategory", lastSegment);
    } else {
      setCurrentCategory("Category");
    }

    const saved = localStorage.getItem("superCategory");
    if (saved) setCurrentCategory(getDisplayName(saved));
  }, [location.pathname]);

  const isActive = (type) =>
    location.pathname.includes(`/products/${type}`);

  const handleSwitch = (url) => {
    window.location.href = url;
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('loggedInUser');
    localStorage.removeItem('hostingHistory');
    localStorage.removeItem('selectedCategory');
    localStorage.removeItem('superCategory');
    handleSuccess('User Logged Out');
    setTimeout(() => navigate('/login'), 500);
  };

  const DASHBOARD_ROUTES = {
  admin: "/admin/products/natural",
  user: "/products/natural",
  "sub-user": "/products/natural"
};

const dashboardPath = DASHBOARD_ROUTES[user?.role] || "/login";


  return (
    <>
      {/* ================= HEADER ================= */}
      <div className="header">
        <button className="menu-btn" onClick={onMenuClick}>
          <i className="fa-solid fa-bars"></i>
        </button>

        <div className="user-name">
          Welcome, {user?.name || "User"}
        </div>

        <div className="header-right">
          {/* CATEGORY DROPDOWN */}
          <div className="dropdown-container" ref={dropdownRef}>
            <button
              className="dropdown-button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              {currentCategory} <span className="caret">▼</span>
            </button>

            {dropdownOpen && (
              <ul className="dropdown-list">
                <li
                  className={isActive("natural") ? "active" : ""}
                  onClick={() => handleSelect("natural")}
                >
                  Supplement
                </li>
                <li
                  className={isActive("casino") ? "active" : ""}
                  onClick={() => handleSelect("casino")}
                >
                  Casino
                </li>
                <li
                  className={isActive("dating") ? "active" : ""}
                  onClick={() => handleSelect("dating")}
                >
                  Dating
                </li>
              </ul>
            )}
          </div>

          {/* PROFILE ICON */}
          {role === "user" && !loggedInUser.parentUser && (
          <div
            className="profile-icon"
            onClick={() => setSidebarOpen(true)}
          >
             <i className="fa-solid fa-user"></i>
          </div>
           )}
        </div>
      </div>

      {/* ================= OVERLAY ================= */}
      {sidebarOpen && (
        <div
          className="profile-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ================= SIDEBAR ================= */}
      <div className={`profile-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div>
            <h3>{user?.name}</h3>
            <p className="sidebar-email">{user?.email}</p>
          </div>
          <span
            className="close-btn-rightbar"
            onClick={() => setSidebarOpen(false)}
          >
             <i className="fa-solid fa-xmark"></i>
          </span>
        </div>

        <ul className="sidebar-links">
          <li>
            <Link to={dashboardPath}>
            <i className="fa-solid fa-house"></i>
            <span>Main Dashboard</span>
            </Link>
          </li>
          <li onClick={() => handleSwitch("https://clicker.monitorchecker.com")}>
             <i className="fa-solid fa-link"></i>
            <span>Links Detector</span>
          </li>
          <li onClick={() => handleSwitch("https://analytics.monitorchecker.com")}>
             <i className="fa-solid fa-chart-line"></i>
            <span>Traffic Checker</span>
          </li>
          {role === "user" && !loggedInUser.parentUser && (
          <li><Link to="/subusers">
            <i className="fa-solid fa-users-gear"></i>
              <span>Manage SubUsers</span>
            </Link></li>
           )}

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
