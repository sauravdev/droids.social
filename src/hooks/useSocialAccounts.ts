import { useState, useEffect } from 'react';
import { getSocialAccounts, linkSocialAccount, unlinkSocialAccount } from '../lib/api';
import type { Database } from '../lib/types';

type SocialAccount = Database['public']['Tables']['social_accounts']['Row'];

export function useSocialAccounts() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAccounts();
  }, []);

  async function loadAccounts() {
    try {
      const data = await getSocialAccounts();
      console.log("social media accounts = ",data);
      setAccounts(data);
      setError(null);
    } catch (err: any) {
      console.error('Error loading social accounts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function linkAccount(account: Omit<SocialAccount, 'id' | 'profile_id' | 'created_at' | 'updated_at'>) {
    try {
      const linked = await linkSocialAccount(account);
      setAccounts([...accounts, linked]);
      return linked;
    } catch (err: any) {
      console.error('Error linking account:', err);
      throw err;
    }
  }

  async function unlinkAccount(platform: string) {
    try {
      await unlinkSocialAccount(platform);
      setAccounts(accounts.filter(acc => acc.platform !== platform));
    } catch (err: any) {
      console.error('Error unlinking account:', err);
      throw err;
    }
  }

  return { 
    accounts, 
    loading, 
    error, 
    linkAccount, 
    unlinkAccount,
    refreshAccounts: loadAccounts 
  };
}