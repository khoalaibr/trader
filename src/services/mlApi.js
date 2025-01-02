// src/services/mlApi.js
import axios from 'axios';

const mlApi = axios.create({
  baseURL: import.meta.env.VITE_API_SERVICE, // "https://ml-service-trading-c8ed6e84414d.herokuapp.com"
});

export default mlApi;
