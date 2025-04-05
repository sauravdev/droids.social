import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader } from 'lucide-react';
import { handleTwitterCallback } from '../../lib/twitter';
import { supabase } from '../../lib/supabase';
import { BACKEND_APIPATH } from '../../constants';

export function TwitterCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const getAccessToken = async (oauth_token : string  ,oauth_verifier : string   ) => {
  
  
    if (!oauth_token || !oauth_verifier) {
      console.error('Missing oauth_token or oauth_verifier');
      return;
    }
  
    try {
      const response = await fetch(`${BACKEND_APIPATH.BASEURL}/api/getAccessToken`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ oauth_token, oauth_verifier }),
      });
      const data = await response.json();
      
      if (data.access_token && data.access_token_secret) {
        console.log('Access Token:', data.access_token);
        console.log('Access Token Secret:', data.access_token_secret);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No authenticated user found');
        const { error: dbError } = await supabase.from('social_accounts').insert({
                profile_id: user.id,
                platform: 'twitter',
                username: '',
                access_token:  data.access_token,
                refresh_token: data.access_token_secret,
                userId : ''
              });
              if (dbError) throw dbError;
        // Use these tokens for further API calls
      } else {
        console.error('Failed to get access token:', data.error);
      }
    } catch (error) {
      console.error('Error calling getAccessToken API:', error);
    }
  };

  useEffect(() => {
    // async function handleCallback() {
    //   try {
    //     const code = searchParams.get('code');
    //     const state = searchParams.get('state');

    //     if (!code || !state) {
    //       throw new Error('Missing required parameters');
    //     }

    //     await handleTwitterCallback(code, state);
    //     // navigating  to the profile settings page 
    //     navigate('/settings', { 
    //       replace: true,
    //       state: { message: 'Twitter account connected successfully!' }
    //     });
    //   } catch (err: any) {
    //     setError(err.message);
    //   }
    // }

    // handleCallback();

    const oauth_token = searchParams.get('oauth_token'); 
    const oauth_verifier = searchParams.get('oauth_verifier') ; 
    if(oauth_token && oauth_verifier) 
    {
      getAccessToken(oauth_token , oauth_verifier )
      navigate('/') ;

    }
    // console.log("search params = " , searchParams.get()) ;
    // navigate('/') ;
  }, [searchParams, navigate]);

  // if (error) {
  //   return (
  //     <div className="min-h-screen bg-gray-900 flex items-center justify-center">
  //       <div className="bg-red-900 text-white px-4 py-2 rounded-md">
  //         Error connecting Twitter account: {error}
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <Loader className="h-8 w-8 animate-spin text-purple-500 mx-auto" />
        <p className="mt-4 text-white">Connecting your Twitter account...</p>
      </div>
    </div>
  );
}