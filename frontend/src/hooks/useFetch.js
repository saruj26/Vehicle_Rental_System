import { useState, useEffect, useCallback } from 'react';
import api, { apiError } from '@/lib/api';

/**
 * Minimal data-fetching hook around the api client.
 * @param {string|null} url  endpoint (null to skip)
 * @param {object} options   { params, deps, skip }
 * Returns { data, meta, loading, error, refetch }.
 */
export function useFetch(url, { params, deps = [], skip = false } = {}) {
  const [data, setData] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!url || skip) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(url, { params });
      setData(res.data.data);
      setMeta(res.data.meta || null);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, skip, JSON.stringify(params)]);

  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refetch, ...deps]);

  return { data, meta, loading, error, refetch, setData };
}

export default useFetch;
