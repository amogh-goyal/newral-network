// Configuration for API endpoints
const isDevelopment = import.meta.env.MODE === 'development' || import.meta.env.DEV;

// For local development
const localBackendUrl = 'http://localhost:3001';
const localFastApiUrl = 'http://localhost:8000';

// For production (Google Cloud)
// These will be the URLs where your services are deployed
const productionBackendUrl = 'https://mern-app-backend-477609894648.asia-south2.run.app';
const productionFastApiUrl = 'https://mern-app-fastapi-477609894648.us-central1.run.app';

// Log the environment for debugging
console.log('Environment mode:', import.meta.env.MODE);
console.log('Is development environment:', isDevelopment);

// Export the URLs based on environment
export const BACKEND_URL = isDevelopment ? localBackendUrl : productionBackendUrl;
export const FASTAPI_URL = isDevelopment ? localFastApiUrl : productionFastApiUrl;

// Log the selected URLs
console.log('Using BACKEND_URL:', BACKEND_URL);
console.log('Using FASTAPI_URL:', FASTAPI_URL);
