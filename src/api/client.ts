import axios from 'axios';
import { BASE_URL } from './config';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message || 'حدث خطأ غير متوقع';
    return Promise.reject(new Error(message));
  }
);

export default client;
