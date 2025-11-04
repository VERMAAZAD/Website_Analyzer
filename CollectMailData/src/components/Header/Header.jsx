import React, { useState, useEffect } from "react";
import "./Header.css";

const Header = ({ toggleSidebar }) => {
  const [category, setCategory] = useState(
    localStorage.getItem("selectedCategory") || "traffic"
  );
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const categories = [
    { label: "Dating Traffic", value: "traffic" },
    { label: "Ads Website", value: "adswebsite" },
    { label: "Natural Website", value: "natural" },
    { label: "Casino Website", value: "casinotraffic" },
  ];

  const handleSelect = (value) => {
    setCategory(value);
    localStorage.setItem("selectedCategory", value);
    setDropdownOpen(false);
    window.dispatchEvent(new Event("categoryChange"));
  };

  return (
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
  );
};

export default Header;
