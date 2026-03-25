import { useMemo, useState } from 'react';

export const OrderBuilder = ({
  tables,
  menuItems,
  isSubmitting,
  openTicketByTable,
  onSubmitOrder,
}) => {
  const [selectedTableId, setSelectedTableId] = useState('');
  const [quantities, setQuantities] = useState({});

  const cartItems = useMemo(() => {
    return menuItems
      .map((item) => ({
        menuItemId: item._id,
        name: item.name,
        price: Number(item.price),
        quantity: Number(quantities[item._id] || 0),
      }))
      .filter((item) => item.quantity > 0);
  }, [menuItems, quantities]);

  const totalPrice = useMemo(
    () => cartItems.reduce((total, item) => total + item.quantity * item.price, 0),
    [cartItems],
  );

  const handleSubmit = async (event) => {
    event.preventDefault();

    const hasOpenTicket = Boolean(openTicketByTable[selectedTableId]);

    await onSubmitOrder({
      tableId: selectedTableId,
      items: cartItems.map((item) => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
      })),
      totalPrice: Number(totalPrice.toFixed(2)),
      isAddOn: hasOpenTicket,
    });

    setQuantities({});
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>POS - Obsługa zamówień</h2>
      </div>

      <form className="form" onSubmit={handleSubmit}>
        <label>
          Wybierz stolik
          <select value={selectedTableId} onChange={(event) => setSelectedTableId(event.target.value)} required>
            <option value="">-- wybierz --</option>
            {tables.map((table) => (
              <option key={table._id} value={table._id}>
                Stolik #{table.tableNumber}
                {openTicketByTable[table._id] ? ' (otwarty ticket)' : ''}
              </option>
            ))}
          </select>
        </label>

        {selectedTableId && openTicketByTable[selectedTableId] ? (
          <p className="muted">Dla tego stolika jest otwarty ticket. Pozycje zostaną dodane jako domówienie.</p>
        ) : null}

        <div className="order-items">
          {menuItems.map((item) => (
            <label key={item._id} className="order-item-row">
              <span>
                {item.name} ({Number(item.price).toFixed(2)} zł)
              </span>
              <input
                type="number"
                min={0}
                max={20}
                value={quantities[item._id] ?? 0}
                onChange={(event) =>
                  setQuantities((prev) => ({ ...prev, [item._id]: Number(event.target.value) }))
                }
              />
            </label>
          ))}
        </div>

        <p className="title">Suma: {totalPrice.toFixed(2)} zł</p>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? 'Zapisywanie...'
            : selectedTableId && openTicketByTable[selectedTableId]
              ? 'Dodaj domówienie'
              : 'Otwórz ticket'}
        </button>
      </form>
    </section>
  );
};
