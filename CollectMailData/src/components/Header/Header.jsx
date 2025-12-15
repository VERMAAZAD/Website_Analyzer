import { useState, useEffect, useRef } from "react";
import "./Header.css";
import { useNavigate, useLocation } from "react-router-dom";
import { handleError, handleSuccess } from "../../utils/toastutils";
import { FaRegCopy, FaXmark } from "react-icons/fa6";

const Header = ({ toggleSidebar }) => {
  const [category, setCategory] = useState(
    localStorage.getItem("selectedCategory") || "traffic"
  );

  const [currentCategory, setCurrentCategory] = useState("Category");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // ---- User & SSO
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
     const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
      if (loggedInUser) {
        setUser(loggedInUser);
      } 
  }, []);

  const userId = user?._id || "missing-user-id";
  
  // ---- Category & Dropdown
  const categories = [
    { label: "Dating Traffic", value: "traffic" },
    { label: "Ads Website", value: "adswebsite" },
    { label: "Natural Website", value: "natural" },
    { label: "Casino Website", value: "casinotraffic" },
  ];

  const scriptMap = {
    traffic: "traffictracker.js",
    adswebsite: "adswebtraffic.js",
    natural: "nautratraffic.js",
    casinotraffic: "casinowebtraffic.js",
  };

    const selectedScript = scriptMap[category] || "traffictracker.js";

  
  const userTrackingCode = `<script src="https://api.monitorchecker.com/${selectedScript}" data-site-id="https://yourdomain.com" data-user-id="${userId}"></script>`;



  const handleSwitch = (url) => {
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
    setTimeout(() => navigate("/login"), 500);
  };

  const handleSelect = (value) => {
    setCategory(value);
    localStorage.setItem("selectedCategory", value);
    setDropdownOpen(false);
    window.dispatchEvent(new Event("categoryChange"));
  };

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
              {categories.find((c) => c.value === category)?.label || "Select"} <span className="caret">▼</span>
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
