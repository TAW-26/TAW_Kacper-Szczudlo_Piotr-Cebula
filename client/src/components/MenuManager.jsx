import { useCallback, useEffect, useMemo, useState } from 'react';

const SORT_OPTIONS = [
  { value: 'name_asc', label: 'Nazwa A-Z' },
  { value: 'name_desc', label: 'Nazwa Z-A' },
];

const getInitialPriceDrafts = (items) =>
  items.reduce((acc, item) => {
    acc[item._id] = Number(item.price || 0).toFixed(2);
    return acc;
  }, {});

export const MenuManager = ({
  menuItems,
  role,
  isMutating,
  isCatalogLoading,
  onUpdateMenuItem,
  onDeleteMenuItem,
  onLoadCatalogCategories,
  onLoadCatalogItems,
  onImportCatalogItem,
}) => {
  const [activeTab, setActiveTab] = useState('view');
  const [priceDrafts, setPriceDrafts] = useState(() => getInitialPriceDrafts(menuItems));
  const [catalogPriceDrafts, setCatalogPriceDrafts] = useState({});
  const [catalogItems, setCatalogItems] = useState([]);
  const [catalogCategories, setCatalogCategories] = useState([]);
  const [searchValue, setSearchValue] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSort, setSelectedSort] = useState('name_asc');

  useEffect(() => {
    setPriceDrafts(getInitialPriceDrafts(menuItems));
  }, [menuItems]);

  const menuItemsSorted = useMemo(
    () => [...menuItems].sort((a, b) => a.name.localeCompare(b.name, 'pl')),
    [menuItems],
  );

  const handleLoadCatalog = useCallback(async () => {
    try {
      const [categories, items] = await Promise.all([
        onLoadCatalogCategories(),
        onLoadCatalogItems({
          category: selectedCategory,
          search: searchValue,
          sort: selectedSort,
        }),
      ]);

      setCatalogCategories(categories);
      setCatalogItems(items);
    } catch {
      // Error is handled by parent
    }
  }, [onLoadCatalogCategories, onLoadCatalogItems, searchValue, selectedCategory, selectedSort]);

  useEffect(() => {
    if (activeTab !== 'catalog') {
      return;
    }

    handleLoadCatalog();
  }, [activeTab, handleLoadCatalog]);

  const handleSavePrice = async (itemId) => {
    const draftValue = priceDrafts[itemId];

    if (!draftValue) {
      return;
    }

    try {
      await onUpdateMenuItem(itemId, { price: Number(draftValue) });
    } catch {
      // Error is handled by parent
    }
  };

  const handleImportItem = async (item) => {
    const priceValue = catalogPriceDrafts[item.externalId] ?? '30';

    try {
      await onImportCatalogItem({
        mealId: item.externalId,
        price: Number(priceValue),
      });
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
          Ceny w menu
        </button>
        <button
          type="button"
          className={`tab-link ${activeTab === 'catalog' ? 'active' : ''}`}
          onClick={() => setActiveTab('catalog')}
        >
          Dodaj z bazy TheMealDB
        </button>
      </div>

      {activeTab === 'view' ? (
        <ul className="list-clean menu-list">
          {menuItemsSorted.map((item) => (
            <li key={item._id}>
              <div>
                <p className="title">{item.name}</p>
                <p className="muted">
                  {item.category} • {Number(item.price).toFixed(2)} zł
                </p>
                {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="menu-thumb" loading="lazy" /> : null}
              </div>
              <div className="menu-manager-actions">
                <label>
                  Cena (zł)
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={priceDrafts[item._id] ?? ''}
                    onChange={(event) =>
                      setPriceDrafts((current) => ({ ...current, [item._id]: event.target.value }))
                    }
                  />
                </label>
                <button type="button" onClick={() => handleSavePrice(item._id)} disabled={isMutating}>
                  Zapisz cenę
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
        <section className="catalog-section">
          <div className="row-filters">
            <input
              type="text"
              placeholder="Szukaj w bazie TheMealDB"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
            />
            <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}>
              <option value="all">Wszystkie kategorie</option>
              {catalogCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <select value={selectedSort} onChange={(event) => setSelectedSort(event.target.value)}>
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button type="button" onClick={handleLoadCatalog} disabled={isCatalogLoading}>
              {isCatalogLoading ? 'Wczytywanie...' : 'Odśwież listę'}
            </button>
          </div>

          <ul className="list-clean menu-list catalog-list">
            {catalogItems.map((item) => (
              <li key={item.externalId}>
                <div>
                  <p className="title">{item.name}</p>
                  <p className="muted">{item.category}</p>
                  {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="menu-thumb" loading="lazy" /> : null}
                </div>
                <div className="menu-manager-actions">
                  <label>
                    Cena startowa (zł)
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={catalogPriceDrafts[item.externalId] ?? '30'}
                      onChange={(event) =>
                        setCatalogPriceDrafts((current) => ({
                          ...current,
                          [item.externalId]: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <button type="button" onClick={() => handleImportItem(item)} disabled={isMutating}>
                    Dodaj do menu
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </section>
  );
};
