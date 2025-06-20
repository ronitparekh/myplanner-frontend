import { useState, useEffect, useRef } from "react";
import axios from "axios";
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

  const API = axios.create({ baseURL: "http://localhost:5000/api" });

  API.interceptors.request.use((req) => {
    const token = localStorage.getItem("token");
    if (token) req.headers.Authorization = `Bearer ${token}`;
    return req;
  });

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
    
    // Check for time conflict
    const hasConflict = events.some((event) => 
      isSameDay(event.date, selectedDate) &&
      event.time === formattedTime &&
      (!editingEvent || event._id !== editingEvent._id) // ignore current event while editing
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
    if (isPastDate(event.date)) return; // Prevent editing past events
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
    if (!target || isPastDate(target.date)) return; // Prevent toggling past events

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
      <div className="calendar">
        <h1 className="heading">Calendar</h1>
        <div className="navigate-date">
          <div className="dropdown-container">
            <h2
              className="month"
              onClick={() => {
                setShowMonthDropdown(!showMonthDropdown);
                setShowYearDropdown(false);
              }}
            >
              {monthsofyear[currentMonth]}
            </h2>
            {showMonthDropdown && (
              <div className="dropdown" ref={monthDropdownRef}>
                {monthsofyear.map((month, idx) => (
                  <div
                    key={idx}
                    className="dropdown-item"
                    onClick={() => {
                      setCurrentMonth(idx);
                      setShowMonthDropdown(false);
                    }}
                  >
                    {month}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="dropdown-container">
            <h2
              className="year"
              onClick={() => {
                setShowYearDropdown(!showYearDropdown);
                setShowMonthDropdown(false);
              }}
            >
              {currentYear}
            </h2>
            {showYearDropdown && (
              <div className="dropdown" ref={yearDropdownRef}>
                {[...Array(101)].map((_, idx) => {
                  const year = currentDate.getFullYear() - 50 + idx;
                  return (
                    <div
                      key={year}
                      className="dropdown-item"
                      onClick={() => {
                        setCurrentYear(year);
                        setShowYearDropdown(false);
                      }}
                    >
                      {year}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="buttons">
            <i className="bx bx-chevron-left" onClick={prevMonth}></i>
            <i className="bx bx-chevron-right" onClick={nextMonth}></i>
          </div>
        </div>
        <div className="weekdays">
          {daysofweek.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className="days">
          {[...Array(firstDayofMonth).keys()].map((_, index) => (
            <span key={`empty-${index}`} />
          ))}
          {[...Array(daysInMonth).keys()].map((day) => {
            const dateObj = new Date(currentYear, currentMonth, day + 1);
            const isCurrent = isSameDay(dateObj, currentDate);
            const isSelected = isSameDay(dateObj, selectedDate);
            const hasEvent = events.some((e) =>
              isSameDay(new Date(e.date), dateObj)
            );

            return (
              <span
                key={day + 1}
                className={`day ${isCurrent ? "current-day" : ""} ${
                  isSelected ? "selected-day" : ""
                } ${hasEvent ? "has-event" : ""}`}
                onClick={() => handleDayClick(day + 1)}
              >
                {day + 1}
              </span>
            );
          })}
        </div>
        <button
          className="add-event-btn"
          onClick={() => !isPastDate(selectedDate) && setshowEventPopup(true)}
          disabled={isPastDate(selectedDate)}
          style={{
            opacity: isPastDate(selectedDate) ? 0.5 : 1,
            cursor: isPastDate(selectedDate) ? "not-allowed" : "pointer",
          }}
        >
          + Add Event
        </button>
      </div>

      <div className="events">
        {showEventPopup && (
          <div className="event-popup">
            <div className="time-input">
              <div className="event-popup-time">Time</div>
              <input
                type="number"
                name="hours"
                min={0}
                max={24}
                className="hours"
                value={eventTime.hours}
                onChange={handleTimeChange}
              />
              <input
                type="number"
                name="minutes"
                min={0}
                max={60}
                className="minutes"
                value={eventTime.minutes}
                onChange={handleTimeChange}
              />
            </div>
            <textarea
              placeholder="Enter Event Text (Maximum 60 characters)"
              value={eventText}
              onChange={(e) => {
                if (!isPastDate(selectedDate) && e.target.value.length <= 60) {
                  setEventText(e.target.value);
                }
              }}
              disabled={isPastDate(selectedDate)}
            ></textarea>
            <button
              className="event-popup-btn"
              onClick={handleEventSubmit}
              disabled={isPastDate(selectedDate)}
              style={{
                opacity: isPastDate(selectedDate) ? 0.6 : 1,
                cursor: isPastDate(selectedDate) ? "not-allowed" : "pointer",
              }}
            >
              {editingEvent ? "Update Event" : "Add Event"}
            </button>
            <button
              className="close-event-popup"
              onClick={() => setshowEventPopup(false)}
            >
              <i className="bx bx-x"></i>
            </button>
          </div>
        )}
        {filteredEvents.length === 0 ? (
          <div className="no-events-placeholder">
            <p>No events for this day yet.</p>
            <p>Click "+ Add Event" to schedule something!</p>
          </div>
        ) : (
          filteredEvents.map((event, index) => (
            <div className={`event ${event.done ? "done" : ""}`} key={index}>
              <div className="event-date-wrapper">
                <div className="event-date">
                  {`${monthsofyear[new Date(event.date).getMonth()]} ${new Date(event.date).getDate()}, ${new Date(event.date).getFullYear()}`}
                </div>
                <div className="event-time">{event.time}</div>
              </div>
              <div
                className={`event-text ${event.done ? "done" : ""}`}
                onClick={() => toggleEventDone(event._id)}
              >
                {event.text}
              </div>
              <div className="event-buttons">
                {!isPastDate(event.date) && (
                  <>
                    <i className="bx bxs-edit-alt" onClick={() => handleEditEvent(event)}></i>
                    <i className="bx bxs-message-alt-x" onClick={() => handleDeleteEvent(event._id)}></i>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CalendarApp;
