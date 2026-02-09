import { handleSuccess } from '../../toastutils';
import './Sidebar.css';
import { NavLink, useNavigate } from 'react-router-dom';

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const superCategory = localStorage.getItem("superCategory") || "natural";
  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
  const role = loggedInUser?.role || "user";


  const handleLogout = () => {
     localStorage.removeItem('token');
    localStorage.removeItem('loggedInUser');
    localStorage.removeItem('hostingHistory');
    localStorage.removeItem('selectedCategory');
    localStorage.removeItem('superCategory');
    handleSuccess('User Logged Out');
    setTimeout(() => navigate('/login'), 1500);
  };


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
        <li><NavLink to={`/affiliate-links`}><i className="fa-solid fa-bug"></i>
            <span>Affiliate Links</span>
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
        
        {role === "sub-user" && (
         <li className="logout-btn" onClick={handleLogout}>
                <i className="fa-solid fa-right-from-bracket"></i>
            <span>Logout</span>
          </li>
        )}
        {role === "user" && !loggedInUser.parentUser && (
         <li className="logout" onClick={handleLogout}>
                
          </li>
        )}
      </ul>
    </div>
  );
};

export default Sidebar;
