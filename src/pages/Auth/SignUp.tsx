import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bot } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AuthLayout } from '../../components/AuthLayout';
import GoogleLogo from '../../assets/google.png'; 
import { GOOGLE_CLIENT_ID } from '../../constants';
import { useAuth } from '../../context/AuthContext';

export function SignUp() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const {setIsUsingGoogleAuth} = useAuth(); 

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  };

  const validateFullName = (name) => {
    // At least 2 characters, only letters and spaces
    const nameRegex = /^[a-zA-Z\s]{2,}$/;
    return nameRegex.test(name.trim());
  };

  const validateForm = () => {
    // Reset error
    setError('');

    // Validate full name
    if (!fullName.trim()) {
      setError('Full name is required');
      return false;
    }
    if (!validateFullName(fullName)) {
      setError('Full name must be at least 2 characters long and contain only letters and spaces');
      return false;
    }

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
    if (!validatePassword(password)) {
      setError('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number');
      return false;
    }

    return true;
  };

  const handleGoogleAuthentication = async () => {
    setIsUsingGoogleAuth(true);
    try {
      const { error, data } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://droids.social/' // change this to your desired redirect URL
        }
      });
      
      if (error) {
        setError('Google authentication failed. Please try again.');
        console.error('Error logging in:', error?.message);
      }

      if (data.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              email: data.user.email,
              full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || '',
              avatar_url: data.user.user_metadata?.avatar_url || '',
              tokens: 100
            },
          ]);

        if (profileError) {
          setError('Failed to create user profile. Please try again.');
          console.error('Profile creation error:', profileError);
        }
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
      console.log(error); 
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { error: signUpError, data } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('An account with this email already exists. Please try logging in instead.');
        } else if (signUpError.message.includes('Password')) {
          setError('Password does not meet security requirements');
        } else {
          setError(signUpError.message);
        }
        return;
      }

      if (data.user) {
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              email: email.trim(),
              full_name: fullName.trim(),
              avatar_url: '',
              tokens: 100
            },
          ]);

        if (profileError) {
          setError('Account created but profile setup failed. Please contact support.');
          console.error('Profile creation error:', profileError);
          return;
        }
      }

      navigate('/dashboard');
    } catch (err) {
     
      setError('An unexpected error occurred. Please try again.');
      console.error('Signup error:', err);
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
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white">Create your account</h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-purple-500 hover:text-purple-400">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSignUp}>
            {error && (
              <div className="bg-red-900 text-white px-4 py-2 rounded-md text-sm border border-red-700">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-300">
                Full Name
              </label>
              <div className="mt-1">
                <input
                  maxLength={20}
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-700 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 bg-gray-700 text-white sm:text-sm"
                  placeholder="Enter your full name"
                />
              </div>
            </div>
            
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
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-700 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 bg-gray-700 text-white sm:text-sm"
                  placeholder="Enter your password"
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Password must be at least 8 characters with uppercase, lowercase, and number
              </p>
            </div>

            <div className='text-gray-200 w-full text-center'>OR</div>
            <div className='flex items-center justify-center gap-2 bg-gray-200 text-slate-900 px-4 py-2 rounded-md text-sm '>
              <img className='h-4 w-4' src={GoogleLogo} alt="Google"/>
              <button onClick={handleGoogleAuthentication} type="button" className='text-sm'>
                SIGN UP WITH GOOGLE
              </button>
            </div>
           
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AuthLayout>
  );
}

export default SignUp;