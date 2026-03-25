import { httpClient, buildAuthHeaders, getApiErrorMessage } from './httpClient';

export const getTablesRequest = async () => {
  try {
    const response = await httpClient.get('/tables');
    return response.data.tables ?? [];
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Nie udało się pobrać stolików'));
  }
};

export const updateTableRequest = async (token, tableId, payload) => {
  try {
    const response = await httpClient.put(`/tables/${tableId}`, payload, {
      headers: buildAuthHeaders(token),
    });
    return response.data.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Nie udało się zaktualizować stolika'));
  }
};

export const createTableRequest = async (token, payload) => {
  try {
    const response = await httpClient.post('/tables', payload, {
      headers: buildAuthHeaders(token),
    });
    return response.data.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Nie udało się utworzyć stolika'));
  }
};
