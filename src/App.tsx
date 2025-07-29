import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { useAuth } from "./context/AuthContext";

// Lazy load components
const LandingPage = React.lazy(() => import("./pages/LandingPage"));
const Login = React.lazy(() => import("./pages/Auth/Login"));
const SignUp = React.lazy(() => import("./pages/Auth/SignUp"));
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const ContentStrategy = React.lazy(() => import("./pages/ContentStrategy"));
const AIGenerator = React.lazy(() => import("./pages/AIGenerator"));
const Calendar = React.lazy(() => import("./pages/Calendar"));
const Engage = React.lazy(() => import("./pages/Engage"));
const Analytics = React.lazy(() => import("./pages/Analytics"));
const CustomModels = React.lazy(() => import("./pages/CustomModels"));
const CarouselGenerator = React.lazy(() => import("./pages/CarouselGenerator"));
const ProfileSettings = React.lazy(() => import("./pages/ProfileSettings"));
const TwitterCallback = React.lazy(
  () => import("./pages/Settings/TwitterCallback")
);
const OauthTwitterCallback = React.lazy(
  () => import("./pages/Settings/OauthTwitterCallback")
);
const LinkedInCallback = React.lazy(
  () => import("./pages/Settings/LinkedInCallback")
);
const InstagramAuth = React.lazy(() => import("./lib/InstagramAuth"));
const LinkedInAuth = React.lazy(() => import("./lib/LinkedInAuth"));
const Pricing = React.lazy(() => import("./pages/Pricing"));
const About = React.lazy(() => import("./pages/About"));
const Contact = React.lazy(() => import("./pages/Contact"));
const Testimonials = React.lazy(() => import("./pages/Testimonials"));
const HowItWorks = React.lazy(() => import("./pages/HowItWorks"));
const PaymentSuccess = React.lazy(() =>
  import("./pages/RedirectedPaymentPage").then((module) => ({
    default: module.RedirectedPaymentPage,
  }))
);
const GoogleAuth = React.lazy(() => import("./components/GoogleAuth"));
const InstructionsModal = React.lazy(
  () => import("./components/InstructionsModal")
);

// Reuse your existing loading component style
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gray-900 flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
  </div>
);

// Page wrapper component for protected routes
const ProtectedRoute = ({ children, session }) => {
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  return (
    <Layout>
      <Suspense fallback={<PageLoadingSpinner />}>{children}</Suspense>
    </Layout>
  );
};

// Lighter loading spinner for page transitions within layout
const PageLoadingSpinner = () => (
  <div className="flex items-center justify-center py-20">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
  </div>
);

export default function App() {
  const { session, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Public routes */}
        <Route
          path="/"
          element={!session ? <LandingPage /> : <Navigate to="/dashboard" />}
        />
        <Route
          path="/google-oauth"
          element={!session ? <GoogleAuth /> : <Navigate to="/dashboard" />}
        />
        <Route
          path="/login"
          element={!session ? <Login /> : <Navigate to="/dashboard" replace />}
        />
        <Route
          path="/signup"
          element={!session ? <SignUp /> : <Navigate to="/dashboard" replace />}
        />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute session={session}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/strategy"
          element={
            <ProtectedRoute session={session}>
              <ContentStrategy />
            </ProtectedRoute>
          }
        />
        <Route
          path="/generator"
          element={
            <ProtectedRoute session={session}>
              <AIGenerator />
            </ProtectedRoute>
          }
        />
        <Route
          path="/carousel"
          element={
            <ProtectedRoute session={session}>
              <CarouselGenerator />
            </ProtectedRoute>
          }
        />
        <Route
          path="/calendar"
          element={
            <ProtectedRoute session={session}>
              <Calendar />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute session={session}>
              <Analytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/models"
          element={
            <ProtectedRoute session={session}>
              <CustomModels />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute session={session}>
              <ProfileSettings />
            </ProtectedRoute>
          }
        />

        {/* Callback routes */}
        <Route
          path="/callback/twitter"
          element={
            session ? <TwitterCallback /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/settings/callback/linkedin"
          element={
            session ? <LinkedInCallback /> : <Navigate to="/login" replace />
          }
        />
        <Route path="/auth/instagram/" element={<InstagramAuth />} />
        <Route
          path="/linkedin/callback/auth/linkedIn"
          element={<LinkedInAuth />}
        />

        {/* Other protected routes */}
        <Route
          path="/pricing"
          element={
            <ProtectedRoute session={session}>
              <Pricing />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment-success"
          element={
            <ProtectedRoute session={session}>
              <PaymentSuccess />
            </ProtectedRoute>
          }
        />
        <Route
          path="/about"
          element={
            <ProtectedRoute session={session}>
              <About />
            </ProtectedRoute>
          }
        />
        <Route
          path="/contact"
          element={
            <ProtectedRoute session={session}>
              <Contact />
            </ProtectedRoute>
          }
        />
        <Route
          path="/testimonials"
          element={
            <ProtectedRoute session={session}>
              <Testimonials />
            </ProtectedRoute>
          }
        />
        <Route
          path="/howitworks"
          element={
            <ProtectedRoute session={session}>
              <HowItWorks />
            </ProtectedRoute>
          }
        />

        <Route
          path="/instruction-modal"
          element={
            <ProtectedRoute session={session}>
              <InstructionsModal />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Suspense>
  );
}
