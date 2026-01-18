/// <reference types="vite/client" />
import axios from 'axios';

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || (isLocal ? '/api' : 'https://threft.pythonanywhere.com/api'),
  timeout: 10000,
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err?.response?.data?.error || err.message || 'Request failed';
    const enhanced = Object.assign(new Error(message), {
      status: err?.response?.status,
      data: err?.response?.data,
    });
    try {
      // @ts-ignore
      window.dispatchEvent(new CustomEvent('app:error', { detail: { message } }));
    } catch { }
    return Promise.reject(enhanced);
  }
);




