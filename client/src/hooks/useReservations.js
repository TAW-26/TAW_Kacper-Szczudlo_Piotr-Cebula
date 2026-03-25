import { useCallback, useEffect, useState } from 'react';
import { getReservationsRequest } from '../api/reservationsApi';

export const useReservations = (token, canReadReservations) => {
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const refreshReservations = useCallback(async () => {
    if (!canReadReservations || !token) {
      setReservations([]);
      setError('');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await getReservationsRequest(token);
      setReservations(response);
    } catch (reservationsError) {
      setError(reservationsError.message);
    } finally {
      setIsLoading(false);
    }
  }, [canReadReservations, token]);

  useEffect(() => {
    refreshReservations();
  }, [refreshReservations]);

  return {
    reservations,
    isLoading,
    error,
    refreshReservations,
  };
};
