import { useEffect, useMemo, useState } from 'react';
import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import { AuthPanel } from './components/AuthPanel';
import { MenuCatalog } from './components/MenuCatalog';
import { MenuManager } from './components/MenuManager';
import { OrderBuilder } from './components/OrderBuilder';
import { OrdersList } from './components/OrdersList';
import { TableBoard } from './components/TableBoard';
import { TopBar } from './components/TopBar';
import { useAuth } from './hooks/useAuth';
import { useMenu } from './hooks/useMenu';
import { useMenuManager } from './hooks/useMenuManager';
import { useOrders } from './hooks/useOrders';
import { useReservations } from './hooks/useReservations';
import { useTables } from './hooks/useTables';
import {
  loadJson,
  ORDER_TICKET_MAP_KEY,
  ORDER_TABLE_MAP_KEY,
  saveJson,
  TABLE_ASSIGNMENTS_KEY,
  TABLE_LAYOUT_KEY,
  TABLE_LAYOUT_POSITIONS_KEY,
  TABLE_OPEN_TICKET_KEY,
} from './utils/storage';

const CLOSED_ORDER_STATUSES = new Set(['completed', 'cancelled']);
const TABLE_BOARD_COLUMNS = 6;
const TABLE_BOARD_X_STEP = 120;
const TABLE_BOARD_Y_STEP = 96;
const TABLE_BOARD_PADDING = 20;

const synchronizeLayout = (layoutOrder, tables) => {
  const existingTableIds = new Set(tables.map((table) => table._id));

  const cleanedOrder = layoutOrder.filter((tableId) => existingTableIds.has(tableId));
  const missingTables = tables
    .map((table) => table._id)
    .filter((tableId) => !cleanedOrder.includes(tableId));

  return [...cleanedOrder, ...missingTables];
};

const getDefaultTablePosition = (index) => ({
  x: TABLE_BOARD_PADDING + (index % TABLE_BOARD_COLUMNS) * TABLE_BOARD_X_STEP,
  y: TABLE_BOARD_PADDING + Math.floor(index / TABLE_BOARD_COLUMNS) * TABLE_BOARD_Y_STEP,
});

const synchronizeLayoutPositions = (layoutPositions, tables) => {
  return tables.reduce((acc, table, index) => {
    const position = layoutPositions?.[table._id];

    if (position && Number.isFinite(position.x) && Number.isFinite(position.y)) {
      acc[table._id] = {
        x: Math.max(0, Number(position.x)),
        y: Math.max(0, Number(position.y)),
      };
      return acc;
    }

    acc[table._id] = getDefaultTablePosition(index);
    return acc;
  }, {});
};

const isAuthorizationError = (message) =>
  typeof message === 'string' &&
  (message.includes('Nieprawidłowy token autoryzacyjny') || message.includes('Brak tokenu autoryzacyjnego'));

function App() {
  const [notice, setNotice] = useState({ type: '', message: '' });
  const [tableAssignments, setTableAssignments] = useState(() => loadJson(TABLE_ASSIGNMENTS_KEY, {}));
  const [tableLayoutOrder] = useState(() => loadJson(TABLE_LAYOUT_KEY, []));
  const [tableLayoutPositions, setTableLayoutPositions] = useState(() => loadJson(TABLE_LAYOUT_POSITIONS_KEY, {}));
  const [orderTableMap, setOrderTableMap] = useState(() => loadJson(ORDER_TABLE_MAP_KEY, {}));
  const [orderTicketMap, setOrderTicketMap] = useState(() => loadJson(ORDER_TICKET_MAP_KEY, {}));
  const [tableOpenTicketMap, setTableOpenTicketMap] = useState(() => loadJson(TABLE_OPEN_TICKET_KEY, {}));

  const { token, role, isAuthenticated, isLoading: isAuthLoading, error: authError, login, logout, register } =
    useAuth();

  const { menuItems, isLoading: isMenuLoading, error: menuError, refreshMenu } = useMenu();
  const {
    tables,
    isLoading: isTablesLoading,
    isUpdating: isTablesUpdating,
    error: tablesError,
    refreshTables,
    updateTable,
  } = useTables(token);

  const canReadOrders = role === 'admin' || role === 'waiter';
  const canReadReservations = canReadOrders;
  const canUpdateOrderStatus = canReadOrders;

  const {
    orders,
    isLoading: isOrdersLoading,
    isMutating: isOrdersMutating,
    error: ordersError,
    refreshOrders,
    createOrder,
    updateOrderStatus,
  } = useOrders(token, canReadOrders);

  const {
    reservations,
    isLoading: isReservationsLoading,
    isMutating: isReservationsMutating,
    error: reservationsError,
    refreshReservations,
    createReservation,
  } = useReservations(token, canReadReservations);

  const { isMutating: isMenuMutating, error: menuMutatingError, createMenuItem, updateMenuItem, deleteMenuItem } =
    useMenuManager(token, refreshMenu);

  const activeError = useMemo(
    () =>
      (notice.type === 'error' ? notice.message : '') ||
      authError ||
      menuError ||
      menuMutatingError ||
      tablesError ||
      ordersError ||
      reservationsError,
    [
      notice.type,
      notice.message,
      authError,
      menuError,
      menuMutatingError,
      tablesError,
      ordersError,
      reservationsError,
    ],
  );

  const normalizedTableLayoutOrder = useMemo(
    () => synchronizeLayout(tableLayoutOrder, tables),
    [tableLayoutOrder, tables],
  );

  const normalizedTableLayoutPositions = useMemo(
    () => synchronizeLayoutPositions(tableLayoutPositions, tables),
    [tableLayoutPositions, tables],
  );

  useEffect(() => {
    saveJson(TABLE_ASSIGNMENTS_KEY, tableAssignments);
  }, [tableAssignments]);

  useEffect(() => {
    if (!isAuthenticated || !isAuthorizationError(activeError)) {
      return;
    }

    logout();
  }, [activeError, isAuthenticated, logout]);

  useEffect(() => {
    saveJson(ORDER_TABLE_MAP_KEY, orderTableMap);
  }, [orderTableMap]);

  useEffect(() => {
    saveJson(ORDER_TICKET_MAP_KEY, orderTicketMap);
  }, [orderTicketMap]);

  const effectiveTableOpenTicketMap = useMemo(() => {
    const nextMap = { ...tableOpenTicketMap };

    Object.entries(tableOpenTicketMap).forEach(([tableId, ticketId]) => {
      const relatedOrders = orders.filter((order) => {
        const mappedTableId = orderTableMap[order._id];
        const mappedTicketId = orderTicketMap[order._id] ?? order._id;
        return mappedTableId === tableId && mappedTicketId === ticketId;
      });

      if (!relatedOrders.length) {
        return;
      }

      const hasOpenOrder = relatedOrders.some((order) => !CLOSED_ORDER_STATUSES.has(order.status));

      if (!hasOpenOrder) {
        delete nextMap[tableId];
      }
    });

    return nextMap;
  }, [tableOpenTicketMap, orders, orderTableMap, orderTicketMap]);

  useEffect(() => {
    saveJson(TABLE_OPEN_TICKET_KEY, effectiveTableOpenTicketMap);
  }, [effectiveTableOpenTicketMap]);

  useEffect(() => {
    saveJson(TABLE_LAYOUT_KEY, normalizedTableLayoutOrder);
  }, [normalizedTableLayoutOrder]);

  useEffect(() => {
    saveJson(TABLE_LAYOUT_POSITIONS_KEY, normalizedTableLayoutPositions);
  }, [normalizedTableLayoutPositions]);

  const setErrorNotice = (message) => setNotice({ type: 'error', message });
  const setSuccessNotice = (message) => setNotice({ type: 'success', message });

  const handleRegister = async (payload) => {
    try {
      await register(payload);
      setSuccessNotice('Konto utworzone. Możesz się zalogować.');
    } catch (error) {
      setErrorNotice(error.message);
    }
  };

  const handleLogin = async (credentials) => {
    try {
      await login(credentials);
      setSuccessNotice('Zalogowano pomyślnie.');
    } catch (error) {
      setErrorNotice(error.message);
    }
  };

  const handleRefresh = async () => {
    setNotice({ type: '', message: '' });
    await Promise.all([refreshMenu(), refreshTables(), refreshOrders(), refreshReservations()]);
  };

  const handleAssignWaiter = (tableId, waiterName) => {
    setTableAssignments((currentAssignments) => ({
      ...currentAssignments,
      [tableId]: waiterName,
    }));
    setSuccessNotice('Przypisanie kelnera zapisane lokalnie.');
  };

  const handleUpdateTableStatus = async (tableId, status) => {
    try {
      await updateTable(tableId, { status });
      setSuccessNotice('Status stolika zaktualizowany.');
    } catch (error) {
      setErrorNotice(error.message);
    }
  };

  const handleCreateReservation = async (payload) => {
    if (!payload.tableId) {
      setErrorNotice('Wybierz stolik dla rezerwacji.');
      return;
    }

    if (!payload.reservationDate || !payload.startTime || !payload.endTime) {
      setErrorNotice('Uzupełnij datę i godziny rezerwacji.');
      return;
    }

    if (!Number.isInteger(payload.numberOfGuests) || payload.numberOfGuests <= 0) {
      setErrorNotice('Liczba gości musi być dodatnią liczbą całkowitą.');
      return;
    }

    const selectedTable = tables.find((table) => table._id === payload.tableId);
    const selectedTableCapacity = Number(selectedTable?.capacity) || 0;

    if (!selectedTable) {
      setErrorNotice('Wybrany stolik nie istnieje. Odśwież dane i spróbuj ponownie.');
      return;
    }

    if (selectedTableCapacity && payload.numberOfGuests > selectedTableCapacity) {
      setErrorNotice(`Maks. ilość gości dla stolika #${selectedTable.tableNumber} to ${selectedTableCapacity}.`);
      return;
    }

    if (payload.startTime >= payload.endTime) {
      setErrorNotice('Godzina zakończenia musi być późniejsza niż rozpoczęcia.');
      return;
    }

    try {
      await createReservation(payload);
      await refreshReservations();
      setSuccessNotice('Rezerwacja została dodana.');
    } catch (error) {
      setErrorNotice(error.message);
    }
  };

  const handleSubmitOrder = async ({ tableId, items, totalPrice, isAddOn }) => {
    if (!tableId) {
      setErrorNotice('Wybierz stolik dla zamówienia.');
      return;
    }

    if (!items.length) {
      setErrorNotice('Dodaj przynajmniej jedną pozycję do zamówienia.');
      return;
    }

    try {
      const existingTicketId = effectiveTableOpenTicketMap[tableId];
      const createdOrder = await createOrder({ items, totalPrice });

      const nextTicketId = existingTicketId ?? createdOrder._id;

      setOrderTableMap((currentMap) => ({
        ...currentMap,
        [createdOrder._id]: tableId,
      }));
      setOrderTicketMap((currentMap) => ({
        ...currentMap,
        [createdOrder._id]: nextTicketId,
      }));
      setTableOpenTicketMap((currentMap) => ({
        ...currentMap,
        [tableId]: nextTicketId,
      }));

      setSuccessNotice(isAddOn || existingTicketId ? 'Dodano domówienie do otwartego ticketu.' : 'Otwarto nowy ticket.');
    } catch (error) {
      setErrorNotice(error.message);
    }
  };

  const handleUpdateOrderStatus = async (orderIds, status) => {
    try {
      const normalizedOrderIds = Array.isArray(orderIds) ? orderIds : [orderIds];

      await Promise.all(normalizedOrderIds.map((orderId) => updateOrderStatus(orderId, status)));

      if (CLOSED_ORDER_STATUSES.has(status)) {
        const tableIdsToClose = new Set();

        normalizedOrderIds.forEach((orderId) => {
          const tableId = orderTableMap[orderId];
          if (tableId) {
            tableIdsToClose.add(tableId);
          }
        });

        if (tableIdsToClose.size) {
          setTableOpenTicketMap((currentMap) => {
            const nextMap = { ...currentMap };

            tableIdsToClose.forEach((tableId) => {
              delete nextMap[tableId];
            });

            return nextMap;
          });
        }
      }

      setSuccessNotice('Status ticketu został zmieniony.');
    } catch (error) {
      setErrorNotice(error.message);
    }
  };

  const handleCreateMenuItem = async (payload) => {
    try {
      await createMenuItem(payload);
      setSuccessNotice('Pozycja menu dodana.');
    } catch (error) {
      setErrorNotice(error.message);
    }
  };

  const handleUpdateMenuItem = async (itemId, payload) => {
    try {
      await updateMenuItem(itemId, payload);
      setSuccessNotice('Pozycja menu zaktualizowana.');
    } catch (error) {
      setErrorNotice(error.message);
    }
  };

  const handleDeleteMenuItem = async (itemId) => {
    try {
      await deleteMenuItem(itemId);
      setSuccessNotice('Pozycja menu usunięta.');
    } catch (error) {
      setErrorNotice(error.message);
    }
  };

  if (!isAuthenticated) {
    return <AuthPanel onLogin={handleLogin} onRegister={handleRegister} isLoading={isAuthLoading} error={activeError} />;
  }

  return (
    <main className="app-shell">
      <TopBar role={role} onLogout={logout} onRefresh={handleRefresh} />

      {activeError ? <p className="alert error">{activeError}</p> : null}
      {!activeError && notice.type === 'success' ? <p className="alert success">{notice.message}</p> : null}

      <p className="muted banner-note">
        Przypisanie kelnera oraz ticketu do stolika jest utrzymywane po stronie frontendu, bo backend nie ma jeszcze tych relacji.
      </p>

      <nav className="view-tabs">
        <NavLink to="/sala" className={({ isActive }) => (isActive ? 'tab-link active' : 'tab-link')}>
          Sala
        </NavLink>
        <NavLink to="/pos" className={({ isActive }) => (isActive ? 'tab-link active' : 'tab-link')}>
          Zamówienia
        </NavLink>
        <NavLink to="/menu" className={({ isActive }) => (isActive ? 'tab-link active' : 'tab-link')}>
          Menu
        </NavLink>
        {role === 'admin' && (
          <NavLink to="/admin/menu" className={({ isActive }) => (isActive ? 'tab-link active' : 'tab-link')}>
            Zarządzaj Menu
          </NavLink>
        )}
      </nav>

      <Routes>
        <Route
          path="/sala"
          element={
            <section className="content-grid single-column">
              <div className="left-column">
                <TableBoard
                  tables={tables}
                  layoutOrder={normalizedTableLayoutOrder}
                  layoutPositions={normalizedTableLayoutPositions}
                  reservations={reservations}
                  canReadReservations={canReadReservations}
                  isReservationsLoading={isReservationsLoading}
                  isReservationsMutating={isReservationsMutating}
                  waiterAssignments={tableAssignments}
                  role={role}
                  isBusy={isTablesUpdating}
                  onMoveTable={setTableLayoutPositions}
                  onAssignWaiter={handleAssignWaiter}
                  onUpdateTableStatus={handleUpdateTableStatus}
                  onCreateReservation={handleCreateReservation}
                />
              </div>
            </section>
          }
        />
        <Route
          path="/pos"
          element={
            <section className="content-grid">
              <div className="left-column">
                <OrderBuilder
                  tables={tables}
                  menuItems={menuItems}
                  isSubmitting={isOrdersMutating}
                  openTicketByTable={effectiveTableOpenTicketMap}
                  onSubmitOrder={handleSubmitOrder}
                />

                <OrdersList
                  orders={orders}
                  tables={tables}
                  orderTableMap={orderTableMap}
                  ticketOrderMap={orderTicketMap}
                  tableAssignments={tableAssignments}
                  canReadOrders={canReadOrders}
                  canUpdateStatus={canUpdateOrderStatus}
                  isLoading={isOrdersLoading}
                  isMutating={isOrdersMutating}
                  onUpdateTicketStatus={handleUpdateOrderStatus}
                />
              </div>

              <div className="right-column">
                <MenuCatalog menuItems={menuItems} isLoading={isMenuLoading || isTablesLoading} />
              </div>
            </section>
          }
        />
        <Route
          path="/menu"
          element={
            <section className="content-grid single-column">
              <div className="left-column">
                <MenuCatalog menuItems={menuItems} isLoading={isMenuLoading || isTablesLoading} />
              </div>
            </section>
          }
        />
        {role === 'admin' && (
          <Route
            path="/admin/menu"
            element={
              <section className="content-grid single-column">
                <div className="left-column">
                  <MenuManager
                    menuItems={menuItems}
                    role={role}
                    isMutating={isMenuMutating}
                    onCreateMenuItem={handleCreateMenuItem}
                    onUpdateMenuItem={handleUpdateMenuItem}
                    onDeleteMenuItem={handleDeleteMenuItem}
                  />
                </div>
              </section>
            }
          />
        )}
        <Route path="*" element={<Navigate to="/sala" replace />} />
      </Routes>
    </main>
  );
}

export default App;
