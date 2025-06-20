import { useNavigate } from "react-router-dom";
import "./Sidebar.css";

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="sidebar">
      <h2 className="logo">📅 MyPlanner</h2>
      <button onClick={() => navigate("/profile")}>👤 Profile</button>
      <button onClick={() => navigate("/progress")}>📈 Progress</button>
      <button onClick={handleLogout}>🚪 Logout</button>
    </div>
  );
};

export default Sidebar;
