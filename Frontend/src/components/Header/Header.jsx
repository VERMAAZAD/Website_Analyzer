import React, { useState, useEffect, useRef } from 'react';
import './Header.css';
import { useNavigate, useLocation } from 'react-router-dom';

const Header = ({ onMenuClick, user }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState('Category');
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Helper to convert type → display label
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
    if (type === 'dating') {
      const password = prompt('Enter password to access Dating category:');
      if (password !== 'Dating@Web') {
        alert('Incorrect password.');
        return;
      }
    }

    localStorage.setItem("superCategory", type);
    navigate(`/products/${type}`);
    setDropdownOpen(false);
  };

  useEffect(() => {
    setDropdownOpen(false);

    const pathParts = location.pathname.split('/');
    const lastSegment = pathParts[pathParts.length - 1];

    if (['natural', 'casino', 'dating'].includes(lastSegment)) {
      setCurrentCategory(getDisplayName(lastSegment));
      localStorage.setItem('superCategory', lastSegment); 
    } else {
      setCurrentCategory('Category'); 
    }

    const savedType = localStorage.getItem('superCategory');
    if (savedType && ['natural', 'casino', 'dating'].includes(savedType)) {
      setCurrentCategory(getDisplayName(savedType));
    }
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
