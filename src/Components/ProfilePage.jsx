import { useEffect, useState } from "react";
import API from "../api/api"; // 🔁 Adjust this path to where your api.js is located
import "./ProfilePage.css";

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Please login to view profile");
      return;
    }

    const fetchUser = async () => {
      setLoading(true);
      try {
        const res = await API.get("/profile");
        setUser(res.data);
      } catch (err) {
        console.error("Error fetching profile", err);
        setError("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return (
    <div className="profile-page">
      <h1>👤 My Profile</h1>

      {loading ? (
        <div className="loading-spinner"></div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : user ? (
        <div className="profile-box">
          <div className="profile-avatar">
            {user.name?.charAt(0).toUpperCase() || "U"}
          </div>

          <div className="profile-details">
            <div className="detail-row">
              <span className="detail-label">Name:</span>
              <span className="detail-value">{user.name || "Not provided"}</span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Email:</span>
              <span className="detail-value">{user.email}</span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Member Since:</span>
              <span className="detail-value">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Last Active:</span>
              <span className="detail-value">
                {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "Recently"}
              </span>
            </div>
          </div>

          <div className="profile-stats">
            <div className="stat-card">
              <span>Tasks Completed</span>
              <p>{user.tasksCompleted || 0}</p>
            </div>
            <div className="stat-card">
              <span>Projects</span>
              <p>{user.projects || 0}</p>
            </div>
          </div>
        </div>
      ) : (
        <p>No user data available</p>
      )}
    </div>
  );
};

export default ProfilePage;
