import { useState, useEffect } from 'react';
import { getProfile, updateProfile } from '../lib/api';
import type { Profile } from '../lib/types';
import { useAuth } from '../context/AuthContext';
import { getProfileData, updateProfileDataInCache } from '../utils/profile';
// import { getProfileData } from '../utils/profile.js';

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(JSON.parse( localStorage.getItem('profile') ) );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const {refreshHeader} = useAuth(); 

  useEffect(() => {
    loadProfile();
  }, [refreshHeader]);

  async function loadProfile() {
    try {
      // const data = await getProfile();
      const data = getProfileData() ;
      console.log("getting profile data = " , data)  ;
      setProfile(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateUserProfile(updates: Partial<Profile>) {

    try {
      console.log("profile updates = " , updates);
      const updated = await updateProfile(updates);
      updateProfileDataInCache(updated) ;
      setProfile(updated);
      return updated;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }

  return { profile, loading, error, updateProfile: updateUserProfile };
}