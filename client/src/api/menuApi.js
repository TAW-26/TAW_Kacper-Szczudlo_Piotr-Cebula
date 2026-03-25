import { httpClient, buildAuthHeaders, getApiErrorMessage } from './httpClient';

export const getMenuItemsRequest = async () => {
  try {
    const response = await httpClient.get('/menu');
    return response.data.items ?? [];
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Nie udało się pobrać menu'));
  }
};

export const createMenuItemRequest = async (token, payload) => {
  try {
    const response = await httpClient.post('/menu', payload, {
      headers: buildAuthHeaders(token),
    });
    return response.data.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Nie udało się utworzyć pozycji menu'));
  }
};

export const updateMenuItemRequest = async (token, itemId, payload) => {
  try {
    const response = await httpClient.put(`/menu/${itemId}`, payload, {
      headers: buildAuthHeaders(token),
    });
    return response.data.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Nie udało się zaktualizować pozycji menu'));
  }
};

export const deleteMenuItemRequest = async (token, itemId) => {
  try {
    const response = await httpClient.delete(`/menu/${itemId}`, {
      headers: buildAuthHeaders(token),
    });
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Nie udało się usunąć pozycji menu'));
  }
};
