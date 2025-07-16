import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Dashboard.css';
import Layout from '../AdminComponents/Layouts/Layout';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [users, setUsers] = useState(0);
  const [domains, setDomains] = useState(0);
  const token = localStorage.getItem('token');

  const navigate = useNavigate();
  useEffect(() => {
    const fetchData = async () => {
      const usersRes = await axios.get(`${import.meta.env.VITE_APP_URI}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const domainRes = await axios.get(`${import.meta.env.VITE_APP_URI}/admin/scraped-data`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(usersRes.data.length);
      setDomains(domainRes.data.length);
    };
    fetchData();
  }, []);

  return (
    <Layout>
    <div className="dashboard-content">
      <h2>Dashboard Overview</h2>
      <div className="dashboard-cards">
        <div className="card" onClick={() => navigate('/admin/users')}>
          <h3>Users</h3>
          <p>{users}</p>
        </div>
        <div className="card" onClick={() => navigate('/admin/domains')}>
          <h3>Domains</h3>
          <p>{domains}</p>
        </div>
      </div>
    </div>
    </Layout>
  );
};

export default Dashboard;
