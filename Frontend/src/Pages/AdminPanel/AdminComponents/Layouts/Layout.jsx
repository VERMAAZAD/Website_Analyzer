// src/Pages/AdminPanel/AdminComponents/Layouts/Layout.jsx
import React from "react";
import "./Layout.css";
import Sidebar from "../Siderbar/Sidebar";
import Header from "../Header/Header";
import { useState } from "react";
import { useEffect } from "react";

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
        <Header onMenuClick={() => setIsSidebarOpen(true)} user={user}/>
        <div className="content-wrapper">{children}</div>
      </div>
    </div>
  );
};

export default Layout;
