import axios, { InternalAxiosRequestConfig } from 'axios';
import { refreshAccessToken } from './authService';
import { toast } from 'react-toastify';

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `jwt ${token}`;
  }

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const accessToken = await refreshAccessToken(refreshToken);

          localStorage.setItem('accessToken', accessToken);
          return axiosInstance(originalRequest);
        } catch (error: any) {
          console.error(error);
          if (error.response?.status === 403) {
            toast.error('Session expired, Please log in again');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
          }
        }
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
