import { supabase } from './supabase';
import { generateState } from './oauth';

const LINKEDIN_CLIENT_ID = '86a3riz1mqfqqi';
const LINKEDIN_CLIENT_SECRET = 'WPL_AP1.LxGCYcWO7Nk2qOYr.cbccfQ==';
const REDIRECT_URI = `${window.location.origin}/settings/callback/linkedin`;

// Store OAuth state in localStorage
function storeOAuthState(state: string) {
  localStorage.setItem('linkedin_oauth_state', state);
}

// Clear OAuth state from localStorage
function clearOAuthState() {
  localStorage.removeItem('linkedin_oauth_state');
}

// Initialize LinkedIn OAuth flow
export function initializeLinkedInAuth() {
  // Generate state
  const state = generateState();

  // Store state
  storeOAuthState(state);

  // Build authorization URL
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: LINKEDIN_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    state: state,
    scope: 'r_liteprofile r_emailaddress w_member_social'
  });

  // Redirect to LinkedIn's authorization endpoint
  window.location.href = `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
}

// Handle OAuth callback
export async function handleLinkedInCallback(code: string, returnedState: string) {
  // Verify state matches
  const storedState = localStorage.getItem('linkedin_oauth_state');
  if (!storedState || storedState !== returnedState) {
    throw new Error('Invalid OAuth state');
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
        client_id: LINKEDIN_CLIENT_ID,
        client_secret: LINKEDIN_CLIENT_SECRET
      })
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json();
      throw new Error(error.error_description || 'Failed to exchange code for tokens');
    }

    const tokens = await tokenResponse.json();
    console.log(tokens);

    // Get user info
    const userResponse = await fetch('https://api.linkedin.com/v2/me?projection=(id,localizedFirstName,localizedLastName,profilePicture(displayImage~:playableStreams))', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`
      }
    });

    if (!userResponse.ok) {
      throw new Error('Failed to get user info');
    }

    const userData = await userResponse.json();

    // Get email address
    const emailResponse = await fetch('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`
      }
    });

    if (!emailResponse.ok) {
      throw new Error('Failed to get email info');
    }

    const emailData = await emailResponse.json();
    const email = emailData.elements[0]['handle~'].emailAddress;

    // Get the current user's ID from Supabase
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user found');

    // Save connection to database
    const { error: dbError } = await supabase.from('social_accounts').insert({
      profile_id: user.id,
      platform: 'linkedin',
      username: `${userData.localizedFirstName} ${userData.localizedLastName}`,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token
    });

    if (dbError) throw dbError;

    // Clear OAuth state
    clearOAuthState();

    return userData;
  } catch (error) {
    clearOAuthState();
    throw error;
  }
}