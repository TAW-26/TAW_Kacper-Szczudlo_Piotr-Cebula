import { useCallback, useState } from 'react';
import {
  createMenuItemRequest,
  deleteMenuItemRequest,
  getPublicCatalogCategoriesRequest,
  getPublicCatalogItemsRequest,
  importMenuItemFromCatalogRequest,
  updateMenuItemRequest,
} from '../api/menuApi';

export const useMenuManager = (token, onMenuUpdated) => {
  const [isMutating, setIsMutating] = useState(false);
  const [isCatalogLoading, setIsCatalogLoading] = useState(false);
  const [error, setError] = useState('');

  const createMenuItem = useCallback(
    async (payload) => {
      if (!token) {
        throw new Error('Musisz być zalogowany jako admin');
      }

      setIsMutating(true);
      setError('');

      try {
        const createdItem = await createMenuItemRequest(token, payload);
        onMenuUpdated?.();
        return createdItem;
      } catch (createError) {
        setError(createError.message);
        throw createError;
      } finally {
        setIsMutating(false);
      }
    },
    [token, onMenuUpdated],
  );

  const updateMenuItem = useCallback(
    async (itemId, payload) => {
      if (!token) {
        throw new Error('Musisz być zalogowany jako admin');
      }

      setIsMutating(true);
      setError('');

      try {
        const updatedItem = await updateMenuItemRequest(token, itemId, payload);
        onMenuUpdated?.();
        return updatedItem;
      } catch (updateError) {
        setError(updateError.message);
        throw updateError;
      } finally {
        setIsMutating(false);
      }
    },
    [token, onMenuUpdated],
  );

  const deleteMenuItem = useCallback(
    async (itemId) => {
      if (!token) {
        throw new Error('Musisz być zalogowany jako admin');
      }

      setIsMutating(true);
      setError('');

      try {
        await deleteMenuItemRequest(token, itemId);
        onMenuUpdated?.();
      } catch (deleteError) {
        setError(deleteError.message);
        throw deleteError;
      } finally {
        setIsMutating(false);
      }
    },
    [token, onMenuUpdated],
  );

  const loadCatalogCategories = useCallback(async () => {
    setIsCatalogLoading(true);
    setError('');

    try {
      return await getPublicCatalogCategoriesRequest();
    } catch (catalogError) {
      setError(catalogError.message);
      throw catalogError;
    } finally {
      setIsCatalogLoading(false);
    }
  }, []);

  const loadCatalogItems = useCallback(async (query) => {
    setIsCatalogLoading(true);
    setError('');

    try {
      return await getPublicCatalogItemsRequest(query);
    } catch (catalogError) {
      setError(catalogError.message);
      throw catalogError;
    } finally {
      setIsCatalogLoading(false);
    }
  }, []);

  const importCatalogItem = useCallback(
    async (payload) => {
      if (!token) {
        throw new Error('Musisz być zalogowany jako admin');
      }

      setIsMutating(true);
      setError('');

      try {
        const importedItem = await importMenuItemFromCatalogRequest(token, payload);
        onMenuUpdated?.();
        return importedItem;
      } catch (importError) {
        setError(importError.message);
        throw importError;
      } finally {
        setIsMutating(false);
      }
    },
    [token, onMenuUpdated],
  );

  return {
    isMutating,
    isCatalogLoading,
    error,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    loadCatalogCategories,
    loadCatalogItems,
    importCatalogItem,
  };
};
