import { useMemo } from 'react';

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleDateString('pl-PL');
};

const formatTime = (timeValue) => {
  if (!timeValue || typeof timeValue !== 'string') {
    return '-';
  }

  return timeValue;
};

export const ReservationsList = ({ reservations, canReadReservations, isLoading }) => {
  const sortedReservations = useMemo(() => {
    return [...reservations].sort((a, b) => {
      const aDate = new Date(a.reservationDate);
      const bDate = new Date(b.reservationDate);
      return aDate - bDate;
    });
  }, [reservations]);

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Rezerwacje</h2>
      </div>

      {!canReadReservations ? <p className="muted">Podgląd rezerwacji dostępny dla ról: waiter/admin.</p> : null}
      {isLoading ? <p>Wczytywanie rezerwacji...</p> : null}

      {canReadReservations && !isLoading && !sortedReservations.length ? (
        <p className="muted">Brak rezerwacji.</p>
      ) : null}

      {canReadReservations && sortedReservations.length ? (
        <ul className="list-clean orders-list">
          {sortedReservations.map((reservation) => (
            <li key={reservation._id}>
              <div>
                <p className="title">Rezerwacja #{reservation._id.slice(-6).toUpperCase()}</p>
                <p className="muted">Data: {formatDate(reservation.reservationDate)}</p>
                <p className="muted">
                  Godzina: {formatTime(reservation.startTime)} - {formatTime(reservation.endTime)}
                </p>
                <p className="muted">Goście: {reservation.numberOfGuests}</p>
                <p className="muted">
                  Stolik: {reservation.tableId?.tableNumber ? `#${reservation.tableId.tableNumber}` : '-'}
                </p>
              </div>
              <p className="muted">Status: {reservation.status}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
};
