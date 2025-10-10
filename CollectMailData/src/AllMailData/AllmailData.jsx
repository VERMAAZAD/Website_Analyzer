import React, { useEffect, useState } from "react";
import "./AllmailData.css";
import Layout from "../components/Layouts/Layout";

const AllmailData = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${import.meta.env.VITE_API_URI}/collectmail/users`, {
          headers: {
          Authorization: `Bearer ${token}`,
        },
        });
        const data = await res.json();
        setUsers(data);
      } catch (err) {
        setError("Failed to fetch users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <Layout>
    <div className="allmail-container">
      <h2>All Subscribed Users</h2>
       {loading ? (
          <div className="spinner-container">
            <div className="spinner"></div>
          </div>
        ) : error ? (
          <p className="error">{error}</p>
        ) : users.length === 0 ? (
        <p className="no-data">No data found</p>
      ) : (
        <div className="table-wrapper">
          <table className="user-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Landing Page</th>
                <th>User IP</th>
                <th>User Country</th>
                <th>Created At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.landingPageUrl}</td>
                  <td>{user.ip ? user.ip : ''}</td>
                  <td>{user.geo ? user.geo.country : ''}</td>
                  <td>{new Date(user.createdAt).toLocaleString()}</td>
                  <td>
                  <button
                    onClick={async () => {
                      if (confirm("Are you sure you want to delete this user?")) {
                         const token = localStorage.getItem("token");
                         if (!token) {
                            alert("Not authenticated");
                            return;
                          }
                        await fetch(`${import.meta.env.VITE_API_URI}/collectmail/users/${user._id}`,  {
                          method: "DELETE",
                          headers: { Authorization: `Bearer ${token}`}
                        });
                        // Refresh table
                        setUsers(users.filter((u) => u._id !== user._id));
                      }
                    }}
                    style={{ color: "red", cursor: "pointer" }}
                  >
                    Delete
                  </button>
                </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
    </Layout>
  );
};

export default AllmailData;
