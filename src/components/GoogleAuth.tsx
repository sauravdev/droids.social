import React from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { BACKEND_APIPATH ,GOOGLE_CLIENT_ID } from '../constants';
import { useNavigate } from 'react-router-dom';
const GoogleAuth = () => {
    const navigate  = useNavigate() ; 
  const handleSuccess = async (credentialResponse : any ) => {
    try {
      const response = await axios.post(`${BACKEND_APIPATH.BASEURL}/auth/google`, {
        token: credentialResponse.credential
      });
      console.log("GOOGLE RESPONSE = " , response.data);
      if(response?.data?.token) 
      {
        localStorage.setItem('googleToken' , response?.data?.token ) ; 
        navigate('/dashboard');
      }
    } catch (error : any ) {
        if(error?.status == 401) 
        {
            // handle unauth errors
            navigate('/login'); 
            console.log("Unauthorized!!"); 
        }
      console.error('Error:', error);
    }
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => console.log('Login Failed')}
      />
    </GoogleOAuthProvider>
  );
};

export default GoogleAuth;
