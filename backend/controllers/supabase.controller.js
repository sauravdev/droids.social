import { supabase } from '../config/supabase.js';
async function checkIfUserExists(email) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id') 
      .eq('email', email)
      .limit(1) 
      .single() 
    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return false
      } else {
        console.error('Query error:', error)
        return false
      }
    }
    return true; 
  }


async function createUserIfNotExists(email , full_name , avartar_url  ) {
    const {data ,  error } = await supabase
              .from('profiles')
              .insert([
                {
                  id: data.user.id,
                  email,
                  full_name ,
                  avartar_url , 
                  tokens : 100
                },
              ]);
            if (error) throw error;

    return data; 
}


const updateContentPlan = async (userId  , planId , updates ) => {
   const { data, error } = await supabase
      .from('content_plans')
      .update(updates)
      .eq('id', planId)
      .eq('profile_id', userId)
      .select()
      .single();
  
    if (error) throw error;
    return data;
}




export {checkIfUserExists , updateContentPlan } ;


