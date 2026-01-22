import axios from "axios";

const defaultBaseURL = import.meta.env.DEV
  ? "/api"
  : "https://myplanner-backend.onrender.com/api";

const baseURL = import.meta.env.VITE_API_URL || defaultBaseURL;

const API = axios.create({
  baseURL,
  timeout: 20000,
});

// Add JWT to every request if exists
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

export default API;
