import React from 'react';
import { useSupabaseStatus } from '../hooks/useSupabaseStatus';
import { Wifi, WifiOff } from 'lucide-react';

export function SupabaseStatusIndicator() {
  const { isHealthy, latency, error } = useSupabaseStatus();

  if (!error && isHealthy) {
    return null; // Don't show anything when connection is healthy
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
        isHealthy ? 'bg-green-900' : 'bg-red-900'
      } text-white shadow-lg`}>
        {isHealthy ? (
          <Wifi className="h-4 w-4" />
        ) : (
          <WifiOff className="h-4 w-4" />
        )}
        <span className="text-sm">
          {error || `Latency: ${latency}ms`}
        </span>
      </div>
    </div>
  );
}