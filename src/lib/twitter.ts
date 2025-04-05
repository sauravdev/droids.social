import { supabase } from './supabase';
import { generateState, generateCodeVerifier, generateCodeChallenge } from './oauth';
import { BACKEND_APIPATH } from '../constants';
import { REDIRECT_URIS , TWITTER_CREDENTIALS} from '../constants';
// const TWITTER_CLIENT_ID = 'Y2RKeWJ2T1hzQ3dxNnBuT3BCUVI6MTpjaQ';
// const TWITTER_CLIENT_SECRET = 'MP0G4dsn7efJqahuJL2HsEm9L9eUBcHtCsLJLVHPF-t9qVMe9Q';
// const REDIRECT_URI = `http://localhost:5173/callback/twitter`;

// jayant sir
const TWITTER_CLIENT_ID = TWITTER_CREDENTIALS.TWITTER_CLIENT_ID;
const REDIRECT_URI = REDIRECT_URIS.TWITTER;

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


const getRequestToken = async () => {
  try {
    const response = await fetch(`${BACKEND_APIPATH.BASEURL}/api/getRequestToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    console.log("twitter oauth response = " , data) ; 
    if (data.authorization_url) {
      // Redirect the user to Twitter's authorization page
      window.location.href = data.authorization_url;

    } else {
      console.error('Failed to get request token:', data.error);
    }
  } catch (error) {
    console.error('Error calling getRequestToken API:', error);
  }
};
// Initialize Twitter OAuth flow
export async function initializeTwitterAuth() {
  await getRequestToken() ; 
  
  // clearOAuthState() ; 
  // // Generate PKCE values
  // const state = generateState();
  // console.log("state = " , state) ;
  // const codeVerifier =   generateCodeVerifier();
  // const codeChallenge = await generateCodeChallenge(codeVerifier);
  // storeOAuthState(state, codeVerifier);
  // const params = new URLSearchParams({
  //   response_type: 'code',
  //   client_id: TWITTER_CLIENT_ID, 
  //   redirect_uri: REDIRECT_URI,
  //   scope: 'tweet.read users.read like.write tweet.write offline.access',
  //   state: state,
  //   code_challenge: codeChallenge,
  //   code_challenge_method: 'S256'
  // });
  // console.log(params.toString() );
  // window.location.href = `https://twitter.com/i/oauth2/authorize?${params.toString()}`;


}


export async function handleTwitterCallback(code: string, returnedState: string) {
  console.log("twitter callback ......")
  // Verify state matches
  // const storedState = localStorage.getItem('twitter_oauth_state');
  // if (!storedState || storedState !== returnedState) {
  //   throw new Error('Invalid OAuth state');
  // }

  // // Get stored code verifier
  // const codeVerifier = localStorage.getItem('twitter_code_verifier');
  // if (!codeVerifier) {
  //   throw new Error('Code verifier not found');
  // }

  // try {
  //   // Exchange code for tokens
  //   console.log("code = " , code);
  //   console.log("code verifier = " , codeVerifier);
  //   const tokenResponse = await fetch(`${BACKEND_APIPATH.BASEURL}/twitter/oauth/token`, {
  //     method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     code,
  //     code_verifier: localStorage.getItem('twitter_code_verifier')
  // }),
  //   });

  //   const tokens = await tokenResponse.json();
  //   console.log("tokens = " , tokens ) ;
   
  //   const body = JSON.stringify({access_token : tokens?.access_token}) 
  //     const userResponse = await fetch(`${BACKEND_APIPATH.BASEURL}/twitter/users/me`, {
  //       method: 'POST',
  //       body , 
  //       headers: {
  //         "Content-Type": "application/json"
  //       },
  //     });
  //     if (!userResponse.ok) {
  //       throw new Error('Failed to get user info');
  //     }
  
  //     const userData = await userResponse.json();
  //     console.log("twitter response = " , userData) ; 
  
  //     // Get the current user's ID from Supabase
  //     const { data: { user } } = await supabase.auth.getUser();
  //     if (!user) throw new Error('No authenticated user found');
  
  //     // Save connection to database
  //     const { error: dbError } = await supabase.from('social_accounts').insert({
  //       profile_id: user.id,
  //       platform: 'twitter',
  //       username: userData.data.username,
  //       access_token: tokens.access_token,
  //       refresh_token: tokens.refresh_token,
  //       userId : userData?.data?.id
  //     });
  
  //     if (dbError) throw dbError;
  //     // Clear OAuth state
  //     // clearOAuthState();
  //     return userData.data;
    
   
  // } catch (error) {
  //   clearOAuthState();
  //   throw error;
  // }
}

