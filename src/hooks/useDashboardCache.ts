// hooks/useDashboardCache.ts
import { useRef, useCallback } from 'react';

export function useDashboardCache() {
  const cache = useRef(new Map());
  
  const getOrFetch = useCallback(async (key: string, fetcher: () => Promise<any>, ttl = 60000) => {
    const cached = cache.current.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }
    
    const data = await fetcher();
    cache.current.set(key, { data, timestamp: Date.now() });
    return data;
  }, []);
  
  const invalidate = useCallback((key?: string) => {
    if (key) {
      cache.current.delete(key);
    } else {
      cache.current.clear();
    }
  }, []);
  
  return { getOrFetch, invalidate };
}