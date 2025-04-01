// Configuration for API endpoints
const isDevelopment = process.env.NODE_ENV === 'development';

// For local development
const localBackendUrl = 'http://localhost:3001';
const localFastApiUrl = 'http://localhost:8000';

// For production (Google Cloud)
// These will be the URLs where your services are deployed
const productionBackendUrl = 'https://mern-app-backend-477609894648.asia-south2.run.app';
const productionFastApiUrl = 'https://mern-app-fastapi-477609894648.us-central1.run.app';

// Export the URLs based on environment
export const BACKEND_URL = isDevelopment ? localBackendUrl : productionBackendUrl;
export const FASTAPI_URL = isDevelopment ? localFastApiUrl : productionFastApiUrl;