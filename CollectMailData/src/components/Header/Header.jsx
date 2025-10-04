import React, { useState, useEffect } from "react";
import "./Header.css";

const Header = () => {
  const [category, setCategory] = useState(
    localStorage.getItem("selectedCategory") || "traffic"
  );
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const categories = [
    { label: "Dating Traffic", value: "traffic" },
    { label: "Ads Website", value: "adswebsite" },
  ];

  const handleSelect = (value) => {
    setCategory(value);
    localStorage.setItem("selectedCategory", value);
    setDropdownOpen(false);

    // Trigger a storage event manually to notify other components
    window.dispatchEvent(new Event("categoryChange"));
  };

  return (
    <div className="header">
      <div className="header-left">
        <button className="menu-btn">☰</button>
        <h2>Dashboard</h2>
      </div>

      <div className="header-right">
        <div className="user-name">Welcome, User</div>

        <div className="dropdown-container">
          <button
            className="dropdown-button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            {categories.find((c) => c.value === category)?.label || "Select Category"} ▾
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
    </div>
  );
};

export default Header;
