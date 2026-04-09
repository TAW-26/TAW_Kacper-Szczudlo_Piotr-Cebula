import { useCallback, useEffect, useState } from 'react';
import { createTableRequest, getTablesRequest, updateTableRequest } from '../api/tablesApi';

const TABLE_REFRESH_INTERVAL_MS = 60_000;

export const useTables = (token) => {
  const [tables, setTables] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');

  const refreshTables = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setIsLoading(true);
    }
    setError('');

    try {
      const data = await getTablesRequest();
      setTables(data);
    } catch (tablesError) {
      setError(tablesError.message);
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    refreshTables();

    const intervalId = setInterval(() => {
      refreshTables({ silent: true });
    }, TABLE_REFRESH_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [refreshTables]);

  const updateTable = useCallback(
    async (tableId, payload) => {
      setIsUpdating(true);

      try {
        const updatedTable = await updateTableRequest(token, tableId, payload);
        setTables((currentTables) =>
          currentTables.map((table) => (table._id === tableId ? updatedTable : table)),
        );
      } finally {
        setIsUpdating(false);
      }
    },
    [token],
  );

  const createTable = useCallback(
    async (payload) => {
      setIsUpdating(true);

      try {
        const createdTable = await createTableRequest(token, payload);
        setTables((currentTables) => [...currentTables, createdTable]);
      } finally {
        setIsUpdating(false);
      }
    },
    [token],
  );

  return {
    tables,
    isLoading,
    isUpdating,
    error,
    refreshTables,
    updateTable,
    createTable,
  };
};
