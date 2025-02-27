import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { supabase, checkSupabaseConnection } from '../lib/supabase';
import { getProfile } from '../lib/api';

interface AuthContextType {
  session: Session | null;
  loading: boolean;
  isFirstLogin: boolean;
  connectionError: string | null;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
  isFirstLogin: false,
  connectionError: null
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const navigate = useNavigate();
  


  useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        // Check Supabase connection first
        const isConnected = await checkSupabaseConnection();
        if (!isConnected && mounted) {
          setConnectionError('Unable to connect to the database. Please ensure you are connected to Supabase.');
          setLoading(false);
          return;
        }

        // Get initial session
        const { data: { session } } = await supabase.auth.getSession();
        console.log("session: " + JSON.stringify(session));
        if (mounted) {
          setSession(session);
          if (session) {
            try {
              const profile = await getProfile();
              if (mounted) {
                if (!profile.full_name) {
                  setIsFirstLogin(true);
                  navigate('/settings');
                } else {
                  setIsFirstLogin(false);
                }
              }
            } catch (error) {
              console.error('Error checking profile:', error);
              if (mounted) {
                setConnectionError('Error loading profile. Please try again.');
              }
            }
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Initialization error:', error);
        if (mounted) {
          setConnectionError('Failed to initialize the application. Please try again.');
          setLoading(false);
        }
      }
    }

    initialize();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session);
        if (!session) {
          setIsFirstLogin(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ session, loading, isFirstLogin, connectionError }}>
      {connectionError ? (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
          <div className="bg-red-900 text-white px-6 py-4 rounded-lg max-w-md text-center">
            <p className="mb-4">{connectionError}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-white text-red-900 px-4 py-2 rounded hover:bg-gray-100 transition-colors"
            >
              Retry Connection
            </button>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}