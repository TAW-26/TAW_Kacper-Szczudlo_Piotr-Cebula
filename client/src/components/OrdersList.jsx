import { useMemo, useState } from 'react';

const ORDER_STATUS_OPTIONS = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];
const FINAL_STATUSES = new Set(['completed', 'cancelled']);

const formatDate = (dateString) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleString('pl-PL');
};

export const OrdersList = ({
  orders,
  tables,
  orderTableMap,
  ticketOrderMap,
  tableAssignments,
  canReadOrders,
  canUpdateStatus,
  isLoading,
  isMutating,
  onUpdateTicketStatus,
}) => {
  const [selectedWaiter, setSelectedWaiter] = useState('all');
  const tableById = new Map(tables.map((table) => [table._id, table]));

  const tickets = useMemo(() => {
    const ticketById = new Map();

    orders.forEach((order) => {
      const ticketId = ticketOrderMap[order._id] ?? order._id;
      const tableId = orderTableMap[order._id];

      if (!ticketById.has(ticketId)) {
        ticketById.set(ticketId, {
          ticketId,
          tableId,
          orders: [],
          totalPrice: 0,
          latestStatus: order.status,
          latestCreatedAt: order.createdAt,
        });
      }

      const ticket = ticketById.get(ticketId);
      ticket.orders.push(order);
      ticket.totalPrice += Number(order.totalPrice || 0);

      const currentDate = new Date(ticket.latestCreatedAt);
      const orderDate = new Date(order.createdAt);

      if (Number.isNaN(currentDate.getTime()) || (!Number.isNaN(orderDate.getTime()) && orderDate >= currentDate)) {
        ticket.latestStatus = order.status;
        ticket.latestCreatedAt = order.createdAt;
      }
    });

    return Array.from(ticketById.values())
      .map((ticket) => ({
        ...ticket,
        orderIds: ticket.orders.map((order) => order._id),
        isOpen: !FINAL_STATUSES.has(ticket.latestStatus),
      }))
      .sort((a, b) => new Date(b.latestCreatedAt) - new Date(a.latestCreatedAt));
  }, [orders, orderTableMap, ticketOrderMap]);

  const waiterOptions = useMemo(() => {
    const waiters = Object.values(tableAssignments)
      .map((name) => name.trim())
      .filter(Boolean);

    return ['all', ...Array.from(new Set(waiters)).sort((a, b) => a.localeCompare(b, 'pl'))];
  }, [tableAssignments]);

  const filteredTickets = useMemo(() => {
    if (selectedWaiter === 'all') {
      return tickets;
    }

    return tickets.filter((ticket) => {
      const waiterName = tableAssignments[ticket.tableId]?.trim();
      return waiterName === selectedWaiter;
    });
  }, [selectedWaiter, tableAssignments, tickets]);

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Otwarte tickety i zamówienia</h2>
      </div>

      {!canReadOrders ? (
        <p className="muted">Podgląd wszystkich zamówień dostępny dla ról: waiter/admin.</p>
      ) : null}

      <div className="row-filters">
        <label>
          Filtr kelnera
          <select value={selectedWaiter} onChange={(event) => setSelectedWaiter(event.target.value)}>
            {waiterOptions.map((waiter) => (
              <option key={waiter} value={waiter}>
                {waiter === 'all' ? 'Wszyscy kelnerzy' : waiter}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isLoading ? <p>Wczytywanie zamówień...</p> : null}

      {!isLoading && canReadOrders && !filteredTickets.length ? <p className="muted">Brak zamówień.</p> : null}

      <ul className="list-clean orders-list">
        {filteredTickets.map((ticket) => {
          const table = tableById.get(ticket.tableId);
          const waiter = tableAssignments[ticket.tableId]?.trim() || 'brak przypisania';

          return (
            <li key={ticket.ticketId}>
              <div>
                <p className="title">Ticket {ticket.ticketId.slice(-6).toUpperCase()}</p>
                <p className="muted">
                  Stolik: {table ? `#${table.tableNumber}` : 'nieprzypisany (brak relacji w backendzie)'}
                </p>
                <p className="muted">Ostatnia aktywność: {formatDate(ticket.latestCreatedAt)}</p>
                <p className="muted">Pozycji zamówień: {ticket.orders.length}</p>
                <p className="muted">Suma ticketu: {Number(ticket.totalPrice).toFixed(2)} zł</p>
                <p className="muted">Kelner: {waiter}</p>
                <p className="muted">Stan ticketu: {ticket.isOpen ? 'otwarty' : 'zamknięty'}</p>
              </div>

              <label>
                Status
                <select
                  value={ticket.latestStatus}
                  onChange={(event) => onUpdateTicketStatus(ticket.orderIds, event.target.value)}
                  disabled={!canUpdateStatus || isMutating}
                >
                  {ORDER_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
