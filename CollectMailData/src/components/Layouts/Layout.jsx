import React, { useEffect, useState } from 'react';
import './Layout.css';
import Sidebar from '../Sidebar/Sidebar';
import Header from '../Header/Header';

const Layout = ({ children }) => {
  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="main-content">
        <Header/>
        <div className="page-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
