import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please connect to Supabase using the "Connect to Supabase" button.');
}

const MAX_RETRIES = 1;
const RETRY_DELAY = 250;

// Custom fetch with retry logic
async function fetchWithRetry(...args: Parameters<typeof fetch>): Promise<Response> {
  
  let lastError: Error | null = null;
  
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const response = await fetch(...args);

      if(response.status == 422) 
      {
        console.log("response = " , response)  ; 
        throw new Error(`User with this email already exists`);
      }
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response;
    } catch (err) {
      lastError = err as Error;
      console.warn(`Fetch attempt ${i + 1} failed, retrying in ${RETRY_DELAY}ms...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }
  
  throw lastError;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'x-client-info': 'socialdroids-ai'
    },
    fetch: async (...args) => {
      try {
        
        return await fetchWithRetry(...args);
      } catch (err) {
        console.error('Supabase fetch error:', err);
        throw new Error("Network error");
      }
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Connection check with retry
export async function checkSupabaseConnection() {
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
      if (error) throw error;
      console.log('Supabase connection established');
      return true;
    } catch (err) {
      console.warn(`Connection attempt ${i + 1} failed, retrying in ${RETRY_DELAY}ms...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }
  console.error('Failed to establish Supabase connection after multiple attempts');
  return false;
}

// Health check function
export async function checkSupabaseHealth() {
  console.log("supabase health check function called !!!") ; 
  try {
    const start = Date.now();
    const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    const latency = Date.now() - start;
    
    return {
      isHealthy: !error,
      latency,
      error: error ? error.message : null
    };
  } catch (err) {
    return {
      isHealthy: false,
      latency: 0,
      error: err instanceof Error ? err.message : 'Unknown error'
    };
  }
}