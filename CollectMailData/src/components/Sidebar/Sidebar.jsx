import './Sidebar.css';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const handleLogout = (e) => {
        localStorage.removeItem('token');
        localStorage.removeItem('loggedInUser');
       handleSuccess('User Logged Out')
           setTimeout(() => {
      navigate('/login');
    }, 1500);
    }

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <img src="/web-logo.png" alt="web-logo" />
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      
      <ul className="nav-links">
        <li>
          <i className="fa-solid fa-envelope-circle-check"></i>
          <Link className={location.pathname === "/mail-collection" ? "active" : ""} to="/mail-collection">
            Mail Collection
          </Link>
        </li>
        <li>
          <i className="fa-solid fa-chart-line"></i>
          <Link className={location.pathname === "/user-traffic" ? "active" : ""} to="/user-traffic">
            Domain Traffic
          </Link>
        </li>
        <li>
          <i className="fa-solid fa-users"></i>
          <Link className={location.pathname === "/traffic/last7days" ? "active" : ""} to="/traffic/last7days">
            User Traffic
          </Link>
        </li>
        <li className="logout" onClick={handleLogout}>
          <i className="fa-solid fa-right-from-bracket"></i>
          <Link to="/">Logout</Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
