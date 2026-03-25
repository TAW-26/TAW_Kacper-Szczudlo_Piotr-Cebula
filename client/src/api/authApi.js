import { httpClient, getApiErrorMessage } from './httpClient';

export const loginRequest = async (credentials) => {
  try {
    const response = await httpClient.post('/auth/login', credentials);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Nie udało się zalogować'));
  }
};

export const registerRequest = async (payload) => {
  try {
    const response = await httpClient.post('/auth/register', payload);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Nie udało się zarejestrować użytkownika'));
  }
};
