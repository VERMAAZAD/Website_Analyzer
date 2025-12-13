import React, { useState, useEffect, useRef } from "react";
import "./Header.css";
import { useNavigate, useLocation } from "react-router-dom";
import { handleError, handleSuccess } from "../../utils/toastutils";
import { FaRegCopy, FaXmark } from "react-icons/fa6";

const Header = ({ toggleSidebar }) => {
  // ---- User & SSO
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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

  // ---- Category & Dropdown
  const categories = [
    { label: "Dating Traffic", value: "dating" },
    { label: "Ads Website", value: "adswebsite" },
    { label: "Natural Website", value: "natural" },
    { label: "Casino Website", value: "casino" },
  ];
  const [currentCategory, setCurrentCategory] = useState("Category");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleSelect = (value) => {
    if (value === "dating") {
      const password = prompt("Enter password to access Dating category:");
      if (password !== "Dating@Web") return alert("Incorrect password.");
    }
    localStorage.setItem("superCategory", value);
    setCurrentCategory(
      categories.find((c) => c.value === value)?.label || "Category"
    );
    setDropdownOpen(false);
    navigate(`/products/${value}`);
  };

  useEffect(() => {
    const lastSegment = location.pathname.split("/").pop();
    if (["natural", "casino", "dating"].includes(lastSegment)) {
      setCurrentCategory(
        categories.find((c) => c.value === lastSegment)?.label || "Category"
      );
    } else {
      const saved = localStorage.getItem("superCategory");
      if (saved) setCurrentCategory(saved);
    }
  }, [location.pathname]);

  // ---- API Modal
  const [showApiModal, setShowApiModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const scriptMap = {
    dating: "traffictracker.js",
    adswebsite: "adswebtraffic.js",
    natural: "nautratraffic.js",
    casino: "casinowebtraffic.js",
  };
  const selectedScript = scriptMap[currentCategory.toLowerCase()] || "traffictracker.js";
  const userId = user?._id || "missing-user-id";
  const userTrackingCode = `<script src="https://api.monitorchecker.com/${selectedScript}" data-site-id="https://yourdomain.com" data-user-id="${userId}"></script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(userTrackingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* ===== HEADER ===== */}
      <div className="header">
        <button className="menu-btn" onClick={toggleSidebar}>
          <i className="fa-solid fa-bars"></i>
        </button>

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
                {categories.map((c) => (
                  <li
                    key={c.value}
                    className={c.label === currentCategory ? "active" : ""}
                    onClick={() => handleSelect(c.value)}
                  >
                    {c.label}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* GET API BUTTON */}
          <button className="api-btn" onClick={() => setShowApiModal(true)}>
            Get API
          </button>

          {/* PROFILE ICON */}
          <div className="profile-icon" onClick={() => setSidebarOpen(true)}>
            <i className="fa-solid fa-user"></i>
          </div>
        </div>
      </div>

      {/* ===== API MODAL ===== */}
      {showApiModal && (
        <div className="modal-overlay">
          <div className="modal">
            <button className="close-api-btn" onClick={() => setShowApiModal(false)}>
              <FaXmark />
            </button>
            <h2>Your Website Tracking Code</h2>
            <textarea readOnly className="api-textarea" value={userTrackingCode} />
            <button className="copy-btn" onClick={handleCopy}>
              <FaRegCopy />
            </button>
            {copied && <p className="copied-text">✔ Copied!</p>}
          </div>
        </div>
      )}

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
          <li onClick={() => handleSwitch("https://analytics.monitorchecker.com")}>
            <i className="fa-solid fa-house"></i>
            <span>Main Dashboard</span>
          </li>
          <li onClick={() => handleSwitch("https://clicker.monitorchecker.com")}>
            <i className="fa-solid fa-link"></i>
            <span>Links Detector</span>
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
