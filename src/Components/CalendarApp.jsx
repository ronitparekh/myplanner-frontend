import { useState, useEffect, useRef } from "react";
import API from "../api/api"; // 🔁 Replace with actual path to your api.js
import "./CalendarApp.css";

const CalendarApp = () => {
  const daysofweek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthsofyear = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const currentDate = new Date();
  const [currentMonth, setCurrentMonth] = useState(currentDate.getMonth());
  const [currentYear, setCurrentYear] = useState(currentDate.getFullYear());
  const [selectedDate, setselectedDate] = useState(currentDate);
  const [showEventPopup, setshowEventPopup] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [events, setEvents] = useState([]);
  const [eventTime, setEventTime] = useState({ hours: "00", minutes: "00" });
  const [eventText, setEventText] = useState("");
  const [editingEvent, setEditingEvent] = useState(null);

  const monthDropdownRef = useRef(null);
  const yearDropdownRef = useRef(null);

  useEffect(() => {
    API.get("/events")
      .then((res) => setEvents(res.data))
      .catch((err) => console.error("Failed to fetch events", err));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        monthDropdownRef.current &&
        !monthDropdownRef.current.contains(e.target)
      ) {
        setShowMonthDropdown(false);
      }
      if (
        yearDropdownRef.current &&
        !yearDropdownRef.current.contains(e.target)
      ) {
        setShowYearDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isSameDay = (date1, date2) => {
    return (
      new Date(date1).getFullYear() === date2.getFullYear() &&
      new Date(date1).getMonth() === date2.getMonth() &&
      new Date(date1).getDate() === date2.getDate()
    );
  };

  const isPastDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(date).getTime() < today.getTime();
  };

  const handleDayClick = (day) => {
    setselectedDate(new Date(currentYear, currentMonth, day));
  };

  const prevMonth = () => {
    setCurrentMonth((prevMonth) => (prevMonth === 0 ? 11 : prevMonth - 1));
    setCurrentYear((prevYear) => (currentMonth === 0 ? prevYear - 1 : prevYear));
  };

  const nextMonth = () => {
    setCurrentMonth((prevMonth) => (prevMonth === 11 ? 0 : prevMonth + 1));
    setCurrentYear((prevYear) => (currentMonth === 11 ? prevYear + 1 : prevYear));
  };

  const handleEventSubmit = async () => {
    const formattedTime = `${eventTime.hours.padStart(2, "0")}:${eventTime.minutes.padStart(2, "0")}`;
    
    const hasConflict = events.some((event) => 
      isSameDay(event.date, selectedDate) &&
      event.time === formattedTime &&
      (!editingEvent || event._id !== editingEvent._id)
    );

    if (hasConflict) {
      alert("An event is already scheduled at this time. Please choose a different time.");
      return;
    }

    const newEvent = {
      date: selectedDate,
      time: formattedTime,
      text: eventText,
      done: editingEvent ? editingEvent.done : false,
    };

    try {
      let res;
      if (editingEvent) {
        res = await API.put(`/events/${editingEvent._id}`, newEvent);
      } else {
        res = await API.post("/events", newEvent);
      }

      const updatedEvents = editingEvent
        ? events.map((event) => (event._id === res.data._id ? res.data : event))
        : [...events, res.data];

      updatedEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
      setEvents(updatedEvents);
      setEventTime({ hours: "00", minutes: "00" });
      setEventText("");
      setshowEventPopup(false);
      setEditingEvent(null);
    } catch (err) {
      console.error("Event submit error:", err);
      alert("Something went wrong while saving the event.");
    }
  };

  const handleEditEvent = (event) => {
    if (isPastDate(event.date)) return;
    setselectedDate(new Date(event.date));
    setEventTime({
      hours: event.time.split(":")[0],
      minutes: event.time.split(":")[1],
    });
    setEventText(event.text);
    setEditingEvent(event);
    setshowEventPopup(true);
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      await API.delete(`/events/${eventId}`);
      setEvents(events.filter((event) => event._id !== eventId));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const toggleEventDone = async (eventId) => {
    const target = events.find((e) => e._id === eventId);
    if (!target || isPastDate(target.date)) return;

    try {
      const res = await API.put(`/events/${eventId}`, {
        ...target,
        done: !target.done,
      });
      setEvents(events.map((event) => (event._id === eventId ? res.data : event)));
    } catch (err) {
      console.error("Toggle done failed:", err);
    }
  };

  const handleTimeChange = (e) => {
    const { name, value } = e.target;
    setEventTime((prevTime) => ({
      ...prevTime,
      [name]: value.padStart(2, "0"),
    }));
  };

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayofMonth = new Date(currentYear, currentMonth, 1).getDay();
  const filteredEvents = events
    .filter((event) => isSameDay(event.date, selectedDate))
    .sort((a, b) => {
      const [h1, m1] = a.time.split(":").map(Number);
      const [h2, m2] = b.time.split(":").map(Number);
      return h1 !== h2 ? h1 - h2 : m1 - m2;
    });

  return (
    <div className="calendar-app">
      {/* Remainder of JSX rendering (same as before) */}
      {/* ... */}
    </div>
  );
};

export default CalendarApp;
