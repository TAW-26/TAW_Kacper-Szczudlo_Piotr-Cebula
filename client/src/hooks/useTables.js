import { useCallback, useEffect, useState } from 'react';
import { createTableRequest, getTablesRequest, updateTableRequest } from '../api/tablesApi';

export const useTables = (token) => {
  const [tables, setTables] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');

  const refreshTables = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const data = await getTablesRequest();
      setTables(data);
    } catch (tablesError) {
      setError(tablesError.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshTables();
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
