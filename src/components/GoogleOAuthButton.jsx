import React from "react";
import GoogleLogo from '../assets/google.png'; 

export function  GoogleOAuthButton()  {
    return <div className='flex items-center justify-center gap-2 bg-gray-200 text-slate-900 px-4 py-2 rounded-md text-sm '>
    <img className='h-4 w-4' src= {GoogleLogo}/>
  <button type = "button" className='   text-sm ' >SIGN IN WITH GOOGLE</button>
  </div>

}


