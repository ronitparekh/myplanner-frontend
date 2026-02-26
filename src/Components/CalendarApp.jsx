import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api"; // 🔁 Replace with actual relative path
import "./CalendarApp.css";

const CalendarApp = () => {
  const navigate = useNavigate();
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const currentDate = new Date();
  const [currentMonth, setCurrentMonth] = useState(currentDate.getMonth());
  const [currentYear, setCurrentYear] = useState(currentDate.getFullYear());
  const [selectedDate, setSelectedDate] = useState(currentDate);
  const [showEventPopup, setShowEventPopup] = useState(false);
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
      .catch((err) => {
        if (err?.response?.status === 401) navigate("/", { replace: true });
        console.error("Failed to fetch events", err);
      });
  }, [navigate]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        monthDropdownRef.current && !monthDropdownRef.current.contains(e.target)
      ) setShowMonthDropdown(false);
      if (
        yearDropdownRef.current && !yearDropdownRef.current.contains(e.target)
      ) setShowYearDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isSameDay = (d1, d2) => {
    return (
      new Date(d1).getFullYear() === d2.getFullYear() &&
      new Date(d1).getMonth() === d2.getMonth() &&
      new Date(d1).getDate() === d2.getDate()
    );
  };

  const isPastDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(date).getTime() < today.getTime();
  };

  const handleDayClick = (day) => {
    setSelectedDate(new Date(currentYear, currentMonth, day));
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
      alert("An event already exists at this time.");
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
        ? events.map((e) => (e._id === res.data._id ? res.data : e))
        : [...events, res.data];

      updatedEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
      setEvents(updatedEvents);
      setEventTime({ hours: "00", minutes: "00" });
      setEventText("");
      setShowEventPopup(false);
      setEditingEvent(null);
    } catch (err) {
      console.error("Event submit error:", err);
      alert("Failed to save event.");
    }
  };

  const handleEditEvent = (event) => {
    if (isPastDate(event.date)) return;
    setSelectedDate(new Date(event.date));
    const [h, m] = event.time.split(":");
    setEventTime({ hours: h, minutes: m });
    setEventText(event.text);
    setEditingEvent(event);
    setShowEventPopup(true);
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      await API.delete(`/events/${eventId}`);
      setEvents(events.filter((e) => e._id !== eventId));
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
      setEvents(events.map((e) => (e._id === eventId ? res.data : e)));
    } catch (err) {
      console.error("Toggle failed:", err);
    }
  };

  const handleTimeChange = (e) => {
    const { name, value } = e.target;
    setEventTime((prev) => ({
      ...prev,
      [name]: value.padStart(2, "0"),
    }));
  };

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();

  const filteredEvents = events
    .filter((e) => isSameDay(e.date, selectedDate))
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
            <h2 onClick={() => {
              setShowMonthDropdown(!showMonthDropdown);
              setShowYearDropdown(false);
            }}>
              {months[currentMonth]}
            </h2>
            {showMonthDropdown && (
              <div className="dropdown" ref={monthDropdownRef}>
                {months.map((m, i) => (
                  <div className="dropdown-item" key={i} onClick={() => {
                    setCurrentMonth(i);
                    setShowMonthDropdown(false);
                  }}>{m}</div>
                ))}
              </div>
            )}
          </div>
          <div className="dropdown-container">
            <h2 onClick={() => {
              setShowYearDropdown(!showYearDropdown);
              setShowMonthDropdown(false);
            }}>
              {currentYear}
            </h2>
            {showYearDropdown && (
              <div className="dropdown" ref={yearDropdownRef}>
                {[...Array(101)].map((_, i) => {
                  const year = currentDate.getFullYear() - 50 + i;
                  return (
                    <div className="dropdown-item" key={year} onClick={() => {
                      setCurrentYear(year);
                      setShowYearDropdown(false);
                    }}>{year}</div>
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
          {daysOfWeek.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>

        <div className="days">
          {[...Array(firstDay).keys()].map((_, i) => <span key={`e-${i}`} />)}
          {[...Array(daysInMonth).keys()].map((d) => {
            const date = new Date(currentYear, currentMonth, d + 1);
            const isCurrent = isSameDay(date, currentDate);
            const isSelected = isSameDay(date, selectedDate);
            const hasEvent = events.some((e) => isSameDay(e.date, date));

            return (
              <span
                key={d + 1}
                className={`day ${isCurrent ? "current-day" : ""} ${isSelected ? "selected-day" : ""} ${hasEvent ? "has-event" : ""}`}
                onClick={() => handleDayClick(d + 1)}
              >
                {d + 1}
              </span>
            );
          })}
        </div>

        <button
          className="add-event-btn"
          onClick={() => !isPastDate(selectedDate) && setShowEventPopup(true)}
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
        <div className="events-header">
          <div>
            <h2>Upcoming Tasks</h2>
            <p>
              {selectedDate.toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {showEventPopup && (
          <div className="modal-backdrop" onMouseDown={() => setShowEventPopup(false)}>
            <div className="event-popup" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
              <h3>{editingEvent ? "Edit Event" : "New Event"}</h3>

              <div className="time-input">
                <label>Time (24h)</label>
                <input
                  type="number"
                  name="hours"
                  min="0"
                  max="23"
                  value={eventTime.hours}
                  onChange={handleTimeChange}
                />
                <input
                  type="number"
                  name="minutes"
                  min="0"
                  max="59"
                  value={eventTime.minutes}
                  onChange={handleTimeChange}
                />
              </div>

              <textarea
                value={eventText}
                onChange={(e) => {
                  if (!isPastDate(selectedDate) && e.target.value.length <= 60) {
                    setEventText(e.target.value);
                  }
                }}
                placeholder="Event description (max 60 chars)"
                maxLength={60}
              />

              <div className="event-popup-actions">
                <button className="primary" onClick={handleEventSubmit}>
                  {editingEvent ? "Update" : "Add"}
                </button>
                <button
                  className="secondary"
                  onClick={() => {
                    setShowEventPopup(false);
                    setEditingEvent(null);
                    setEventText("");
                    setEventTime({ hours: "00", minutes: "00" });
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {filteredEvents.length === 0 ? (
          <div className="no-events-placeholder">
            <p>No events for this day.</p>
            <p>Click "+ Add Event" to schedule one.</p>
          </div>
        ) : (
          filteredEvents.map((e, i) => (
            <div key={i} className={`event ${e.done ? "done" : ""}`}>
              <div className="event-time">{e.time}</div>
              <div className="event-text" onClick={() => toggleEventDone(e._id)}>{e.text}</div>
              <div className="event-buttons">
                {!isPastDate(e.date) && (
                  <>
                    <i className="bx bxs-edit-alt" onClick={() => handleEditEvent(e)}></i>
                    <i className="bx bxs-message-alt-x" onClick={() => handleDeleteEvent(e._id)}></i>
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
