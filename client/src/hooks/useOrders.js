import { useCallback, useEffect, useState } from 'react';
import { createOrderRequest, getOrdersRequest, updateOrderStatusRequest } from '../api/ordersApi';

export const useOrders = (token, canReadOrders) => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState('');

  const refreshOrders = useCallback(async () => {
    if (!canReadOrders || !token) {
      setOrders([]);
      setError('');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await getOrdersRequest(token);
      setOrders(response);
    } catch (ordersError) {
      setError(ordersError.message);
    } finally {
      setIsLoading(false);
    }
  }, [canReadOrders, token]);

  useEffect(() => {
    refreshOrders();
  }, [refreshOrders]);

  const createOrder = useCallback(
    async (payload) => {
      if (!token) {
        throw new Error('Musisz być zalogowany, aby utworzyć zamówienie');
      }

      setIsMutating(true);

      try {
        const createdOrder = await createOrderRequest(token, payload);
        setOrders((currentOrders) => [createdOrder, ...currentOrders]);
        return createdOrder;
      } finally {
        setIsMutating(false);
      }
    },
    [token],
  );

  const updateOrderStatus = useCallback(
    async (orderId, status) => {
      if (!token) {
        throw new Error('Musisz być zalogowany, aby zaktualizować status zamówienia');
      }

      setIsMutating(true);

      try {
        const updatedOrder = await updateOrderStatusRequest(token, orderId, status);
        setOrders((currentOrders) =>
          currentOrders.map((order) => (order._id === orderId ? { ...order, ...updatedOrder } : order)),
        );
      } finally {
        setIsMutating(false);
      }
    },
    [token],
  );

  return {
    orders,
    isLoading,
    isMutating,
    error,
    refreshOrders,
    createOrder,
    updateOrderStatus,
  };
};
