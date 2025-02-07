
const API_BASE_URL = window.location.hostname === "localhost"
  ? "http://localhost:4000"
  : "https://diariodeviajes.onrender.com";
window.API_BASE_URL = API_BASE_URL;
console.log("API_BASE_URL:", API_BASE_URL);
