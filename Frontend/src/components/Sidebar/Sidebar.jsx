import './Sidebar.css';
import { NavLink, useNavigate } from 'react-router-dom';

const Sidebar = ({ isOpen, onClose }) => {
  const superCategory = localStorage.getItem("superCategory") || "natural";
  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
  const role = loggedInUser?.role || "user"; // e.g., 'user', 'sub-user'

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-head">
        <h2 className="logo">{role === 'sub-user' ? 'Sub User' : 'User'}</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <ul className="nav-links">
        <li><NavLink to={`/products/${superCategory}`}>
          <i className="fa-solid fa-gauge-high"></i>
            <span>User Dashboard</span>
        </NavLink></li>
        <li><NavLink to={`/urlscan/${superCategory}`}>
            <i className="fa-solid fa-link"></i>
            <span>URL Scan</span>
        </NavLink></li>
        <li><NavLink to={`/domains/`}>
            <i className="fa-solid fa-globe"></i>
            <span>Domain List</span>
        </NavLink></li>
        <li><NavLink to={`/domain-errors/${superCategory}`}>
          <i className="fa-solid fa-triangle-exclamation"></i>
            <span>Error Domains</span>
        </NavLink></li>
        <li><NavLink to={`/affiliate-errors/${superCategory}`}><i className="fa-solid fa-bug"></i>
            <span>Error Affiliate</span>
          </NavLink></li>
        <li><NavLink to={`/domain-expire/${superCategory}`}>
          <i className="fa-solid fa-clock"></i>
            <span>Expire Domain</span>
        </NavLink></li>
        <li><NavLink to={`/not-index/${superCategory}`}>
           <i className="fa-solid fa-ban"></i>
            <span>Not Bing Indexed</span>
         </NavLink></li>
        <li><NavLink to={`/hosting-form`}>
            <i className="fa-solid fa-server"></i>
            <span>Add Hosting</span>
        </NavLink></li>
        <li><NavLink to={`/hosting-data`}>
          <i className="fa-solid fa-database"></i>
            <span>Hosting Data</span>
        </NavLink></li>
        <li><NavLink to={`/hosting-expire/${superCategory}`}>
          <i className="fa-solid fa-hourglass-end"></i>
            <span>Expire Server</span>
        </NavLink></li>

        {/* Show only for main users */}
         {role === "user" && !loggedInUser.parentUser && (
          <li><NavLink to="/subusers">
            <i className="fa-solid fa-users-gear"></i>
              <span>Manage SubUsers</span>
            </NavLink></li>
        )}

        <li className="logout">
         
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
