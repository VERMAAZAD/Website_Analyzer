import React, { useState, useEffect } from "react";
import "./Header.css";
import { FaRegCopy, FaXmark } from "react-icons/fa6";

const Header = ({ toggleSidebar }) => {
  const [category, setCategory] = useState(
    localStorage.getItem("selectedCategory") || "traffic"
  );
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const storedUser = JSON.parse(localStorage.getItem("user"));
  const userId = storedUser?._id || "missing-user-id";

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

  const userTrackingCode = `
<script src="https://api.monitorchecker.com/${selectedScript}" 
data-site-id="https://yourdomain.com" 
data-user-id="${userId}">
</script>
`.trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(userTrackingCode);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleSelect = (value) => {
    setCategory(value);
    localStorage.setItem("selectedCategory", value);
    setDropdownOpen(false);
    window.dispatchEvent(new Event("categoryChange"));
  };

  return (
    <>
      <header className="header">
        <div className="header-left">
          <button className="menu-btn" onClick={toggleSidebar}>
            <i className="fas fa-bars"></i>
          </button>
        </div>

        <div className="header-right">
          <div className="user-name">
            <i className="fas fa-user-circle"></i> Welcome
          </div>

          <button className="api-btn" onClick={() => setShowApiModal(true)}>
            Get API
          </button>

          <div className="dropdown-container">
            <button
              className="dropdown-button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              {categories.find((c) => c.value === category)?.label || "Select"} ▾
            </button>

            {dropdownOpen && (
              <ul className="dropdown-list">
                {categories.map((c) => (
                  <li
                    key={c.value}
                    className={c.value === category ? "active" : ""}
                    onClick={() => handleSelect(c.value)}
                  >
                    {c.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </header>

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
    </>
  );
};

export default Header;
