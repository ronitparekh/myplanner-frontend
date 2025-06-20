import axios from "axios";

const API = axios.create({
  baseURL: "https://myplanner-backend.onrender.com/api",
});

// Add JWT to every request if exists
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

export default API;
