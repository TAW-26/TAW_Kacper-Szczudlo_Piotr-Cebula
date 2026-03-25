import { httpClient, buildAuthHeaders, getApiErrorMessage } from './httpClient';

export const createReservationRequest = async (token, payload) => {
  try {
    const response = await httpClient.post('/reservations', payload, {
      headers: buildAuthHeaders(token),
    });
    return response.data.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Nie udało się utworzyć rezerwacji'));
  }
};

export const getReservationsRequest = async (token) => {
  try {
    const response = await httpClient.get('/reservations', {
      headers: buildAuthHeaders(token),
    });
    return response.data.reservations ?? [];
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Nie udało się pobrać rezerwacji'));
  }
};
