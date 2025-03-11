import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from './supabase';
import { useNavigate } from "react-router-dom";
import { BACKEND_APIPATH, REDIRECT_URIS } from "../constants";
const loginWithInstagram = () => {
  localStorage.removeItem("code");
  localStorage.removeItem("instagram_access_token") ;
  const authUrl = `https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=1074024207741727&redirect_uri=${REDIRECT_URIS.INSTAGRAM}&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish%2Cinstagram_business_manage_insights`;
  window.location.href = authUrl;
};
const InstagramAuth: React.FC = () => {
  const navigateTo = useNavigate();
  const [userAccessToken, setUserAccessToken] = useState<string | null>(null);
  const [instagramAccount, setInstagramAccount] = useState<any>(null);
  const [instagramCode  ,setInstragramCode] = useState<string | null > (null)  ;
  const [searchParams] = useSearchParams();
  const fetchAccessToken = async (code: string) => {
    try {
      const response = await fetch(
        `${BACKEND_APIPATH.BASEURL}/auth/instagram/token`,
        { headers: { 'Content-Type': 'application/json' }, method: "POST" , body  : JSON.stringify({code}) }
      );
      
      const {access_token} = await response.json();
      console.log("access_token = " , access_token); 
      console.log("token response (instagram ) " , access_token ) ;
      setUserAccessToken(access_token);
      localStorage.setItem("instagram_access_token", access_token);
    } catch (error) {
      console.error("Error fetching access token:", error);
    }
  };

  // Function to fetch connected Instagram Business Account
  const fetchInstagramAccount = async () => {
    try {
      const response = await fetch(
        `${BACKEND_APIPATH.BASEURL}/auth/instagram/user/${localStorage.getItem("instagram_access_token")}` ,
      ) 
      const data = await response.json();
      console.log("instagram response = " , response) ; 
      const {username  , id }= data ; 
      setInstagramAccount(data);

      const { data: { user } } = await supabase.auth.getUser();
      console.log("data = "  , user ) ;  
      //  Save instagram  connection to database
      const { error: dbError } = await supabase.from('social_accounts').insert({
      profile_id: user?.id,
      platform: 'instagram',
      username: username,
      access_token: localStorage.getItem("instagram_access_token"),
      refresh_token:localStorage.getItem("instagram_access_token") , 
      userId : id 
    });
    navigateTo("/dashboard");
    // if (dbError) throw dbError;
    } catch (error) {
      console.error("Error fetching Instagram account:", error);
    }
  };
 
  useEffect(() => {
    const code = searchParams.get("code");
    if (code && !localStorage.getItem("code") ) {
      setInstragramCode(code) ;
      localStorage.setItem("code" , code ) ; 
      fetchAccessToken(code);
    }
  }, [searchParams]);
  useEffect(() => {
    if (localStorage.getItem("instagram_access_token")) {
      fetchInstagramAccount();
    }
  }, [userAccessToken]);

  return (
   <></>
  );
};

export  {InstagramAuth , loginWithInstagram  }; 
