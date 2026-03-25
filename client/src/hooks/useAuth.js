import { useCallback, useEffect, useMemo, useState } from 'react';
import { loginRequest, registerRequest } from '../api/authApi';
import { getRoleFromToken, isTokenValid } from '../utils/jwt';
import { loadToken, saveToken } from '../utils/storage';

const getInitialToken = () => {
  const storedToken = loadToken();

  if (!isTokenValid(storedToken)) {
    saveToken('');
    return '';
  }

  return storedToken;
};

export const useAuth = () => {
  const [token, setToken] = useState(getInitialToken);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const hasValidToken = useMemo(() => isTokenValid(token), [token]);
  const role = useMemo(() => (hasValidToken ? getRoleFromToken(token) : 'unknown'), [hasValidToken, token]);
  const isAuthenticated = hasValidToken;

  useEffect(() => {
    if (!token || hasValidToken) {
      return;
    }

    saveToken('');
    setToken('');
    setError('Sesja wygasła. Zaloguj się ponownie.');
  }, [token, hasValidToken]);

  const login = useCallback(async (credentials) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await loginRequest(credentials);
      const authToken = response.token ?? '';
      if (!isTokenValid(authToken)) {
        throw new Error('Otrzymano nieprawidłowy token logowania');
      }

      saveToken(authToken);
      setToken(authToken);
    } catch (loginError) {
      setError(loginError.message);
      throw loginError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (payload) => {
    setIsLoading(true);
    setError('');

    try {
      await registerRequest(payload);
    } catch (registerError) {
      setError(registerError.message);
      throw registerError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    saveToken('');
    setToken('');
    setError('');
  }, []);

  return {
    token,
    role,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
  };
};
