import { useMemo, useRef, useState } from 'react';

const STATUS_OPTIONS = [
  { value: 'available', label: 'Dostępny' },
  { value: 'occupied', label: 'Zajęty' },
  { value: 'reserved', label: 'Rezerwacja' },
];

const statusToClass = {
  available: 'table-card available',
  occupied: 'table-card occupied',
  reserved: 'table-card reserved',
};

const statusToTokenClass = {
  available: 'room-token available',
  occupied: 'room-token occupied',
  reserved: 'room-token reserved',
};

const ROOM_TOKEN_NODE_WIDTH = 110;
const ROOM_TOKEN_NODE_HEIGHT = 90;
const MAX_VISIBLE_CHAIRS = 12;

const toTimeMinutes = (timeValue) => {
  if (typeof timeValue !== 'string') {
    return Number.MAX_SAFE_INTEGER;
  }

  const [rawHours, rawMinutes] = timeValue.split(':');
  const hours = Number(rawHours);
  const minutes = Number(rawMinutes);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    return Number.MAX_SAFE_INTEGER;
  }

  return hours * 60 + minutes;
};

const getSortedTables = (tables, layoutOrder) => {
  if (!tables.length) {
    return [];
  }

  const positionById = new Map(layoutOrder.map((id, index) => [id, index]));

  return [...tables].sort((a, b) => {
    const aPosition = positionById.has(a._id) ? positionById.get(a._id) : Number.MAX_SAFE_INTEGER;
    const bPosition = positionById.has(b._id) ? positionById.get(b._id) : Number.MAX_SAFE_INTEGER;

    if (aPosition === bPosition) {
      return a.tableNumber - b.tableNumber;
    }

    return aPosition - bPosition;
  });
};

const getChairsForCapacity = (capacity) => {
  const normalizedCapacity = Math.max(1, Math.min(Number(capacity) || 1, MAX_VISIBLE_CHAIRS));

  return Array.from({ length: normalizedCapacity }, (_, index) => {
    const angle = (2 * Math.PI * index) / normalizedCapacity - Math.PI / 2;

    return {
      key: `chair-${index}`,
      x: 55 + Math.cos(angle) * 42,
      y: 45 + Math.sin(angle) * 32,
    };
  });
};

export const TableBoard = ({
  tables,
  layoutOrder,
  layoutPositions,
  reservations,
  canReadReservations,
  canCreateReservations,
  isReservationsLoading,
  isReservationsMutating,
  waiterAssignments,
  isBusy,
  isLayoutEditable,
  canAssignWaiter,
  canUpdateTableStatus,
  onMoveTable,
  onAssignWaiter,
  onUpdateTableStatus,
  onCreateReservation,
}) => {
  const roomBoardRef = useRef(null);
  const [draggedTableId, setDraggedTableId] = useState('');
  const [dragOffset, setDragOffset] = useState({ x: 34, y: 24 });
  const [draftAssignments, setDraftAssignments] = useState({});
  const [newReservationForm, setNewReservationForm] = useState({
    tableId: '',
    reservationDate: '',
    startTime: '',
    endTime: '',
    numberOfGuests: '',
  });

  const sortedTables = useMemo(() => getSortedTables(tables, layoutOrder), [tables, layoutOrder]);
  const selectedReservationTable = useMemo(
    () => tables.find((table) => table._id === newReservationForm.tableId) ?? null,
    [tables, newReservationForm.tableId],
  );
  const maxGuestsLimit = Number(selectedReservationTable?.capacity) || 0;

  const reservationsByTableId = useMemo(() => {
    const reservationsByTable = reservations.reduce((acc, reservation) => {
      const reservationTableId =
        typeof reservation.tableId === 'string' ? reservation.tableId : reservation.tableId?._id;

      if (!reservationTableId) {
        return acc;
      }

      if (!acc[reservationTableId]) {
        acc[reservationTableId] = [];
      }

      acc[reservationTableId].push(reservation);
      return acc;
    }, {});

    Object.keys(reservationsByTable).forEach((tableId) => {
      reservationsByTable[tableId].sort((a, b) => {
        const dateA = new Date(a.reservationDate);
        const dateB = new Date(b.reservationDate);
        const dateDiff = dateA - dateB;

        if (!Number.isNaN(dateDiff) && dateDiff !== 0) {
          return dateDiff;
        }

        return toTimeMinutes(a.startTime) - toTimeMinutes(b.startTime);
      });
    });

    return reservationsByTable;
  }, [reservations]);

  const handleBoardDrop = (event) => {
    event.preventDefault();

    if (!isLayoutEditable || !draggedTableId || !roomBoardRef.current) {
      return;
    }

    const boardRect = roomBoardRef.current.getBoundingClientRect();
    const nextX = event.clientX - boardRect.left - dragOffset.x;
    const nextY = event.clientY - boardRect.top - dragOffset.y;

    const clampedX = Math.max(0, Math.min(nextX, Math.max(0, boardRect.width - ROOM_TOKEN_NODE_WIDTH)));
    const clampedY = Math.max(0, Math.min(nextY, Math.max(0, boardRect.height - ROOM_TOKEN_NODE_HEIGHT)));

    onMoveTable((currentPositions) => ({
      ...currentPositions,
      [draggedTableId]: { x: Math.round(clampedX), y: Math.round(clampedY) },
    }));

    setDraggedTableId('');
  };

  const handleCreateReservation = async (event) => {
    event.preventDefault();

    await onCreateReservation({
      tableId: newReservationForm.tableId,
      reservationDate: newReservationForm.reservationDate,
      startTime: newReservationForm.startTime,
      endTime: newReservationForm.endTime,
      numberOfGuests: Number(newReservationForm.numberOfGuests),
    });

    setNewReservationForm({
      tableId: '',
      reservationDate: '',
      startTime: '',
      endTime: '',
      numberOfGuests: '',
    });
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Plan sali</h2>
      </div>

      <div className="room-board-widget">
        <p className="muted small">
          {isLayoutEditable
            ? 'Przeciągaj stoliki po planszy i upuszczaj w dowolnym miejscu.'
            : 'Podgląd układu sali (edycja dostępna tylko dla administratora).'}
        </p>
        <div
          ref={roomBoardRef}
          className="room-board"
          onDragOver={(event) => {
            if (isLayoutEditable) {
              event.preventDefault();
            }
          }}
          onDrop={handleBoardDrop}
        >
          {sortedTables.map((table) => {
            const tablePosition = layoutPositions[table._id] ?? { x: 0, y: 0 };
            const chairs = getChairsForCapacity(table.capacity);

            return (
              <div
                key={`board-${table._id}`}
                draggable={isLayoutEditable}
                className={`room-token-node${isLayoutEditable ? '' : ' locked'}`}
                style={{ left: `${tablePosition.x}px`, top: `${tablePosition.y}px` }}
                onDragStart={(event) => {
                  if (!isLayoutEditable) {
                    event.preventDefault();
                    return;
                  }

                  const elementRect = event.currentTarget.getBoundingClientRect();
                  setDragOffset({
                    x: event.clientX - elementRect.left,
                    y: event.clientY - elementRect.top,
                  });
                  setDraggedTableId(table._id);
                }}
                onDragEnd={() => setDraggedTableId('')}
                aria-label={`Przesuń stolik numer ${table.tableNumber}`}
              >
                {chairs.map((chair) => (
                  <span
                    key={chair.key}
                    className="room-chair"
                    style={{ left: `${chair.x}px`, top: `${chair.y}px` }}
                    aria-hidden="true"
                  />
                ))}
                <div className={statusToTokenClass[table.status] ?? 'room-token'}>
                  <span className="room-token-id">#{table.tableNumber}</span>
                  <span className="room-token-capacity">{table.capacity} os.</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {canCreateReservations ? (
        <form className="inline-form" onSubmit={handleCreateReservation}>
          <select
            value={newReservationForm.tableId}
            onChange={(event) =>
              setNewReservationForm((prev) => ({ ...prev, tableId: event.target.value }))
            }
            required
          >
            <option value="">Wybierz stolik</option>
            {sortedTables.map((table) => (
              <option key={table._id} value={table._id}>
                Stolik #{table.tableNumber} (max {table.capacity} os.)
              </option>
            ))}
          </select>
          <input
            type="date"
            value={newReservationForm.reservationDate}
            onChange={(event) =>
              setNewReservationForm((prev) => ({ ...prev, reservationDate: event.target.value }))
            }
            required
          />
          <input
            type="time"
            value={newReservationForm.startTime}
            onChange={(event) => setNewReservationForm((prev) => ({ ...prev, startTime: event.target.value }))}
            required
          />
          <input
            type="time"
            value={newReservationForm.endTime}
            onChange={(event) => setNewReservationForm((prev) => ({ ...prev, endTime: event.target.value }))}
            required
          />
          <input
            type="number"
            min={1}
            max={maxGuestsLimit || undefined}
            placeholder={maxGuestsLimit ? `Maks. ilość gości: ${maxGuestsLimit}` : 'Liczba gości'}
            value={newReservationForm.numberOfGuests}
            onChange={(event) =>
              setNewReservationForm((prev) => ({ ...prev, numberOfGuests: event.target.value }))
            }
            required
          />
          <button type="submit" disabled={isReservationsMutating}>
            {isReservationsMutating ? 'Zapisywanie...' : 'Dodaj rezerwację'}
          </button>
        </form>
      ) : null}

      <div className="table-grid">
        {sortedTables.map((table) => {
          const waiterValue = draftAssignments[table._id] ?? waiterAssignments[table._id] ?? '';
          const tableReservations = reservationsByTableId[table._id] ?? [];

          return (
            <article
              key={table._id}
              className={statusToClass[table.status] ?? 'table-card'}
            >
              <h3>Stolik #{table.tableNumber}</h3>
              <p>Pojemność: {table.capacity} os.</p>

              <label>
                Kelner
                <input
                  type="text"
                  placeholder="np. Jan Kowalski"
                  value={waiterValue}
                  onChange={(event) =>
                    setDraftAssignments((prev) => ({ ...prev, [table._id]: event.target.value }))
                  }
                  disabled={!canAssignWaiter || isBusy}
                />
              </label>

              <button
                type="button"
                onClick={() => {
                  onAssignWaiter(table._id, waiterValue);
                  setDraftAssignments((prev) => ({ ...prev, [table._id]: waiterValue }));
                }}
                disabled={!canAssignWaiter || isBusy}
              >
                Zapisz kelnera
              </button>

              <label>
                Status stolika
                <select
                  value={table.status}
                  onChange={(event) => onUpdateTableStatus(table._id, event.target.value)}
                  disabled={!canUpdateTableStatus || isBusy}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              {!canUpdateTableStatus ? (
                <p className="muted small">Zmiana statusu wymaga roli admin.</p>
              ) : null}

              <div>
                <p className="muted small">Rezerwacje stolika</p>
                {!canReadReservations ? <p className="muted small">Widoczne dla ról: waiter/admin.</p> : null}
                {canReadReservations && isReservationsLoading ? <p className="muted small">Wczytywanie...</p> : null}
                {canReadReservations && !isReservationsLoading && !tableReservations.length ? (
                  <p className="muted small">Brak rezerwacji.</p>
                ) : null}
                {canReadReservations && tableReservations.length ? (
                  <ul className="list-clean">
                    {tableReservations.map((reservation) => (
                      <li key={reservation._id} className="small muted">
                        {reservation.startTime}-{reservation.endTime}, {reservation.numberOfGuests} os., {reservation.status}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
