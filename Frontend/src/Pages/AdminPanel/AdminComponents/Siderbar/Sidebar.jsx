import React from 'react';
import './Sidebar.css';
import { Link, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { handleSuccess } from '../../../../toastutils';

const Sidebar = ({ isOpen, onClose }) => {
  
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
      <div className="sidebar-header">
        <h2 className="logo">Admin</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      <ul className="nav-links">
        <li><Link to="/admin/dashboard">Dashboard</Link></li>
        <li><Link to="/admin/domains">Domain List</Link></li>
        <li><Link to="/admin/signup">Create User</Link></li>
        <li><Link to="/admin/affiliate-errors">Affiliate Error</Link></li>
        <li><Link to="/admin/domain-errors">Domain Error</Link></li>
        <li><Link to="/admin/domain-expire">Domain Expire</Link></li>
        <li onClick={handleLogout}><Link to="/login">Logout</Link></li>
      </ul>
      <ToastContainer/>
    </div>
    
  );
};

export default Sidebar;
