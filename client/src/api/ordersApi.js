import { httpClient, buildAuthHeaders, getApiErrorMessage } from './httpClient';

export const createOrderRequest = async (token, payload) => {
  try {
    const response = await httpClient.post('/orders', payload, {
      headers: buildAuthHeaders(token),
    });
    return response.data.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Nie udało się utworzyć zamówienia'));
  }
};

export const getOrdersRequest = async (token) => {
  try {
    const response = await httpClient.get('/orders', {
      headers: buildAuthHeaders(token),
    });
    return response.data.orders ?? [];
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Nie udało się pobrać zamówień'));
  }
};

export const updateOrderStatusRequest = async (token, orderId, status) => {
  try {
    const response = await httpClient.put(
      `/orders/${orderId}/status`,
      { status },
      {
        headers: buildAuthHeaders(token),
      },
    );
    return response.data.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Nie udało się zaktualizować statusu zamówienia'));
  }
};
