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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center">
              <Bot className="h-8 w-8 text-purple-500" />
              <span className="ml-2 text-xl font-bold text-white">socialdroids.ai</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">

              {/* Navbar */}
              <button
                ref={buttonRef}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center space-x-2 text-gray-300 hover:text-white focus:outline-none"
              >
                <div className='flex gap-1 items-center mx-4 '>
                  <p className='capitalize text-[1rem] font-medium '>Tokens : </p>
                  <div className='flex gap-1 items-center  '>
                  <img className='h-4 w-4' src = {coin}/>
                    <p>{profile?.tokens}</p>
                  </div>                  
                </div>
                <img
                  src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.full_name || 'User'}&background=7C3AED&color=fff`}
                  alt={profile?.full_name || 'User'}
                  className="w-8 h-8 rounded-full"
                />
                <span>{profile?.full_name || 'User'}</span>
              </button>
              
              {isMenuOpen && (
                <div
                  ref={menuRef}
                  className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-md shadow-lg py-1 z-50"
                >
                  
                  <Link
                    to="/settings"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-600"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-600"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
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