import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Dashboard.css';
import Layout from '../AdminComponents/Layouts/Layout';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [users, setUsers] = useState(0);
  const [naturalDomains, setNaturalDomains] = useState(0);
  const [casinoDomains, setCasinoDomains] = useState(0);
  const [datingDomains, setDatingDomains] = useState(0);

  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch users
        const usersRes = await axios.get(`${import.meta.env.VITE_API_URI}/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const onlyUsers = usersRes.data.filter(user => user.role !== 'admin');
        setUsers(onlyUsers.length);

        // Fetch domain counts by category
        const [naturalRes, casinoRes, datingRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URI}/admin/domain-count/natural`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${import.meta.env.VITE_API_URI}/admin/domain-count/casino`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${import.meta.env.VITE_API_URI}/admin/domain-count/dating`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setNaturalDomains(naturalRes.data.count || 0);
        setCasinoDomains(casinoRes.data.count || 0);
        setDatingDomains(datingRes.data.count || 0);

      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      }
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

          <div className="card" onClick={() => {
            localStorage.setItem("superCategory", "natural");
            navigate('/admin/domains/natural')}}>
            <h3>Natural Domains</h3>
            <p>{naturalDomains}</p>
          </div>

          <div className="card" onClick={() => {
            localStorage.setItem("superCategory", "casino");
            navigate('/admin/domains/casino')}}>
            <h3>Casino Domains</h3>
            <p>{casinoDomains}</p>
          </div>

          <div className="card" onClick={() => {
            localStorage.setItem("superCategory", "dating");
            navigate('/admin/domains/dating')}}>
            <h3>Dating Domains</h3>
            <p>{datingDomains}</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
