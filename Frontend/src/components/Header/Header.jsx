import React from 'react';
import './Header.css';

const Header = ({ onMenuClick, user }) => {
  return (
    <div className="header">
      <button className="menu-btn" onClick={onMenuClick}>☰</button>
      <h1>Dashboard</h1>
      <div className="user-name">Welcome, {user || 'User'}</div>
    </div>
  );
};

export default Header;
