import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Auth/Login';
import { SignUp } from './pages/Auth/SignUp';
import { Dashboard } from './pages/Dashboard';
import { ContentStrategy } from './pages/ContentStrategy';
import { AIGenerator } from './pages/AIGenerator';
import { Calendar } from './pages/Calendar';
import { Engage } from './pages/Engage';
import { Analytics } from './pages/Analytics';
import { CustomModels } from './pages/CustomModels';
import { CarouselGenerator } from './pages/CarouselGenerator';
import { ProfileSettings } from './pages/ProfileSettings';
import { TwitterCallback } from './pages/Settings/TwitterCallback';
import {  OauthTwitterCallback } from './pages/Settings/OauthTwitterCallback';
import { LinkedInCallback } from './pages/Settings/LinkedInCallback';
import { useAuth } from './context/AuthContext';
import {InstagramAuth} from './lib/InstagramAuth';
import {LinkedInAuth} from './lib/LinkedInAuth';
import { Pricing } from './pages/Pricing';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { Testimonials } from './pages/Testimonials';
import { HowItWorks } from './pages/HowItWorks';
import { PaymentSuccess } from './pages/PaymentSuccess';

export default function App() {
  const { session, loading } = useAuth();
 

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      {/* !session ? <LandingPage /> : <Navigate to="/dashboard" */}
      <Route path="/" element={  !session ? <LandingPage /> : <Navigate to="/dashboard"/> } />
      <Route path="/login" element={!session ? <Login /> : <Navigate to="/dashboard" replace />} />
      <Route path="/signup" element={!session ? <SignUp /> : <Navigate to="/dashboard" replace />} />
      {/* Protected routes */}
      <Route path="/dashboard" element={session ? <Layout><Dashboard /></Layout> : <Navigate to="/login" replace />} />
      <Route path="/strategy" element={session ? <Layout><ContentStrategy /></Layout> : <Navigate to="/login" replace />} />
      <Route path="/generator" element={session ? <Layout><AIGenerator /></Layout> : <Navigate to="/login" replace />} />
      <Route path="/carousel" element={session ? <Layout><CarouselGenerator /></Layout> : <Navigate to="/login" replace />} />
      <Route path="/calendar" element={session ? <Layout><Calendar /></Layout> : <Navigate to="/login" replace />} />
      {/* <Route path="/engage" element={session ? <Layout><Engage /></Layout> : <Navigate to="/login" replace />} /> */}
      <Route path="/analytics" element={session ? <Layout><Analytics /></Layout> : <Navigate to="/login" replace />} />
      <Route path="/models" element={session ? <Layout><CustomModels /></Layout> : <Navigate to="/login" replace />} />
      <Route path="/settings" element={session ? <Layout><ProfileSettings /></Layout> : <Navigate to="/login" replace />} />
      <Route path="/callback/twitter" element={session ? <TwitterCallback /> : <Navigate to="/login" replace />} />
      <Route path="/settings/callback/linkedin" element={session ? <LinkedInCallback /> : <Navigate to="/login" replace />} />
      <Route path="/oauth/twitter" element={session ? <OauthTwitterCallback /> : <Navigate to="/login" replace />} />
      <Route path="/auth/instagram/" element={<InstagramAuth />} />
      <Route path="/linkedin/callback/auth/linkedIn" element={<LinkedInAuth />} /> 

      <Route path="/pricing" element={session ? <Layout><Pricing /></Layout> : <Navigate to="/login" replace />} />
      <Route path="/payment-success" element={session ? <Layout><PaymentSuccess /></Layout> : <Navigate to="/login" replace />} />
      <Route path="/about" element={session ? <Layout><About /></Layout> : <Navigate to="/login" replace />} />
      <Route path="/contact" element={session ? <Layout><Contact /></Layout> : <Navigate to="/login" replace />} />
      <Route path="/testimonials" element={session ? <Layout><Testimonials /></Layout> : <Navigate to="/login" replace />} />
      <Route path="/howitworks" element={session ? <Layout><HowItWorks /></Layout> : <Navigate to="/login" replace />} />
    </Routes>
  );
}