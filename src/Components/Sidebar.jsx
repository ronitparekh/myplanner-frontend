import { NavLink, useNavigate } from "react-router-dom";
import "./Sidebar.css";

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2 className="logo">MyPlanner</h2>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/calendar" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          Calendar
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          Profile
        </NavLink>
        <NavLink to="/progress" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          Progress
        </NavLink>
      </nav>

      <button className="logout" onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default Sidebar;
