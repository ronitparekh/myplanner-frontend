import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.jsx";
import AuthPage from "./Components/AuthPage.jsx";
import "./index.css";
import ProfilePage from "./Components/ProfilePage";
import ProgressPage from "./Components/ProgressPage";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/calendar" element={<App />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/progress" element={<ProgressPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
