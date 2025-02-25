import { supabase } from './supabase';
import type { Database } from './types';

type Tables = Database['public']['Tables'];

// Profile Management
export async function getProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No user found');

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) throw error;
  
  // If no profile exists, create one
  if (!profile) {
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert([
        {
          id: user.id,
          email: user.email,
          full_name: null,
        },
      ])
      .select()
      .single();

    if (createError) throw createError;
    return newProfile;
  }

  return profile;
}
export async function updateProfile(profile: Partial<Tables['profiles']['Update']>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No user found');

  const { data, error } = await supabase
    .from('profiles')
    .update(profile)
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}



// Profile Settings Management
export async function getProfileSettings() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No user found');

  // First try to get existing settings
  const { data: settings, error } = await supabase
    .from('profile_settings')
    .select('*')
    .eq('profile_id', user.id)
    .maybeSingle();

  if (!settings && !error) {
    // If no settings exist, create new ones
    const { data: newSettings, error: createError } = await supabase
      .from('profile_settings')
      .insert([{
        profile_id: user.id,
        timezone: 'UTC',
        default_platforms: ['twitter', 'linkedin', 'instagram'],
        notification_preferences: {
          email: true,
          push: true
        }
      }])
      .select()
      .single();

    if (createError) throw createError;
    return newSettings;
  }

  if (error) throw error;
  return settings;
}

export async function updateProfileSettings(settings: Partial<Tables['profile_settings']['Update']>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No user found');

  const { data, error } = await supabase
    .from('profile_settings')
    .update(settings)
    .eq('profile_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Social Accounts Management
export async function getSocialAccounts() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No user found');

  const { data: accounts, error } = await supabase
    .from('social_accounts')
    .select('*')
    .eq('profile_id', user.id);

  if (error) throw error;
  return accounts;
}
export async function getSocialMediaAccountInfo(platform : string ) 
{
  const {data : {user}} = await supabase.auth.getUser() ; 
  if(!user) throw new Error("No user found") ; 

  const {data : accountInfo  , error } =   await supabase
  .from('social_accounts')
  .select("*")
  .eq("profile_id" , user?.id) 
  .eq('platform' , platform)
  .single() 

  if(error)  throw error ;
  return accountInfo ; 

}

export async function linkSocialAccount(account: Omit<Tables['social_accounts']['Insert'], 'profile_id'>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No user found');

  const { data, error } = await supabase
    .from('social_accounts')
    .insert([{ ...account, profile_id: user.id }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function unlinkSocialAccount(platform: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No user found');

  const { error } = await supabase
    .from('social_accounts')
    .delete()
    .eq('profile_id', user.id)
    .eq('platform', platform);

  if (error) throw error;
}

// Scheduled Posts Management
export async function getScheduledPosts() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No user found');

  const { data: posts, error } = await supabase
    .from('scheduled_posts')
    .select('*')
    .eq('profile_id', user.id)
    .order('scheduled_for', { ascending: true });

  if (error) throw error;
  return posts;
}

export async function createScheduledPost(post: Omit<Tables['scheduled_posts']['Insert'], 'profile_id'>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No user found');

  const { data, error } = await supabase
    .from('scheduled_posts')
    .insert([{ ...post, profile_id: user.id }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateScheduledPost(id: string, updates: Partial<Tables['scheduled_posts']['Update']>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No user found');

  const { data, error } = await supabase
    .from('scheduled_posts')
    .update(updates)
    .eq('id', id)
    .eq('profile_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteScheduledPost(id: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No user found');

  const { error } = await supabase
    .from('scheduled_posts')
    .delete()
    .eq('id', id)
    .eq('profile_id', user.id);

  if (error) throw error;
}

// Content Strategy Management
export async function getContentStrategies() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No user found');

  const { data: strategies, error } = await supabase
    .from('content_strategies')
    .select('*')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return strategies;
}

export async function saveContentStrategy(strategy: Omit<Tables['content_strategies']['Insert'], 'profile_id'>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No user found');

  const { data, error } = await supabase
    .from('content_strategies')
    .insert([{ ...strategy, profile_id: user.id }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Content Plan Management
export async function getContentPlans() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No user found');

  const { data: plans, error } = await supabase
    .from('content_plans')
    .select('*')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return plans;
}

export async function saveContentPlan(plan: Omit<Tables['content_plans']['Insert'], 'profile_id'>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No user found');

  const { data, error } = await supabase
    .from('content_plans')
    .insert([{ ...plan, profile_id: user.id }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateContentPlan(id: string, updates: Partial<Tables['content_plans']['Update']>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No user found');

  const { data, error } = await supabase
    .from('content_plans')
    .update(updates)
    .eq('id', id)
    .eq('profile_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}