import { useMemo, useState } from 'react';

export const MenuCatalog = ({ menuItems, isLoading }) => {
  const [searchValue, setSearchValue] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = useMemo(() => {
    const distinct = new Set(menuItems.map((item) => item.category).filter(Boolean));
    return ['all', ...distinct];
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const byCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const bySearch = item.name.toLowerCase().includes(searchValue.toLowerCase());
      return byCategory && bySearch;
    });
  }, [menuItems, searchValue, selectedCategory]);

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Menu restauracji</h2>
      </div>

      <div className="row-filters">
        <input
          type="text"
          placeholder="Szukaj pozycji menu"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
        />
        <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category === 'all' ? 'Wszystkie kategorie' : category}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? <p>Wczytywanie menu...</p> : null}

      <ul className="list-clean menu-list">
        {filteredItems.map((item) => (
          <li key={item._id}>
            <div>
              <p className="title">{item.name}</p>
              <p className="muted">{item.description || 'Brak opisu'}</p>
            </div>
            <strong>{Number(item.price).toFixed(2)} zł</strong>
          </li>
        ))}
      </ul>
    </section>
  );
};
