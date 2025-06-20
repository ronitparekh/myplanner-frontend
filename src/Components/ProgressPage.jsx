import { useEffect, useState } from "react";
import {
  RadialBarChart,
  RadialBar,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis
} from "recharts";
import axios from "axios";
import "./ProgressPage.css";

const ProgressPage = () => {
  const [dailyData, setDailyData] = useState({ completed: 0, total: 0 });
  const [weeklyData, setWeeklyData] = useState({ completed: 0, total: 0 });
  const [monthlyData, setMonthlyData] = useState({ completed: 0, total: 0 });
  const [weeklyTrend, setWeeklyTrend] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await axios.get("http://localhost:5000/api/events", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const events = res.data;
        const today = new Date();
        
        // Daily data
        const todayEvents = events.filter(e => new Date(e.date).toDateString() === today.toDateString());
        setDailyData({
          completed: todayEvents.filter(e => e.done).length,
          total: todayEvents.length
        });

        // Weekly data (Sunday to Saturday)
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay()); // Go to Sunday
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6); // Go to Saturday
        
        const weeklyEvents = events.filter(e => {
          const eventDate = new Date(e.date);
          return eventDate >= weekStart && eventDate <= weekEnd;
        });
        
        setWeeklyData({
          completed: weeklyEvents.filter(e => e.done).length,
          total: weeklyEvents.length
        });

        // Generate weekly trend data (Sunday to Saturday)
        const trendData = Array.from({ length: 7 }, (_, i) => {
          const date = new Date(weekStart);
          date.setDate(weekStart.getDate() + i);
          
          const dayEvents = events.filter(e => 
            new Date(e.date).toDateString() === date.toDateString()
          );
          
          return {
            name: date.toLocaleDateString('en-US', { weekday: 'short' }),
            date: date.toDateString(),
            completed: dayEvents.filter(e => e.done).length,
            total: dayEvents.length
          };
        });

        setWeeklyTrend(trendData);

        // Monthly data
        const monthEvents = events.filter(e => 
          new Date(e.date).getMonth() === today.getMonth()
        );
        setMonthlyData({
          completed: monthEvents.filter(e => e.done).length,
          total: monthEvents.length
        });

      } catch (err) {
        console.error("Failed to fetch progress data", err);
      }
    };

    fetchEvents();
  }, []);

  // Radial chart data for daily progress
  const dailyRadialData = [
    {
      name: 'Daily Progress',
      value: dailyData.total ? (dailyData.completed / dailyData.total) * 100 : 0,
      fill: '#FF6B6B'
    }
  ];

  return (
    <div className="progress-page">
      <h1>Your Productivity Dashboard</h1>
      
      <div className="charts-container">
        {/* Daily Progress - Radial Bar Chart */}
        <div className="chart-card daily-card">
          <h3>Today's Progress</h3>
          <div className="daily-progress-container">
            <div className="radial-chart-wrapper">
              <ResponsiveContainer width="100%" height={250}>
                <RadialBarChart
                  innerRadius="20%"
                  outerRadius="80%"
                  data={dailyRadialData}
                  startAngle={180}
                  endAngle={-180}
                >
                  <PolarAngleAxis 
                    type="number" 
                    domain={[0, 100]} 
                    angleAxisId={0} 
                    tick={false}
                  />
                  <RadialBar
                    background
                    dataKey="value"
                    cornerRadius={10}
                    animationBegin={0}
                    animationDuration={1000}
                  />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div className="daily-stats">
              <div className="daily-stat">
                <span className="stat-number">{dailyData.completed}</span>
                <span className="stat-label">Completed</span>
              </div>
              <div className="daily-stat">
                <span className="stat-number">{dailyData.total}</span>
                <span className="stat-label">Total Tasks</span>
              </div>
              <div className="daily-stat">
                <span className="stat-number">
                  {dailyData.total ? Math.round((dailyData.completed / dailyData.total) * 100) : 0}%
                </span>
                <span className="stat-label">Completion</span>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Progress - Area Chart */}
        <div className="chart-card">
          <h3>Weekly Trend</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                <XAxis 
                  dataKey="name" 
                  stroke="#e2e8f0" 
                />
                <YAxis stroke="#e2e8f0" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#2d3748',
                    borderColor: '#4a5568',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                  formatter={(value, name) => [
                    value, 
                    name === 'completed' ? 'Completed' : 'Total Tasks'
                  ]}
                  labelFormatter={(label) => `Day: ${label}`}
                />
                <Legend 
                  formatter={(value) => (
                    value === 'completed' ? 'Completed' : 'Total Tasks'
                  )}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stackId="1"
                  stroke="#4ECDC4"
                  fill="#4ECDC4"
                  fillOpacity={0.2}
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stackId="2"
                  stroke="#FFBE0B"
                  fill="#FFBE0B"
                  fillOpacity={0.8}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-summary">
            {weeklyData.completed} of {weeklyData.total} tasks completed this week
          </div>
        </div>

        {/* Monthly Progress - Bar Chart */}
        <div className="chart-card">
          <h3>Monthly Overview</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { name: 'Completed', value: monthlyData.completed },
                { name: 'Remaining', value: monthlyData.total - monthlyData.completed }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                <XAxis dataKey="name" stroke="#e2e8f0" />
                <YAxis stroke="#e2e8f0" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#2d3748',
                    borderColor: '#4a5568',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                  formatter={(value) => [value, 'tasks']}
                />
                <Bar
                  dataKey="value"
                  name="Tasks"
                  barSize={60}
                  radius={[4, 4, 0, 0]}
                >
                  <Bar dataKey="value" fill="#8884d8" name="Completed" />
                  <Bar dataKey="value" fill="#4a5568" name="Remaining" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-summary">
            {monthlyData.completed} of {monthlyData.total} tasks completed this month
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressPage;