import './Sidebar.css';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation(); // highlight active link

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
        <li className="logout">
          <i className="fa-solid fa-right-from-bracket"></i>
          <Link to="/">Logout</Link>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
