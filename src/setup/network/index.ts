import axios, { AxiosInstance } from 'axios';

const Service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {},
});

// Service.interceptors.request.use(
//   (config: any) => {
//     const token = window.localStorage.getItem('accessToken');
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error: AxiosError) => {
//     return Promise.reject(error);
//   }
// );

export default Service;
