import { supabase } from './supabase';
import { generateState, generateCodeVerifier, generateCodeChallenge } from './oauth';

// const TWITTER_CLIENT_ID = 'Y2RKeWJ2T1hzQ3dxNnBuT3BCUVI6MTpjaQ';
// const TWITTER_CLIENT_SECRET = 'MP0G4dsn7efJqahuJL2HsEm9L9eUBcHtCsLJLVHPF-t9qVMe9Q';
// const REDIRECT_URI = `http://localhost:5173/callback/twitter`;

const TWITTER_CLIENT_ID = 'RU5fRHA4eU4yNGFIWFAxXy1vRHY6MTpjaQ';
const TWITTER_CLIENT_SECRET = 'FAQL-iZ6_0cGjjVEIrF2xqFtJv3lBbBhZkocclY8lZyUAkXee2';
const REDIRECT_URI = `http://localhost:5173/callback/twitter`;
// Store OAuth state and PKCE values in localStorage
function storeOAuthState(state: string, codeVerifier: string) {
  localStorage.setItem('twitter_oauth_state', state);
  localStorage.setItem('twitter_code_verifier', codeVerifier);
}
// Clear OAuth state from localStorage
function clearOAuthState() {
  localStorage.removeItem('twitter_oauth_state');
  localStorage.removeItem('twitter_code_verifier');
}

// Initialize Twitter OAuth flow
export async function initializeTwitterAuth() {
 
  // Generate PKCE values
  const state = generateState();
  console.log("state = " , state) ;
  const codeVerifier =   generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  // Store state and code verifier
  storeOAuthState(state, codeVerifier);

  // Build authorization URL
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: TWITTER_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    // making tweet.write 
    scope: 'tweet.read users.read like.write tweet.write offline.access',
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256'
  });
  console.log(params.toString() );

  // Redirect to Twitter's authorization endpoint
  window.location.href = `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
}

// Handle OAuth callback
export async function handleTwitterCallback(code: string, returnedState: string) {
  // Verify state matches
  const storedState = localStorage.getItem('twitter_oauth_state');
  if (!storedState || storedState !== returnedState) {
    throw new Error('Invalid OAuth state');
  }

  // Get stored code verifier
  const codeVerifier = localStorage.getItem('twitter_code_verifier');
  if (!codeVerifier) {
    throw new Error('Code verifier not found');
  }

  try {
    // Exchange code for tokens
    console.log("code = " , code);
    console.log("code verifier = " , codeVerifier);
    const tokenResponse = await fetch('http://localhost:3000/twitter/oauth/token', {
      method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      code_verifier: codeVerifier,
  }),
    });
    // console.log("token response = " , await tokenResponse.json() );

    // if (!tokenResponse.ok) {
    //   const error = await tokenResponse.json();
    //   throw new Error(error.error_description || 'Failed to exchange code for tokens');
    // }
// 
    const tokens = await tokenResponse.json();
    console.log(tokens);

   
    // get user info 
    const userResponse = await fetch('http://localhost:3000/twitter/users/me', {
      method: 'GET',
      headers: {
        access_token: tokens.access_token,
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to get user info');
    }

    const userData = await userResponse.json();
    console.log("twitter response = " , userData) ; 

    // Get the current user's ID from Supabase
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user found');

    // Save connection to database
    const { error: dbError } = await supabase.from('social_accounts').insert({
      profile_id: user.id,
      platform: 'twitter',
      username: userData.data.username,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      userId : userData?.data?.id
    });

    if (dbError) throw dbError;
    // Clear OAuth state
    // clearOAuthState();

    return userData.data;
  } catch (error) {
    clearOAuthState();
    throw error;
  }
}

