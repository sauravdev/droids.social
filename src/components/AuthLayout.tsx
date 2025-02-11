import React from 'react';
import { Link } from 'react-router-dom';
import { Bot } from 'lucide-react';
import { Footer } from './Footer';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center">
              <Bot className="h-8 w-8 text-purple-500" />
              <span className="ml-2 text-xl font-bold text-white">socialdroids.ai</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        {children}
      </main>

      <Footer />
    </div>
  );
}