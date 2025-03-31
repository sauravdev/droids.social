import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { supabase, checkSupabaseConnection } from '../lib/supabase';
import { getProfile } from '../lib/api';
import { useSocialAccounts } from '../hooks/useSocialAccounts';

interface AuthContextType {
  session: Session | null;
  loading: boolean;
  isFirstLogin: boolean;
  connectionError: string | null;
  refreshHeader: boolean ,
  setRefreshHeader: React.Dispatch<React.SetStateAction<boolean>> 
  paymentStatus : boolean , 
  setPaymentStatus: React.Dispatch<React.SetStateAction<boolean>> 
  tokens  : number , 
  setTokens :  React.Dispatch<React.SetStateAction<number>> 


}

const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
  isFirstLogin: false,
  connectionError: null,
  refreshHeader : false , 
  setRefreshHeader : () => {} ,
  paymentStatus : false, 
  setPaymentStatus : () => {}  ,
  tokens : 0  , 
  setTokens : () => {} 
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [refreshHeader , setRefreshHeader ] = useState<boolean>(false) ; 
  const [paymentStatus , setPaymentStatus ] = useState<boolean>(false) ; 
  const [tokens , setTokens ] = useState(0) ;
  
  const navigate = useNavigate();

  useEffect(() => {
    console.log("use effect  tokens = " , tokens ) ; 
  } , [tokens ]  )   ;  
  


  async function isThisMonthRecordPresentForInstagram(tableName: string): Promise<boolean> {
    const now = new Date();
    const todayDate = now.toISOString().split('T')[0];
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]; 
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]; 
    const { data, error } = await supabase
        .from(tableName)
        .select('date')
        .gte('date', startOfMonth) 
        .lte('date', endOfMonth) 
        .eq("platform" , "instagram")
        .limit(1);
    if (error) {
        console.error('Error fetching data:', error);
        return false;
    }
    console.log("data from the is month record present (instagram) = " , data)  ;

    if(data.length == 0 ) 
    {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user found');
  if (error) throw error;
    const { error: insertError } = await supabase.from(tableName).insert([
      {
          reach : 14,
          engagement : 12.50,
          post : 9,
          followers : 4,
          date: todayDate,
          platform : "instagram" ,
          profileid : user?.id , 
      }
  ]);

  if (insertError) {
      console.error('Error inserting record:', insertError);
  } else {
      console.log('New record inserted for this month.');
  }
    }
    return data.length > 0;
}


async function isThisMonthRecordPresentForTwitter(tableName: string): Promise<boolean> {
  const now = new Date();
  const todayDate = now.toISOString().split('T')[0];
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]; 
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]; 
  const { data, error } = await supabase
      .from(tableName)
      .select('date')
      .gte('date', startOfMonth) 
      .lte('date', endOfMonth) 
      .eq("platform" , "twitter")
      .limit(1);
  if (error) {
      console.error('Error fetching data:', error);
      return false;
  }
  console.log("data from the is month record present (twitter) = " , data)  ;

  if(data.length == 0 ) 
  {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No authenticated user found');
  const { error: insertError } = await supabase.from(tableName).insert([
    {
        reach : 100,
        engagement : 63.5,
        post : 5,
        followers : 1,
        date: todayDate,
        platform : "instagram" ,
        profileid : user?.id , 
    }
]);

if (insertError) {
    console.error('Error inserting record:', insertError);
} else {
    console.log('New record inserted for this month.');
}
  }
  return data.length > 0;
}

  


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
    isThisMonthRecordPresentForInstagram("account_analytics");
    isThisMonthRecordPresentForTwitter("account_analytics") ;

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
    <AuthContext.Provider value={{ session, loading, isFirstLogin, connectionError , refreshHeader , setRefreshHeader  , paymentStatus , setPaymentStatus  , tokens , setTokens }}>
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