import { useCallback, useEffect, useState } from 'react';
import { createReservationRequest, getReservationsRequest } from '../api/reservationsApi';

export const useReservations = (token, canReadReservations) => {
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
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

  const createReservation = useCallback(
    async (payload) => {
      if (!token) {
        throw new Error('Musisz być zalogowany, aby utworzyć rezerwację');
      }

      setIsMutating(true);

      try {
        const createdReservation = await createReservationRequest(token, payload);
        setReservations((currentReservations) => [...currentReservations, createdReservation]);
        return createdReservation;
      } finally {
        setIsMutating(false);
      }
    },
    [token],
  );

  return {
    reservations,
    isLoading,
    isMutating,
    error,
    refreshReservations,
    createReservation,
  };
};
