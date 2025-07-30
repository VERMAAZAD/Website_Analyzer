import React from 'react';
import './Sidebar.css';
import { Link, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { handleSuccess } from '../../toastutils';

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const superCategory = localStorage.getItem("superCategory") || "natural";

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
      <div className="sidebar-header">
        <h2 className="logo">User</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      <ul className="nav-links">
        <li><Link to={`/products/${superCategory}`}> User Dashboard</Link></li>
        <li><Link to={`/urlscan/${superCategory}`}>UrlScan</Link></li>
        <li><Link to={`/domains/`}>Domain List</Link></li>
       <li><Link to={`/domain-errors/${superCategory}`}>Error Domains</Link></li>
       <li><Link to={`/affiliate-errors/${superCategory}`}>Error Affiliate</Link></li>
       <li><Link to={`/domain-expire/${superCategory}`}>Expire Domain</Link></li>
       <li><Link to={`/not-index/${superCategory}`}>Not Bing Indexing</Link></li>
        <li className="logout" onClick={handleLogout}>
        <Link>Logout</Link>
        </li>
      </ul>
      <ToastContainer/>
    </div>
    
  );
};

export default Sidebar;
