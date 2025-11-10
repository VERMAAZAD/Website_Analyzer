import { Link } from "react-router-dom";
import "./Header.css";

const Header = ({ toggleSidebar }) => {

  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-btn" onClick={toggleSidebar}>
          <i className="fas fa-bars"></i>
        </button>
      </div>

      <div className="header-right">
        <div className="user-name">
          <i className="fas fa-user-circle"></i> Welcome
        </div>

        <div className="dropdown-container">
         <Link to="/all-links">
         <button> Logs</button>
         </Link> 
        </div>
      </div>
    </header>
  );
};

export default Header;
