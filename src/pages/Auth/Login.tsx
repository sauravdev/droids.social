import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bot } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AuthLayout } from '../../components/AuthLayout';
import GoogleLogo from '../../assets/google.png'; 
import { GOOGLE_CLIENT_ID } from '../../constants';
import { useAuth } from '../../context/AuthContext';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const {setIsUsingGoogleAuth} = useAuth(); 

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    // Reset error
    setError('');

    // Validate email
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return false;
    }

    // Validate password
    if (!password) {
      setError('Password is required');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    return true;
  };

  const handleGoogleAuthentication = async () => {
    setIsUsingGoogleAuth(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://droids.social/' // change this to your desired redirect URL
        }
      });
    
      if (error) {
        setError('Google authentication failed. Please try again.');
        console.error('Error logging in:', error.message);
      }
    } catch (error) {
      setError('An unexpected error occurred during Google sign in.');
      console.error('Google auth error:', error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.__isAuthError) {
          if (error.message.includes('Invalid login credentials')) {
            setError("Invalid email or password. Please check your credentials and try again.");
          } else if (error.message.includes('Email not confirmed')) {
            setError("Please check your email and click the confirmation link before signing in.");
          } else if (error.message.includes('Too many requests')) {
            setError("Too many login attempts. Please wait a moment and try again.");
          } else {
            setError("Invalid credentials. Please try again.");
          }
        } else {
          setError(error.message);
        }
        return;
      }

      navigate('/dashboard');
    } catch (err) {
      if (err?.__isAuthError) {
        setError("Invalid credentials. Please try again.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Bot className="h-12 w-12 text-purple-500" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white">Sign in to your account</h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          Or{' '}
          <Link to="/signup" className="font-medium text-purple-500 hover:text-purple-400">
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-900 text-white px-4 py-2 rounded-md text-sm border border-red-700">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email address
              </label>
              <div className="mt-1">
                <input
                  maxLength={50}
              
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-700 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 bg-gray-700 text-white sm:text-sm"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Password
              </label>
              <div className="mt-1">
                <input
                  maxLength={70}
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-700 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 bg-gray-700 text-white sm:text-sm"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <div className='text-gray-200 w-full text-center'>OR</div>
            <div className='flex items-center justify-center gap-2 bg-gray-200 text-slate-900 px-4 py-2 rounded-md text-sm '>
              <img className='h-4 w-4' src={GoogleLogo} alt="Google"/>
              <button onClick={handleGoogleAuthentication} type="button" className='text-sm'>
                SIGN IN WITH GOOGLE
              </button>
            </div>
           
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AuthLayout>
  );
}

export default Login;