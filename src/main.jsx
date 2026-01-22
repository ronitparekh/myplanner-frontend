import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import App from "./App.jsx";
import AuthPage from "./Components/AuthPage.jsx";
import "./index.css";
import ProfilePage from "./Components/ProfilePage";
import ProgressPage from "./Components/ProgressPage";
import CalendarApp from "./Components/CalendarApp";
import RequireAuth from "./components/RequireAuth.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route
          element={
            <RequireAuth>
              <App />
            </RequireAuth>
          }
        >
          <Route path="/calendar" element={<CalendarApp />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/progress" element={<ProgressPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
