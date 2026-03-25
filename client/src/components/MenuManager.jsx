import { useState } from 'react';

const CATEGORIES = ['Dania Główne', 'Zupy', 'Przystawki', 'Desery', 'Napoje', 'Alkohol'];

export const MenuManager = ({ menuItems, role, isMutating, onCreateMenuItem, onUpdateMenuItem, onDeleteMenuItem }) => {
  const [activeTab, setActiveTab] = useState('view');
  const [editingItemId, setEditingItemId] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: CATEGORIES[0],
    isAvailable: true,
  });

  const handleStartCreate = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: CATEGORIES[0],
      isAvailable: true,
    });
    setEditingItemId('');
    setActiveTab('form');
  };

  const handleStartEdit = (item) => {
    setFormData({
      name: item.name,
      description: item.description || '',
      price: Number(item.price).toFixed(2),
      category: item.category,
      isAvailable: item.isAvailable,
    });
    setEditingItemId(item._id);
    setActiveTab('form');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      price: Number(formData.price),
      category: formData.category,
      isAvailable: formData.isAvailable,
    };

    try {
      if (editingItemId) {
        await onUpdateMenuItem(editingItemId, payload);
      } else {
        await onCreateMenuItem(payload);
      }
      setActiveTab('view');
    } catch {
      // Error is handled by parent
    }
  };

  const handleDelete = async (itemId) => {
    if (!confirm('Czy na pewno usunąć tę pozycję?')) {
      return;
    }

    try {
      await onDeleteMenuItem(itemId);
    } catch {
      // Error is handled by parent
    }
  };

  if (role !== 'admin') {
    return (
      <section className="panel">
        <div className="panel-header">
          <h2>Zarządzanie Menu</h2>
        </div>
        <p className="muted">Tylko administratorzy mają dostęp do tej sekcji.</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Zarządzanie Menu</h2>
      </div>

      <div className="view-tabs">
        <button
          type="button"
          className={`tab-link ${activeTab === 'view' ? 'active' : ''}`}
          onClick={() => setActiveTab('view')}
        >
          Widok
        </button>
        <button
          type="button"
          className={`tab-link ${activeTab === 'form' ? 'active' : ''}`}
          onClick={handleStartCreate}
        >
          Dodaj nową pozycję
        </button>
      </div>

      {activeTab === 'view' ? (
        <ul className="list-clean menu-list">
          {menuItems.map((item) => (
            <li key={item._id}>
              <div>
                <p className="title">{item.name}</p>
                <p className="muted">
                  {item.category} • {Number(item.price).toFixed(2)} zł
                </p>
                <p className="muted">{item.description || 'Brak opisu'}</p>
                <p className="muted small">Status: {item.isAvailable ? '✓ dostępne' : '✗ niedostępne'}</p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                <button
                  type="button"
                  onClick={() => handleStartEdit(item)}
                  disabled={isMutating}
                >
                  Edytuj
                </button>
                <button
                  type="button"
                  className="danger-btn"
                  onClick={() => handleDelete(item._id)}
                  disabled={isMutating}
                >
                  Usuń
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <form className="form" onSubmit={handleSubmit}>
          <label>
            Nazwa
            <input
              type="text"
              value={formData.name}
              onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
              required
            />
          </label>

          <label>
            Opis
            <textarea
              rows={3}
              value={formData.description}
              onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Opcjonalnie"
              style={{ fontFamily: 'inherit', fontSize: 'inherit' }}
            />
          </label>

          <label>
            Cena (zł)
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(event) => setFormData((prev) => ({ ...prev, price: event.target.value }))}
              required
            />
          </label>

          <label>
            Kategoria
            <select
              value={formData.category}
              onChange={(event) => setFormData((prev) => ({ ...prev, category: event.target.value }))}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={formData.isAvailable}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, isAvailable: event.target.checked }))
              }
            />
            Dostępne
          </label>

          <button type="submit" disabled={isMutating}>
            {isMutating ? 'Zapisywanie...' : editingItemId ? 'Zaktualizuj' : 'Utwórz pozycję'}
          </button>
          <button
            type="button"
            className="ghost-btn"
            onClick={() => setActiveTab('view')}
            disabled={isMutating}
          >
            Anuluj
          </button>
        </form>
      )}
    </section>
  );
};
