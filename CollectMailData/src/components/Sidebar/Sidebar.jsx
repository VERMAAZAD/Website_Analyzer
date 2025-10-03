import React from 'react';
import './Sidebar.css';
import { Link } from 'react-router-dom';

const Sidebar = ({ isOpen, onClose }) => {


  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <h2 className="logo">User</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      <ul className="nav-links">
        <li><Link to={`/mail-collection`}>Mail Collection</Link></li>
        <li><Link to={`/user-traffic`}>Domain Traffic</Link></li>
        <li><Link to={`/`}>Logout</Link></li>
      </ul>
    </div>
    
  );
};

export default Sidebar;
