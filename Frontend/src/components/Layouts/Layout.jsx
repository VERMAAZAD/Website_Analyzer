import React, { useEffect, useState } from 'react';
import './Layout.css';
import Sidebar from '../Sidebar/Sidebar';
import Header from '../Header/Header';

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("loggedInUser");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (err) {
        console.error("Error parsing loggedInUser from localStorage:", err);
      }
    }
  }, []);

  return (
    <div className="admin-layout">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="main-content">
        <Header onMenuClick={() => setIsSidebarOpen(true)} user={user} />
        <div className="page-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
