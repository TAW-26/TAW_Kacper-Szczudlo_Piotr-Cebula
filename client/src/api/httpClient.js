import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const buildAuthHeaders = (token) =>
  token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};

export const getApiErrorMessage = (error, fallbackMessage) => {
  if (error.response?.data?.error) {
    return error.response.data.error;
  }

  if (error.message) {
    return error.message;
  }

  return fallbackMessage;
};
