import { useState, useEffect } from 'react';
import { getContentStrategies, saveContentStrategy } from '../lib/api';
import type { ContentStrategy } from '../lib/types';

export function useContentStrategy() {
  const [strategies, setStrategies] = useState<ContentStrategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStrategies();
  }, []);

  async function loadStrategies() {
    try {
      const data = await getContentStrategies();
      setStrategies(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  async function createStrategy(strategy: Omit<ContentStrategy, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const created = await saveContentStrategy(strategy);
      setStrategies([...strategies, created]);
      return created;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }

  return { strategies, loading, error, createStrategy };
}