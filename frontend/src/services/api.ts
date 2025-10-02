import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
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
    } catch {}
    return Promise.reject(enhanced);
  }
);




