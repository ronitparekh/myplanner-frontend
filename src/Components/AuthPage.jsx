import React, { useState } from "react";
import API from "../api/api";
import "./AuthPage.css";

const AuthPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSignUp && formData.password !== formData.confirmPassword) {
      return alert("Passwords do not match");
    }

    const endpoint = isSignUp ? "/auth/signup" : "/auth/signin";

    try {
      const { data } = await API.post( endpoint, {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      alert(data.message || "Authenticated successfully!");
      window.location.href = "/calendar";
    } catch (err) {
      alert(
        err.response?.data?.message || "Authentication failed. Try again."
      );
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-container">
        <h2>{isSignUp ? "SIGN UP" : "SIGN IN"}</h2>
        <form className="auth-form" onSubmit={handleSubmit}>
          {isSignUp && (
            <input
              type="text"
              placeholder="Your Name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
            />
          )}
          <input
            type="email"
            placeholder="Email Address"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
          />
          <input
            type="password"
            placeholder="Password"
            name="password"
            required
            value={formData.password}
            onChange={handleChange}
          />
          {isSignUp && (
            <input
              type="password"
              placeholder="Confirm Password"
              name="confirmPassword"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
            />
          )}
          <button type="submit">
            {isSignUp ? "CREATE ACCOUNT" : "LOGIN"}
          </button>
          <p onClick={() => setIsSignUp(!isSignUp)} className="switch-mode">
            {isSignUp
              ? "Already have an account? Sign In"
              : "Don't have an account? Sign Up"}
          </p>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;