import { useState, useEffect } from 'react';
import { getProfileSettings, updateProfileSettings } from '../lib/api';
import type { Database } from '../lib/types';

type ProfileSettings = Database['public']['Tables']['profile_settings']['Row'];

export function useProfileSettings() {
  const [settings, setSettings] = useState<ProfileSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadSettings() {
      try {
        const data = await getProfileSettings();
        console.log("profile information = " , data) ; 
        if (mounted) {
          setSettings(data);
          setError(null);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadSettings();

    return () => {
      mounted = false;
    };
  }, []);

  const updateSettings = async (updates: Partial<Omit<ProfileSettings, 'id' | 'profile_id' | 'created_at' | 'updated_at'>>) => {
    try {
      const updated = await updateProfileSettings(updates);
      setSettings(updated);
      setError(null);
      return updated;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return { settings, loading, error, updateSettings };
}