import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from './supabase';
import { useNavigate } from'react-router-dom';
import { BACKEND_APIPATH } from '../constants';

const handleLogin = () => {
  localStorage.removeItem("linkedIn_access_token");
  localStorage.removeItem("code") 
  const clientId = '77zwm3li56ua2a';
  const redirectUri = 'http://127.0.0.1:5173/linkedin/callback/auth/linkedIn';
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri:  redirectUri ,
    scope: 'openid profile w_member_social email', 
  });
  const linkedinAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  window.location.href = linkedinAuthUrl; 
};
const LinkedInAuth = () => {
  const [authCode, setAuthCode] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null); // Store user info
  const [idToken , setIdToken] = useState<string | null>(null) ; 
  const navigateTo = useNavigate() ; 
  const [searchParams]  =  useSearchParams()  ; 

  const exchangeAuthCodeForToken = async (code: string) => {
    try {
        const response = await fetch(
          `${BACKEND_APIPATH.BASEURL}/auth/linkedIn/token`,
          { headers: { 'Content-Type': 'application/json' }, method: "POST" , body  : JSON.stringify({code}) }
        );
        const data = await response.json();
        console.log("token response (linkedIn ) " , data ) ;
          localStorage.setItem("linkedIn_access_token", data.access_token);
          setAccessToken(data.access_token);
          setIdToken(data.id_token);
      } catch (error) {
        console.error("Error fetching access token:", error);
      }
  };
 
  const fetchUserInfo = async () => {
   
    
    try{
        const response  =  await fetch(`${BACKEND_APIPATH.BASEURL}/auth/linkedIn/user/${accessToken}`) ;
        const data = await response.json() ; 
        setUserInfo(data);
        console.log("data" , data );
        // make insertion in database 
        const { data: { user } } = await supabase.auth.getUser();
        console.log("data = "  , user ) ;  
        const { error: dbError } = await supabase.from('social_accounts').insert({
        profile_id: user?.id,
        platform: 'linkedin',
        username: data?.name , 
        access_token: localStorage.getItem("linkedIn_access_token"),
        refresh_token:localStorage.getItem("linkedIn_access_token") ,  
        userId : data?.sub
        }); 
        if(dbError) 
        {
          throw new Error(`Error fetching info from database = ${dbError}` )
        }
    }
    catch(error) 
    {
        console.error("Error fetching user information=" , error) ; 
    }
    finally{
      navigateTo('/'); 
    }
  };
  useEffect(() => {
    const code = searchParams.get('code');
    if (code && !localStorage.getItem("code") ) {
      localStorage.setItem("code" ,code) ;
      setAuthCode(code);
      exchangeAuthCodeForToken(code);
    }
  }, [searchParams]);
  useEffect(() => {
    if (accessToken && localStorage.getItem("linkedIn_access_token") !== undefined) {
      fetchUserInfo();
    }
  }, [accessToken]);

  return (
   <></>
  );
};

export  {LinkedInAuth , handleLogin};
