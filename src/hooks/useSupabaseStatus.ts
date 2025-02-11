import { useState, useEffect } from 'react';
import { checkSupabaseHealth } from '../lib/supabase';

interface SupabaseStatus {
  isHealthy: boolean;
  latency: number;
  error: string | null;
}

export function useSupabaseStatus() {
  const [status, setStatus] = useState<SupabaseStatus>({
    isHealthy: true,
    latency: 0,
    error: null
  });

  useEffect(() => {
    let mounted = true;
    let checkInterval: number;

    async function checkHealth() {
      const health = await checkSupabaseHealth();
      if (mounted) {
        setStatus(health);
      }
    }

    // Initial check
    checkHealth();

    // Set up periodic health checks
    checkInterval = window.setInterval(checkHealth, 30000); // Check every 30 seconds

    return () => {
      mounted = false;
      clearInterval(checkInterval);
    };
  }, []);

  return stat;
}