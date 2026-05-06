import axios from 'axios';
import { getBaseUrl } from './config';

const client = axios.create({
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor to set baseURL dynamically
client.interceptors.request.use(
  async (config) => {
    if (!config.baseURL) {
      config.baseURL = await getBaseUrl();
    }
    return config;
  },
  (error) => Promise.reject(error)
);

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message || 'حدث خطأ غير متوقع';
    return Promise.reject(new Error(message));
  }
);

export default client;
