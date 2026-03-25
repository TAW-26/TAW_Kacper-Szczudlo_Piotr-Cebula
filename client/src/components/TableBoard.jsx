import { useMemo, useState } from 'react';

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

export const TableBoard = ({
  tables,
  layoutOrder,
  reservations,
  canReadReservations,
  isReservationsLoading,
  waiterAssignments,
  role,
  isBusy,
  onReorder,
  onAssignWaiter,
  onUpdateTableStatus,
  onCreateTable,
}) => {
  const [draggedTableId, setDraggedTableId] = useState('');
  const [draftAssignments, setDraftAssignments] = useState({});
  const [newTableForm, setNewTableForm] = useState({ tableNumber: '', capacity: '' });

  const sortedTables = useMemo(() => getSortedTables(tables, layoutOrder), [tables, layoutOrder]);

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

  const handleDrop = (targetTableId) => {
    if (!draggedTableId || draggedTableId === targetTableId) {
      return;
    }

    const currentOrder = sortedTables.map((table) => table._id);
    const sourceIndex = currentOrder.indexOf(draggedTableId);
    const targetIndex = currentOrder.indexOf(targetTableId);

    if (sourceIndex < 0 || targetIndex < 0) {
      return;
    }

    const nextOrder = [...currentOrder];
    const [movedItem] = nextOrder.splice(sourceIndex, 1);
    nextOrder.splice(targetIndex, 0, movedItem);

    onReorder(nextOrder);
  };

  const handleCreateTable = async (event) => {
    event.preventDefault();

    await onCreateTable({
      tableNumber: Number(newTableForm.tableNumber),
      capacity: Number(newTableForm.capacity),
    });

    setNewTableForm({ tableNumber: '', capacity: '' });
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Plan sali (przeciągnij i upuść)</h2>
      </div>

      {role === 'admin' ? (
        <form className="inline-form" onSubmit={handleCreateTable}>
          <input
            type="number"
            min={1}
            placeholder="Numer stolika"
            value={newTableForm.tableNumber}
            onChange={(event) =>
              setNewTableForm((prev) => ({ ...prev, tableNumber: event.target.value }))
            }
            required
          />
          <input
            type="number"
            min={1}
            placeholder="Pojemność"
            value={newTableForm.capacity}
            onChange={(event) => setNewTableForm((prev) => ({ ...prev, capacity: event.target.value }))}
            required
          />
          <button type="submit" disabled={isBusy}>
            Dodaj stolik
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
              draggable
              onDragStart={() => setDraggedTableId(table._id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleDrop(table._id)}
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
                />
              </label>

              <button
                type="button"
                onClick={() => {
                  onAssignWaiter(table._id, waiterValue);
                  setDraftAssignments((prev) => ({ ...prev, [table._id]: waiterValue }));
                }}
              >
                Zapisz kelnera
              </button>

              <label>
                Status stolika
                <select
                  value={table.status}
                  onChange={(event) => onUpdateTableStatus(table._id, event.target.value)}
                  disabled={role !== 'admin' || isBusy}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              {role !== 'admin' ? (
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
