import React from 'react';
import './Sidebar.css';
import { Link, useNavigate } from 'react-router-dom';
import { handleSuccess } from '../../../../toastutils';

const Sidebar = ({ isOpen, onClose }) => {

  const superCategory = localStorage.getItem("superCategory") || "natural";

const apiBase =
  superCategory === "casino"
    ? "casino/scraper"
    : superCategory === "dating"
    ? "dating/scraper"
    : "api/scraper"
  
  const navigate = useNavigate();
   const handleLogout = (e) => {
        localStorage.removeItem('token');
        localStorage.removeItem('loggedInUser');
        // handleSuccess('User Loggedout');
       handleSuccess('User Logged Out')
           setTimeout(() => {
      navigate('/login');
    }, 1500);
    }

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-head">
        <h2 className="logo">Admin</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      <ul className="nav-links">
        <li><Link to={`/admin/products/${superCategory}`}>Dashboard</Link></li>
        <li><Link to={`/admin/domains/${superCategory}`}>Domain List</Link></li>
        <li><Link to="/admin/signup">Create User</Link></li>
        <li><Link to={`/admin/affiliate-errors/${superCategory}`}>Affiliate Error</Link></li>
        <li><Link to={`/admin/domain-errors/${superCategory}`}>Domain Error</Link></li>
        <li><Link to={`/admin/domain-expire/${superCategory}`}>Domain Expire</Link></li>
        <li><Link to={`/admin/not-index/${superCategory}`}>Not Bing Indexing</Link></li>
        <li><Link to={`/admin/hosting-form`}>Add Hosting</Link></li>
        <li><Link to={`/admin/hosting-data`}>Hosting Data</Link></li>
        <li><Link to={`/admin/hosting-expire/${superCategory}`}>Server Expire</Link></li>
        <li onClick={handleLogout}><Link to="/login">Logout</Link></li>
      </ul>
    </div>
    
  );
};

export default Sidebar;
