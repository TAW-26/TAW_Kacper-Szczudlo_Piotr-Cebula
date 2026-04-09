import { useState } from 'react';

const initialLogin = { email: '', password: '' };
const initialRegister = { email: '', password: '', role: 'waiter' };

export const AuthPanel = ({ onLogin, onRegister, isLoading, error }) => {
  const [loginForm, setLoginForm] = useState(initialLogin);
  const [registerForm, setRegisterForm] = useState(initialRegister);
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    await onLogin(loginForm);
  };

  const handleRegisterSubmit = async (event) => {
    event.preventDefault();
    await onRegister(registerForm);
    setIsRegisterMode(false);
  };

  return (
    <main className="auth-container">
      <section className="auth-card">
        <h1>GastroHub</h1>
        <p className="muted">Zaloguj personel i rozpocznij obsługę sali.</p>

        {error ? <p className="error-text">{error}</p> : null}

        {!isRegisterMode ? (
          <form className="form" onSubmit={handleLoginSubmit}>
            <label>
              Email
              <input
                type="email"
                value={loginForm.email}
                onChange={(event) => setLoginForm((prev) => ({ ...prev, email: event.target.value }))}
                required
              />
            </label>

            <label>
              Hasło
              <input
                type="password"
                value={loginForm.password}
                onChange={(event) => setLoginForm((prev) => ({ ...prev, password: event.target.value }))}
                required
              />
            </label>

            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Logowanie...' : 'Zaloguj'}
            </button>
          </form>
        ) : (
          <form className="form" onSubmit={handleRegisterSubmit}>
            <label>
              Email
              <input
                type="email"
                value={registerForm.email}
                onChange={(event) =>
                  setRegisterForm((prev) => ({ ...prev, email: event.target.value }))
                }
                required
              />
            </label>

            <label>
              Hasło
              <input
                type="password"
                minLength={4}
                value={registerForm.password}
                onChange={(event) =>
                  setRegisterForm((prev) => ({ ...prev, password: event.target.value }))
                }
                required
              />
            </label>

            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Rejestracja...' : 'Utwórz konto'}
            </button>
          </form>
        )}

        <button
          type="button"
          className="ghost-btn"
          onClick={() => setIsRegisterMode((prev) => !prev)}
        >
          {isRegisterMode ? 'Mam już konto' : 'Nie masz konta? Zarejestruj'}
        </button>
      </section>
    </main>
  );
};
