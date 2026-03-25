export const TopBar = ({ role, onLogout, onRefresh }) => {
  return (
    <header className="top-bar">
      <div>
        <h1>GastroHub - Panel sali</h1>
        <p className="muted">
          Zalogowana rola: <strong>{role}</strong>
        </p>
      </div>

      <div className="row-actions">
        <button type="button" onClick={onRefresh}>
          Odśwież dane
        </button>
        <button type="button" className="danger-btn" onClick={onLogout}>
          Wyloguj
        </button>
      </div>
    </header>
  );
};
