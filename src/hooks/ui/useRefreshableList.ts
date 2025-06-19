import { useState, useCallback } from "react";

export function useRefreshableList<T>(fetchData: () => Promise<T[]>) {
  const [data, setData] = useState<T[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      const fetchedData = await fetchData();
      setData(fetchedData);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchData]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedData = await fetchData();
      setData(fetchedData);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  return {
    data,
    isRefreshing,
    loading,
    error,
    refreshData,
    loadData,
  };
}
