import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bot, LogOut, Settings, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useProfile } from '../hooks/useProfile';
import coin from '../assets/dollar.png';
import { useAuth } from '../context/AuthContext';
import { getProfile } from '../lib/api';


export function Header() {
  const navigate = useNavigate();
  // const [profile , setProfile] = useState<any>(null) ; 
  const {profile} = useProfile() ; 
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const {refreshHeader , setIsUsingGoogleAuth } = useAuth() ; 

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsUsingGoogleAuth(false) ; 
    try {
      await supabase.auth.signOut();
      localStorage.clear() ;
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  useEffect(() => {
    console.log("header component  refreshed"); 
  } , [refreshHeader] ) 

  return (
    <header className="bg-gray-800 border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center min-w-0">
            <Link to="/dashboard" className="flex items-center">
              <Bot className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500 flex-shrink-0" />
              <span className="ml-1 sm:ml-2 text-sm sm:text-xl font-bold text-white truncate">
                <span className="hidden xs:inline">socialdroids.ai</span>
                <span className="xs:hidden">socialdroids</span>
              </span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
            <div className="relative">

              {/* Navbar */}
              <button
                ref={buttonRef}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center space-x-1 sm:space-x-2 text-gray-300 hover:text-white focus:outline-none min-w-0"
              >
                {/* Tokens - Hidden on very small screens */}
                <div className='hidden sm:flex gap-1 items-center mx-2 sm:mx-4'>
                  <p className='capitalize text-sm sm:text-[1rem] font-medium'>Tokens : </p>
                  <div className='flex gap-1 items-center'>
                    <img className='h-3 w-3 sm:h-4 sm:w-4' src = {coin}/>
                    <p className='text-sm sm:text-base'>{profile?.tokens}</p>
                  </div>                  
                </div>
                
                {/* Mobile tokens display */}
                <div className='flex sm:hidden gap-1 items-center'>
                  <img className='h-3 w-3' src = {coin}/>
                  <p className='text-xs'>{profile?.tokens}</p>
                </div>

                <img
                  src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.full_name || 'User'}&background=7C3AED&color=fff`}
                  alt={profile?.full_name || 'User'}
                  className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex-shrink-0"
                />
                
                {/* Username - Hidden on small screens */}
                <span title = {profile?.full_name || "User" } className="hidden md:block text-sm lg:text-base truncate max-w-24 lg:max-w-none">
                  {profile?.full_name?.length > 10 ? profile?.full_name?.slice(0,10) + "..."  :  profile?.full_name || 'User'}
                </span>
              </button>
              
              {isMenuOpen && (
                <div
                  ref={menuRef}
                  className="absolute right-0 mt-2 w-44 sm:w-48 bg-gray-700 rounded-md shadow-lg py-1 z-50"
                >
                  {/* Mobile-only tokens display in dropdown */}
                  <div className="sm:hidden px-4 py-2 border-b border-gray-600">
                    <div className='flex gap-1 items-center justify-center'>
                      <p className='capitalize text-sm font-medium text-gray-300'>Tokens: </p>
                      <div className='flex gap-1 items-center'>
                        <img className='h-3 w-3' src = {coin}/>
                        <p className='text-sm text-gray-300'>{profile?.tokens}</p>
                      </div>                  
                    </div>
                  </div>

                  {/* Mobile-only username display */}
                  <div className="md:hidden px-4 py-2 border-b border-gray-600">
                    <p className="text-sm text-gray-300 truncate">
                      {profile?.full_name || 'User'}
                    </p>
                  </div>
                  
                  <Link
                    to="/settings"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-600"
                  >
                    <Settings className="w-4 h-4 mr-2 flex-shrink-0" />
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-600"
                  >
                    <LogOut className="w-4 h-4 mr-2 flex-shrink-0" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}