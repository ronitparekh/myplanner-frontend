import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import "./CalendarApp.css";

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const reminderOptions = [
  { value: "none", label: "No reminder" },
  { value: "5m", label: "5 minutes before" },
  { value: "10m", label: "10 minutes before" },
  { value: "15m", label: "15 minutes before" },
  { value: "30m", label: "30 minutes before" },
  { value: "1h", label: "1 hour before" },
  { value: "1d", label: "1 day before" },
  { value: "custom", label: "Custom" },
];
const repeatOptions = [
  { value: "once", label: "One time" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "weekdays", label: "Weekdays" },
  { value: "custom", label: "Custom rule" },
];
const calendarOptions = ["Google Calendar", "Personal", "Work"];

const toDateInputValue = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }

  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

const toDateTimeLocalValue = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const createTaskDraft = (selectedDate) => ({
  type: "task",
  title: "",
  date: toDateInputValue(selectedDate),
  time: "09:00",
  description: "",
  tag: "Daily Task",
});

const createEventDraft = (selectedDate) => {
  const dateValue = toDateInputValue(selectedDate);

  return {
    type: "event",
    title: "",
    date: dateValue,
    allDay: false,
    startDateTime: `${dateValue}T09:00`,
    endDateTime: `${dateValue}T10:00`,
    calendarProvider: "Google Calendar",
    repeat: "once",
    repeatCustom: "",
    reminder: "30m",
    customReminderMinutes: "",
    guests: "",
    location: "",
    description: "",
  };
};

const getEntryDate = (entry) => new Date(entry.startDateTime || entry.date);

const isSameDay = (left, right) => {
  const leftDate = new Date(left);
  const rightDate = new Date(right);

  return (
    leftDate.getFullYear() === rightDate.getFullYear() &&
    leftDate.getMonth() === rightDate.getMonth() &&
    leftDate.getDate() === rightDate.getDate()
  );
};

const getSortWeight = (entry) => {
  if (entry.type === "event") {
    if (entry.allDay) return getEntryDate(entry).setHours(0, 0, 0, 0);
    if (entry.startDateTime) return new Date(entry.startDateTime).getTime();
  }

  if (entry.time) {
    const [hours, minutes] = entry.time.split(":").map(Number);
    const baseDate = getEntryDate(entry);
    baseDate.setHours(hours || 0, minutes || 0, 0, 0);
    return baseDate.getTime();
  }

  return getEntryDate(entry).setHours(23, 59, 0, 0);
};

const normalizeEntry = (entry) => ({
  ...entry,
  type: entry.type === "task" ? "task" : "event",
  title: entry.title || entry.text || "",
  text: entry.text || entry.title || "",
  guests: Array.isArray(entry.guests) ? entry.guests : [],
  allDay: Boolean(entry.allDay),
  calendarProvider: entry.calendarProvider || "Google Calendar",
  repeat: entry.repeat || "once",
  repeatCustom: entry.repeatCustom || "",
  reminder: entry.reminder || "none",
  customReminderMinutes: entry.customReminderMinutes || "",
  location: entry.location || "",
  description: entry.description || "",
  tag: entry.tag || "",
  time: entry.time || "",
});

const formatEntryTime = (entry) => {
  if (entry.type === "task") {
    return entry.time || "Any time";
  }

  if (entry.allDay) {
    return "All day";
  }

  if (entry.startDateTime && entry.endDateTime) {
    const start = new Date(entry.startDateTime);
    const end = new Date(entry.endDateTime);

    return `${start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })} - ${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}`;
  }

  return entry.time || "Scheduled";
};

const entryToDraft = (entry) => {
  if (entry.type === "task") {
    return {
      type: "task",
      title: entry.title,
      date: toDateInputValue(entry.date),
      time: entry.time || "",
      description: entry.description || "",
      tag: entry.tag || "Daily Task",
    };
  }

  return {
    type: "event",
    title: entry.title,
    date: toDateInputValue(entry.date),
    allDay: Boolean(entry.allDay),
    startDateTime: toDateTimeLocalValue(entry.startDateTime || entry.date),
    endDateTime: toDateTimeLocalValue(entry.endDateTime || entry.date),
    calendarProvider: entry.calendarProvider || "Google Calendar",
    repeat: entry.repeat || "once",
    repeatCustom: entry.repeatCustom || "",
    reminder: entry.reminder || "none",
    customReminderMinutes: entry.customReminderMinutes ? String(entry.customReminderMinutes) : "",
    guests: Array.isArray(entry.guests) ? entry.guests.join(", ") : "",
    location: entry.location || "",
    description: entry.description || "",
  };
};

const CalendarApp = () => {
  const navigate = useNavigate();
  const today = new Date();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(today);
  const [showComposer, setShowComposer] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [entries, setEntries] = useState([]);
  const [draft, setDraft] = useState(createTaskDraft(today));
  const [composerMode, setComposerMode] = useState("task");
  const [editingEntry, setEditingEntry] = useState(null);
  const [activePlannerView, setActivePlannerView] = useState("tasks");
  const [showQuickAddMenu, setShowQuickAddMenu] = useState(false);

  const monthDropdownRef = useRef(null);
  const yearDropdownRef = useRef(null);
  const quickAddRef = useRef(null);

  useEffect(() => {
    API.get("/events")
      .then((res) => {
        const normalized = res.data.map(normalizeEntry).sort((left, right) => getSortWeight(left) - getSortWeight(right));
        setEntries(normalized);
      })
      .catch((err) => {
        if (err?.response?.status === 401) {
          navigate("/", { replace: true });
          return;
        }

        console.error("Failed to fetch planner entries", err);
      });
  }, [navigate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (monthDropdownRef.current && !monthDropdownRef.current.contains(event.target)) {
        setShowMonthDropdown(false);
      }
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(event.target)) {
        setShowYearDropdown(false);
      }
      if (quickAddRef.current && !quickAddRef.current.contains(event.target)) {
        setShowQuickAddMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const updateEntries = (nextEntries) => {
    const normalized = nextEntries.map(normalizeEntry).sort((left, right) => getSortWeight(left) - getSortWeight(right));
    setEntries(normalized);
  };

  const openComposer = (mode) => {
    setComposerMode(mode);
    setEditingEntry(null);
    setDraft(mode === "task" ? createTaskDraft(selectedDate) : createEventDraft(selectedDate));
    setShowQuickAddMenu(false);
    setShowComposer(true);
  };

  const closeComposer = () => {
    setShowComposer(false);
    setEditingEntry(null);
  };

  const handleDayClick = (day) => {
    setSelectedDate(new Date(currentYear, currentMonth, day));
  };

  const prevMonth = () => {
    setCurrentMonth((previousMonth) => (previousMonth === 0 ? 11 : previousMonth - 1));
    setCurrentYear((previousYear) => (currentMonth === 0 ? previousYear - 1 : previousYear));
  };

  const nextMonth = () => {
    setCurrentMonth((previousMonth) => (previousMonth === 11 ? 0 : previousMonth + 1));
    setCurrentYear((previousYear) => (currentMonth === 11 ? previousYear + 1 : previousYear));
  };

  const handleDraftChange = (field, value) => {
    setDraft((previous) => ({ ...previous, [field]: value }));
  };

  const buildPayloadFromDraft = () => {
    if (!draft.title.trim()) {
      throw new Error(composerMode === "task" ? "Task title is required." : "Event name is required.");
    }

    if (composerMode === "task") {
      return {
        type: "task",
        title: draft.title.trim(),
        text: draft.title.trim(),
        date: draft.date,
        time: draft.time || "",
        description: draft.description.trim(),
        tag: draft.tag.trim(),
        done: editingEntry?.done || false,
        timezone,
      };
    }

    if (!draft.allDay && (!draft.startDateTime || !draft.endDateTime)) {
      throw new Error("Start and end date/time are required for timed events.");
    }

    return {
      type: "event",
      title: draft.title.trim(),
      text: draft.title.trim(),
      date: draft.allDay ? draft.date : draft.startDateTime.slice(0, 10),
      allDay: draft.allDay,
      startDateTime: draft.allDay ? null : draft.startDateTime,
      endDateTime: draft.allDay ? null : draft.endDateTime,
      calendarProvider: draft.calendarProvider,
      repeat: draft.repeat,
      repeatCustom: draft.repeatCustom.trim(),
      reminder: draft.reminder,
      customReminderMinutes: draft.reminder === "custom" ? draft.customReminderMinutes : null,
      guests: draft.guests,
      location: draft.location.trim(),
      description: draft.description.trim(),
      done: editingEntry?.done || false,
      timezone,
    };
  };

  const handleSubmit = async () => {
    try {
      const payload = buildPayloadFromDraft();
      const response = editingEntry
        ? await API.put(`/events/${editingEntry._id}`, payload)
        : await API.post("/events", payload);

      const nextEntries = editingEntry
        ? entries.map((entry) => (entry._id === response.data._id ? response.data : entry))
        : [...entries, response.data];

      updateEntries(nextEntries);
      closeComposer();
    } catch (error) {
      console.error("Failed to save planner entry", error);
      alert(error?.response?.data?.error || error.message || "Failed to save entry.");
    }
  };

  const handleEditEntry = (entry) => {
    setSelectedDate(getEntryDate(entry));
    setComposerMode(entry.type);
    setEditingEntry(entry);
    setDraft(entryToDraft(entry));
    setShowComposer(true);
  };

  const handleDeleteEntry = async (entryId) => {
    try {
      await API.delete(`/events/${entryId}`);
      updateEntries(entries.filter((entry) => entry._id !== entryId));
    } catch (error) {
      console.error("Failed to delete planner entry", error);
      alert("Failed to delete entry.");
    }
  };

  const handleToggleTaskDone = async (entry) => {
    try {
      const response = await API.put(`/events/${entry._id}`, {
        type: "task",
        title: entry.title,
        text: entry.text,
        date: toDateInputValue(entry.date),
        time: entry.time || "",
        description: entry.description || "",
        tag: entry.tag || "Daily Task",
        done: !entry.done,
        timezone: entry.timezone || timezone,
      });

      updateEntries(entries.map((currentEntry) => (currentEntry._id === entry._id ? response.data : currentEntry)));
    } catch (error) {
      console.error("Failed to update task state", error);
      alert("Failed to update task.");
    }
  };

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const selectedEntries = entries
    .filter((entry) => isSameDay(getEntryDate(entry), selectedDate))
    .sort((left, right) => getSortWeight(left) - getSortWeight(right));
  const selectedTasks = selectedEntries.filter((entry) => entry.type === "task");
  const selectedEvents = selectedEntries.filter((entry) => entry.type === "event");
  const visibleEntries = activePlannerView === "events" ? selectedEvents : selectedTasks;
  const selectedTaskCount = selectedTasks.length;
  const selectedEventCount = selectedEvents.length;

  return (
    <div className="calendar-app">
      <div className="calendar">
        <h1 className="heading">Calendar</h1>

        <div className="navigate-date">
          <div className="dropdown-container" ref={monthDropdownRef}>
            <h2
              onClick={() => {
                setShowMonthDropdown((previous) => !previous);
                setShowYearDropdown(false);
              }}
            >
              {months[currentMonth]}
            </h2>
            {showMonthDropdown && (
              <div className="dropdown">
                {months.map((month, index) => (
                  <div
                    className="dropdown-item"
                    key={month}
                    onClick={() => {
                      setCurrentMonth(index);
                      setShowMonthDropdown(false);
                    }}
                  >
                    {month}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="dropdown-container" ref={yearDropdownRef}>
            <h2
              onClick={() => {
                setShowYearDropdown((previous) => !previous);
                setShowMonthDropdown(false);
              }}
            >
              {currentYear}
            </h2>
            {showYearDropdown && (
              <div className="dropdown">
                {[...Array(101)].map((_, index) => {
                  const year = today.getFullYear() - 50 + index;
                  return (
                    <div
                      className="dropdown-item"
                      key={year}
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
          {daysOfWeek.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>

        <div className="days">
          {[...Array(firstDay).keys()].map((blankDay) => (
            <span key={`empty-${blankDay}`} />
          ))}

          {[...Array(daysInMonth).keys()].map((dayIndex) => {
            const date = new Date(currentYear, currentMonth, dayIndex + 1);
            const isCurrent = isSameDay(date, today);
            const isSelected = isSameDay(date, selectedDate);
            const hasEntries = entries.some((entry) => isSameDay(getEntryDate(entry), date));

            return (
              <span
                key={dayIndex + 1}
                className={`day ${isCurrent ? "current-day" : ""} ${isSelected ? "selected-day" : ""} ${hasEntries ? "has-event" : ""}`}
                onClick={() => handleDayClick(dayIndex + 1)}
              >
                {dayIndex + 1}
              </span>
            );
          })}
        </div>
      </div>

      <aside className="events planner-panel">
        <div className="events-header planner-header">
          <div className="planner-pill-row">
            {/* <span className="planner-pill planner-pill-warm">This week</span> */}
            <span className="planner-pill planner-pill-cool">{months[currentMonth]}</span>
          </div>

          <div className="planner-heading-row">
            <div>
              <h2>Upcoming Tasks</h2>
              <p>
                {selectedDate.toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="planner-stats">
            <button
              type="button"
              className={`planner-stat-card ${activePlannerView === "tasks" ? "planner-stat-card-active" : ""}`}
              onClick={() => setActivePlannerView("tasks")}
            >
              <strong>{selectedTaskCount}</strong>
              <span>Tasks planned</span>
            </button>
            <button
              type="button"
              className={`planner-stat-card planner-stat-card-blue ${activePlannerView === "events" ? "planner-stat-card-active" : ""}`}
              onClick={() => setActivePlannerView("events")}
            >
              <strong>{selectedEventCount}</strong>
              <span>Events today</span>
            </button>
          </div>
        </div>

        <div className="planner-section-label">
          <span>{activePlannerView === "events" ? `${selectedEvents.length} events` : `${selectedTasks.length} tasks`}</span>
          <span>{activePlannerView === "events" ? "Events" : "Tasks"}</span>
        </div>

        {visibleEntries.length === 0 ? (
          <div className="no-events-placeholder">
            <p>{activePlannerView === "events" ? "No events for this day." : "No tasks for this day."}</p>
            <p>Use the + button to add a daily task or a calendar event.</p>
          </div>
        ) : (
          visibleEntries.map((entry) => (
            <div key={entry._id} className={`event planner-entry ${entry.done ? "done" : ""} ${entry.type === "task" ? "entry-task" : "entry-event"}`}>
              <div className="event-time">{formatEntryTime(entry)}</div>

              <div className="planner-entry-body">
                <div className="planner-entry-topline">
                  <span className={`entry-type-chip ${entry.type === "task" ? "task" : "event"}`}>
                    {entry.type === "task" ? "Task" : entry.calendarProvider || "Event"}
                  </span>
                  {entry.repeat && entry.type === "event" && entry.repeat !== "once" && (
                    <span className="entry-meta-chip">{entry.repeat}</span>
                  )}
                </div>

                <div className="event-text">{entry.title}</div>

                <div className="planner-entry-meta">
                  {entry.type === "event" && entry.location && <span>{entry.location}</span>}
                  {entry.type === "event" && entry.guests.length > 0 && <span>{entry.guests.length} guests</span>}
                  {entry.type === "event" && entry.reminder !== "none" && <span>Reminder {entry.reminder === "custom" ? `${entry.customReminderMinutes}m` : entry.reminder}</span>}
                  {entry.type === "task" && entry.description && <span>{entry.description}</span>}
                </div>
              </div>

              <div className="event-buttons planner-entry-actions">
                {entry.type === "task" && (
                  <button className="entry-action secondary" onClick={() => handleToggleTaskDone(entry)}>
                    {entry.done ? "Undo" : "Done"}
                  </button>
                )}
                <button className="entry-action secondary" onClick={() => handleEditEntry(entry)}>
                  Edit
                </button>
                <button className="entry-action danger" onClick={() => handleDeleteEntry(entry._id)}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}

        <div className="planner-quick-add" ref={quickAddRef}>
          {showQuickAddMenu && (
            <div className="planner-quick-add-menu">
              <button type="button" className="quick-add-option quick-add-task" onClick={() => openComposer("task")}>
                Add daily task
              </button>
              <button type="button" className="quick-add-option quick-add-event" onClick={() => openComposer("event")}>
                Add event
              </button>
            </div>
          )}
          <button
            type="button"
            className="planner-fab"
            aria-label="Add task or event"
            onClick={() => setShowQuickAddMenu((previous) => !previous)}
          >
            +
          </button>
        </div>
      </aside>

      {showComposer && (
        <div className="modal-backdrop" onMouseDown={closeComposer}>
          <div className="event-popup planner-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
            <div className="planner-modal-header">
              <div>
                <h3>{editingEntry ? `Edit ${composerMode}` : composerMode === "task" ? "Add daily task" : "Add event"}</h3>
                <p>
                  {composerMode === "task"
                    ? "Create a task for the selected day."
                    : "Create a Google-Calendar-style event with reminders and guests."}
                </p>
              </div>
            </div>

            <div className="planner-form-grid">
              <label className="planner-field planner-field-full">
                <span>{composerMode === "task" ? "Task name" : "Event name"}</span>
                <input
                  type="text"
                  value={draft.title}
                  onChange={(event) => handleDraftChange("title", event.target.value)}
                  placeholder={composerMode === "task" ? "Daily standup notes" : "Sprint planning"}
                />
              </label>

              {composerMode === "task" ? (
                <>
                  <label className="planner-field">
                    <span>Date</span>
                    <input
                      type="date"
                      value={draft.date}
                      onChange={(event) => handleDraftChange("date", event.target.value)}
                    />
                  </label>

                  <label className="planner-field">
                    <span>Time</span>
                    <input
                      type="time"
                      value={draft.time}
                      onChange={(event) => handleDraftChange("time", event.target.value)}
                    />
                  </label>

                  <label className="planner-field planner-field-full">
                    <span>Description</span>
                    <textarea
                      value={draft.description}
                      onChange={(event) => handleDraftChange("description", event.target.value)}
                      placeholder="Add notes for this task"
                    />
                  </label>
                </>
              ) : (
                <>
                  <label className="planner-field">
                    <span>Calendar</span>
                    <select
                      value={draft.calendarProvider}
                      onChange={(event) => handleDraftChange("calendarProvider", event.target.value)}
                    >
                      {calendarOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="planner-field planner-toggle-field">
                    <span>All day</span>
                    <button
                      type="button"
                      className={`toggle-chip ${draft.allDay ? "active" : ""}`}
                      onClick={() => handleDraftChange("allDay", !draft.allDay)}
                    >
                      {draft.allDay ? "Enabled" : "Disabled"}
                    </button>
                  </label>

                  {draft.allDay ? (
                    <label className="planner-field planner-field-full">
                      <span>Date</span>
                      <input
                        type="date"
                        value={draft.date}
                        onChange={(event) => handleDraftChange("date", event.target.value)}
                      />
                    </label>
                  ) : (
                    <>
                      <label className="planner-field">
                        <span>From</span>
                        <input
                          type="datetime-local"
                          value={draft.startDateTime}
                          onChange={(event) => handleDraftChange("startDateTime", event.target.value)}
                        />
                      </label>

                      <label className="planner-field">
                        <span>To</span>
                        <input
                          type="datetime-local"
                          value={draft.endDateTime}
                          onChange={(event) => handleDraftChange("endDateTime", event.target.value)}
                        />
                      </label>
                    </>
                  )}

                  <label className="planner-field">
                    <span>Repeat</span>
                    <select value={draft.repeat} onChange={(event) => handleDraftChange("repeat", event.target.value)}>
                      {repeatOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="planner-field">
                    <span>Reminder</span>
                    <select value={draft.reminder} onChange={(event) => handleDraftChange("reminder", event.target.value)}>
                      {reminderOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  {draft.repeat === "custom" && (
                    <label className="planner-field planner-field-full">
                      <span>Custom repeat rule</span>
                      <input
                        type="text"
                        value={draft.repeatCustom}
                        onChange={(event) => handleDraftChange("repeatCustom", event.target.value)}
                        placeholder="Every 2 weeks on Friday"
                      />
                    </label>
                  )}

                  {draft.reminder === "custom" && (
                    <label className="planner-field planner-field-full">
                      <span>Custom reminder in minutes</span>
                      <input
                        type="number"
                        min="1"
                        value={draft.customReminderMinutes}
                        onChange={(event) => handleDraftChange("customReminderMinutes", event.target.value)}
                        placeholder="45"
                      />
                    </label>
                  )}

                  <label className="planner-field planner-field-full">
                    <span>Guests</span>
                    <textarea
                      value={draft.guests}
                      onChange={(event) => handleDraftChange("guests", event.target.value)}
                      placeholder="alex@example.com, sam@example.com"
                    />
                  </label>

                  <label className="planner-field planner-field-full">
                    <span>Location</span>
                    <input
                      type="text"
                      value={draft.location}
                      onChange={(event) => handleDraftChange("location", event.target.value)}
                      placeholder="Conference room A"
                    />
                  </label>

                  <label className="planner-field planner-field-full">
                    <span>Description</span>
                    <textarea
                      value={draft.description}
                      onChange={(event) => handleDraftChange("description", event.target.value)}
                      placeholder="Agenda, notes, or links"
                    />
                  </label>
                </>
              )}
            </div>

            <div className="event-popup-actions planner-modal-actions">
              <button className="primary" onClick={handleSubmit}>
                {editingEntry ? "Save changes" : composerMode === "task" ? "Add task" : "Add event"}
              </button>
              <button className="secondary" onClick={closeComposer}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarApp;
