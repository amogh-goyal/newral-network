// Configuration for API endpoints
const isDevelopment = process.env.NODE_ENV === 'development';

// For local development
const localBackendUrl = 'http://localhost:3001';
const localFastApiUrl = 'http://localhost:8000';

// For production (Google Cloud)
// These will be the URLs where your services are deployed
const productionBackendUrl = '/api'; // Use relative path for same-origin or specify full URL if different domain
const productionFastApiUrl = '/fastapi'; // Use relative path for same-origin or specify full URL if different domain

// Export the URLs based on environment
export const BACKEND_URL = isDevelopment ? localBackendUrl : productionBackendUrl;
export const FASTAPI_URL = isDevelopment ? localFastApiUrl : productionFastApiUrl;
