import React, {useEffect } from 'react';
import './Header.css';

const Header = () => {

  return (
    <div className="header">
      <button className="menu-btn">☰</button>

      <div className="header-right">
        <div className="user-name">Welcome, User</div>
      </div>
    </div>
  );
};

export default Header;
