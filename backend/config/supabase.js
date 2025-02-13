import { createClient } from '@supabase/supabase-js';
const SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpremRxbGRwenZqZWZ0eGJ6Z3ZoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjc3NjM4NCwiZXhwIjoyMDUyMzUyMzg0fQ.ESIPitaSDPqba0jN2Cney-v0_dmoWdhw6mvriGK7fJI"
const SUPABASE_URL="https://zkzdqldpzvjeftxbzgvh.supabase.co"
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; 
async function fetchWithRetry(...args)  {
    let lastError = null;
    
    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        const response = await fetch(...args);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response;
      } catch (err) {
        lastError = err  ;
        console.warn(`Fetch attempt ${i + 1} failed, retrying in ${RETRY_DELAY}ms...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
    }
    
    throw lastError;
  }

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
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
          throw err;
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


  async function testConnection() {
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    if (error) {
        console.log("Supbase connection error : " , error ) 
        return null ; 
    } else {
        return data ; 
    }
}
export {supabase , testConnection} ;


