import CalendarApp from "./Components/CalendarApp";
import './Components/CalendarApp.css';
import './Components/Sidebar.css';
import Sidebar from "./Components/Sidebar";

const App = () => {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="calendar-container">
        <CalendarApp />
      </div>
    </div>
  );
};

export default App;
