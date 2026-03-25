import { useCallback, useEffect, useState } from 'react';
import { getMenuItemsRequest } from '../api/menuApi';

export const useMenu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const refreshMenu = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const items = await getMenuItemsRequest();
      setMenuItems(items);
    } catch (menuError) {
      setError(menuError.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMenu();
  }, [refreshMenu]);

  return {
    menuItems,
    isLoading,
    error,
    refreshMenu,
  };
};
