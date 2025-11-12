// pages/SubUserManagement.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../../components/Layouts/Layout';
import './SubUserManagement.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

const SubUserManagement = () => {
  const [subUsers, setSubUsers] = useState([]);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!loggedInUser || loggedInUser.role !== 'user') { 
      alert('Access denied');
      navigate('/');
    } else {
      fetchSubUsers();
    }
  }, []);

  const fetchSubUsers = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/subusers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubUsers(res.data.subUsers || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/api/subusers`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFormData({ name: '', email: '', password: '' });
      fetchSubUsers();
      alert('Sub-user created successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating sub-user');
    }
    setLoading(false);
  };

  const handleForceLogout = async (id) => {
    if (!window.confirm('Force logout this sub-user?')) return;
    try {
      await axios.patch(`${API_BASE}/api/subusers/${id}/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchSubUsers();
      alert('Sub-user logged out successfully');
    } catch (err) {
      alert('Error logging out sub-user');
    }
  };
  const handleDelete = async (id) => {
  if (!window.confirm('Are you sure you want to delete this sub-user?')) return;

  try {
    await axios.delete(`${API_BASE}/api/subusers/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    alert('Sub-user deleted successfully');
    fetchSubUsers(); // refresh the list
  } catch (err) {
    alert(err.response?.data?.message || 'Error deleting sub-user');
  }
};


  useEffect(() => {
    fetchSubUsers();
  }, []);

  return (
    <Layout>
      <div className="subuser-container">
        <h2>Sub-User Management</h2>

        <form className="subuser-form" onSubmit={handleCreate}>
          <input
            type="text"
            placeholder="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Sub-User'}
          </button>
        </form>

        <div className="subuser-list">
          <h3>Existing Sub-Users</h3>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {subUsers.length > 0 ? (
                subUsers.map((user) => (
                  <tr key={user._id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td className={user.isLoggedIn ? 'online' : 'offline'}>
                      {user.isLoggedIn ? 'Online' : 'Offline'}
                    </td>
                    <td>{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : '-'}</td>
                    <td>
                      {user.isLoggedIn && (
                        <button
                          className="logout-btn"
                          onClick={() => handleForceLogout(user._id)}
                        >
                        Logout
                        </button>
                      )}
                       <button
                        className="delete-btn"
                        onClick={() => handleDelete(user._id)}
                    >
                        Delete
                    </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5">No sub-users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default SubUserManagement;
