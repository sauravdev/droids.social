import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { supabase, checkSupabaseConnection } from '../lib/supabase';
import { getProfile } from '../lib/api';
import { useSocialAccounts } from '../hooks/useSocialAccounts';
import { getProfileData } from '../utils/profile';
import { useCustomModel } from '../hooks/useCustomModel';

interface AuthContextType {
  session: Session | null;
  loading: boolean;
  isFirstLogin: boolean;
  connectionError: string | null;
  refreshHeader: boolean;
  setRefreshHeader: React.Dispatch<React.SetStateAction<boolean>>;
  paymentStatus: boolean;
  setPaymentStatus: React.Dispatch<React.SetStateAction<boolean>>;
  tokens: number;
  setTokens: React.Dispatch<React.SetStateAction<number>>;
  isUsingGoogleAuth: boolean;
  setIsUsingGoogleAuth: React.Dispatch<React.SetStateAction<boolean>>;
  models: string[];
  setModels: React.Dispatch<React.SetStateAction<string[]>>;
  selectedModel: string;
  setSelectedModel: React.Dispatch<React.SetStateAction<string>>;
  customModels  : any[] , 
  setCustomModels : React.Dispatch<React.SetStateAction<any[]>>;
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
  setTokens : () => {} ,
  isUsingGoogleAuth  : false  , 
  setIsUsingGoogleAuth : () => {}  
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [refreshHeader , setRefreshHeader ] = useState<boolean>(false) ; 
  const [paymentStatus , setPaymentStatus ] = useState<boolean>(false) ; 
  const [tokens , setTokens ] = useState(0) ;
  const [isUsingGoogleAuth , setIsUsingGoogleAuth] = useState(false) ;
  const [models, setModels] =  useState<string[]>(["grok", "openai"]);
  const [selectedModel, setSelectedModel] =  useState<string>(models[0] || "");
  const {loadCustomModels } = useCustomModel() ; 
  const {customModels , setCustomModels} = useState<any>([]);

  // models, setModels , selectedModel, setSelectedModel
  const navigate = useNavigate();

  useEffect(() => {
    console.log("use effect  tokens = " , tokens ) ; 
  } , [tokens ]  )   ;  


  useEffect(() => {

    ;(async () => {
      const customs = await loadCustomModels() ;
      console.log("models = " , customs ) ; 
      if(customs && customs?.length  > 0 )
      {
        console.log("customs = " , customs) ; 
        const customModelsName = customs.map(custom   => custom?.custom_model) 
        console.log("custom models only names = > " , customModelsName)
        setModels(prev => [
          ...prev , ...customModelsName 
        ])
      }
    })()

  } , [] ); 
  


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
  console.log("is this month record present ? ")
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
  console.log("inserting one month record ----------------")
  const { error: insertError } = await supabase.from(tableName).insert([
    {
        reach : 1,
        engagement : 2,
        post : 35,
        followers : 1,
        date: todayDate,
        platform : "twitter" ,
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


// const calledOnceRef = useRef(false);
// useEffect(() => {
//   if (!session || calledOnceRef.current) return;
//   calledOnceRef.current = true;

//   isThisMonthRecordPresentForInstagram("account_analytics");
//   isThisMonthRecordPresentForTwitter("account_analytics");
// }, [session]);


const createProfileIfNotExists = async (user : any ) => {
  console.log("create profile if not exists getting triggered ....");
  const { id, email, user_metadata } = user;
  console.log("------------------metadata------------------" , user ); 
  const fullName = user_metadata.full_name || user_metadata.name || '';

  // Check if profile already exists
  const { data: existing, error: fetchError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', id)
    .single();

  console.log("existing ------------------> " , existing) ; 

  if (!existing?.id) {
    console.log("inserting record --------> " , existing?.id) ;
    const { error: insertError } = await supabase
      .from('profiles')
      .insert([
        {
          id,
          email,
          full_name: fullName,
          avatar_url: user_metadata.picture || '',
          tokens: 100,
        },
      ]);
    

    if (insertError) {
      console.error('Error inserting profile:', insertError.message);
      
    }

    
    const profileData = {
      id,
      email,
      full_name: fullName,
      avatar_url: user_metadata.avatar_url || '',
      tokens: 100,
  }
  console.log("profile info ------------------------> "  , profileData) ;
  localStorage.setItem('profile', JSON.stringify(profileData));
};

}


  


useEffect(() => {
  let mounted = true;
  
  async function initialize() {
    try {
      // Start connection check and session fetch in parallel
      const connectionCheckPromise = checkSupabaseConnection();
      const sessionPromise = supabase.auth.getSession();
      
      // Wait for connection check first
      const isConnected = await connectionCheckPromise;
      if (!isConnected && mounted) {
        setConnectionError('Unable to connect to the database. Please ensure you are connected to Supabase and have a active internet connection.');
        setLoading(false);
        return;
      }
     
      const { data: { session } } = await sessionPromise;
      
      if (!mounted) return;
      setRefreshHeader((prev)=> !prev) ; 
      setSession(session);
      
     
      if (session) {
        try {
          let profile;
          const cachedProfile = localStorage.getItem('profile');
          if (cachedProfile) {
            profile = JSON.parse(cachedProfile);
            setRefreshHeader((prev)=> !prev) ; 
          } else {
            profile = await getProfile();
            localStorage.setItem('profile', JSON.stringify(profile));
            setRefreshHeader((prev)=> !prev) ; 
            
          }

          await isThisMonthRecordPresentForTwitter("account_analytics")
          
          if (!mounted) return;
 
          const isFirstTime = !profile.full_name;
          setIsFirstLogin(isFirstTime);
          
          if (isFirstTime) {
            navigate('/settings');
          }
        } catch (error) {
          console.error('Error checking profile:', error);
          // if (mounted) {
          //   setConnectionError('Error loading profile. Please try again.');
          // }
        }
      }
      if (mounted) setLoading(false);
      
    } catch (error) {
      console.error('Initialization error:', error);
      if (mounted) {
        setConnectionError('Failed to initialize the application. Please try again.');
        setLoading(false);
      }
    }
  }
  
  initialize();
  
  // Auth state subscription
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      // createProfileIfNotExists(session.user);
    }
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


useEffect(() => {
  console.log("signing with google  =  " , isUsingGoogleAuth) ;
} , [isUsingGoogleAuth]); 

useEffect(() => {

  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      try{

          createProfileIfNotExists(session.user);
      }
      catch(err) 
      {
        console.log(err) ; 
      }
    }
  });

  return () => {
    subscription.unsubscribe();
  }

})


  // useEffect(() => {
  //   if (!session) return;
  
  //   // isThisMonthRecordPresentForInstagram("account_analytics");
  //   // isThisMonthRecordPresentForTwitter("account_analytics");
  // }, [session]);

  return (
    <AuthContext.Provider value={{ session, loading, isFirstLogin, connectionError , refreshHeader , setRefreshHeader  , paymentStatus , setPaymentStatus  , tokens , setTokens , isUsingGoogleAuth , setIsUsingGoogleAuth ,  models, setModels , selectedModel, setSelectedModel}}>
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