import React, { useState, useEffect, useRef } from 'react';
import './Header.css';
import { useNavigate, useLocation } from 'react-router-dom';

const Header = ({ onMenuClick, user }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState('Category');
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const getDisplayName = (type) => {
    switch (type) {
      case 'natural':
        return 'Supplement';
      case 'casino':
        return 'Casino';
      case 'dating':
        return 'Dating';
      default:
        return 'Category';
    }
  };

  const handleSelect = (type) => {
    localStorage.setItem("superCategory", type);
    navigate(`/admin/products/${type}`);
    setDropdownOpen(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-close dropdown on route change & update currentCategory
  useEffect(() => {
    setDropdownOpen(false);
    const type = location.pathname.split('/products/')[1];
    setCurrentCategory(getDisplayName(type));
  }, [location.pathname]);

  const isActive = (type) => location.pathname.includes(`/products/${type}`);

  return (
    <div className="header">
      <button className="menu-btn" onClick={onMenuClick}>☰</button>
      <h2>Dashboard</h2>

      <div className="header-right">
        <div className="dropdown-container" ref={dropdownRef}>
          <button className="dropdown-button" onClick={() => setDropdownOpen(!dropdownOpen)}>
            {currentCategory} <span className="caret">▼</span>
          </button>
          {dropdownOpen && (
            <ul className="dropdown-list">
              <li 
                className={isActive('natural') ? 'active' : ''}
                onClick={() => handleSelect('natural')}
              >
                Supplement
              </li>
              <li 
                className={isActive('casino') ? 'active' : ''}
                onClick={() => handleSelect('casino')}
              >
                Casino
              </li>
              <li 
                className={isActive('dating') ? 'active' : ''}
                onClick={() => handleSelect('dating')}
              >
                Dating
              </li>
            </ul>
          )}
        </div>

        <div className="user-name">Welcome, {user || 'User'}</div>
      </div>
    </div>
  );
};

export default Header;
