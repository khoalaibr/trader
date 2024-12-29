// src/services/api.js
import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL; // lee del .env

const api = axios.create({
  baseURL, // establece la URL base para todas las peticiones
});

export default api;
