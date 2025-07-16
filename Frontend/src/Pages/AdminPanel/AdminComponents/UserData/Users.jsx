// File: AdminPanel/Users.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Users.css';
import Layout from '../Layouts/Layout';
import { useNavigate } from 'react-router-dom'; // 🔁 Add for navigation


const Users = () => {
  const [users, setUsers] = useState([]);
  const token = localStorage.getItem('token');
  const navigate = useNavigate(); // 🧭 for navigation

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_APP_URI}/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => {
      const onlyUsers = res.data.filter(user => user.role !== 'admin'); // ✅ Filter admin
      setUsers(onlyUsers);
    });
  }, []);

  // 🔁 When user clicked, redirect to UserDomains page
  const handleUserClick = (user) => {
    navigate(`/admin/user/${user._id}/domains/${encodeURIComponent(user.name)}`);
  };

  return (
    <Layout>
      <div className="users-page">
        <h2>All Users</h2>
        <ul className="user-list">
          {users.map((user) => (
            <li key={user._id} onClick={() => handleUserClick(user)} className="user-item">
              <strong>{user.name}</strong> ({user.email})
            </li>
          ))}
        </ul>
      </div>
    </Layout>
  );
};

export default Users;
