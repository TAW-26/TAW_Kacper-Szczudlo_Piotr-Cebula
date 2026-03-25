import { httpClient, buildAuthHeaders, getApiErrorMessage } from './httpClient';

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
