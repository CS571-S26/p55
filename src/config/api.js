// API Configuration
// Switches between localhost for development and Railway for production

const API_BASE_URL = 
  import.meta.env.MODE === 'production' 
    ? import.meta.env.VITE_API_URL || 'https://tripgenie-backend-production.up.railway.app'
    : 'http://localhost:5001';

console.log(`🌍 Environment: ${import.meta.env.MODE}`);
console.log(`📍 API URL: ${API_BASE_URL}`);

export default API_BASE_URL;