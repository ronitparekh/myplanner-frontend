import { Outlet } from "react-router-dom";
import './Components/Sidebar.css';
import Sidebar from "./Components/Sidebar";

const App = () => {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
};

export default App;
