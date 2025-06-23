import React from 'react';
import { Bot, Github, Twitter } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-gray-800 border-t border-gray-700">
      <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {/* Brand */}
          <div className="col-span-1 xs:col-span-2 md:col-span-1">
            <div className="flex items-center justify-center xs:justify-start">
              <Bot className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500 flex-shrink-0" />
              <span className="ml-2 text-lg sm:text-xl font-bold text-white">
                <span className="hidden sm:inline">socialdroids.ai</span>
                <span className="sm:hidden">socialdroids</span>
              </span>
            </div>
            <p className="mt-2 text-gray-400 text-sm sm:text-base text-center xs:text-left">
              Your AI-powered social media copilot
            </p>
          </div>

          {/* Product */}
          <div className="text-center xs:text-left">
            <h3 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Product</h3>
            <ul className="space-y-1 sm:space-y-2 flex flex-col gap-1">
              <Link to="/howitworks" className="block">
                <li className="text-gray-400 hover:text-white text-sm sm:text-base transition-colors">
                  How it Works
                </li>
              </Link>
              <Link to="/pricing" className="block">
                <li className="text-gray-400 hover:text-white text-sm sm:text-base transition-colors">
                  Pricing
                </li>
              </Link>
            </ul>
          </div>

          {/* Company */}
          <div className="text-center xs:text-left">
            <h3 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Company</h3>
            <ul className="space-y-1 sm:space-y-2 flex flex-col gap-1">
              <Link to="/about" className="block">
                <li className="text-gray-400 hover:text-white text-sm sm:text-base transition-colors">
                  About
                </li>
              </Link>
              <Link to="/testimonials" className="block">
                <li className="text-gray-400 hover:text-white text-sm sm:text-base transition-colors">
                  Testimonials
                </li>
              </Link>
              <Link to="/contact" className="block">
                <li className="text-gray-400 hover:text-white text-sm sm:text-base transition-colors">
                  Contact
                </li>
              </Link>
            </ul>
          </div>

          {/* Placeholder for Legal (commented out but maintaining grid structure) */}
          <div className="hidden md:block">
            {/* Legal section placeholder for grid alignment */}
          </div>
        </div>

        {/* Bottom section */}
        <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-700 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-xs sm:text-sm text-center md:text-left">
            © 2025 socialdroids.ai. All rights reserved.
          </p>
          <div className="flex space-x-4 sm:space-x-6">
            <a 
              href="#" 
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Twitter"
            >
              <Twitter className="h-5 w-5 sm:h-6 sm:w-6" />
            </a>
            <a 
              href="#" 
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="GitHub"
            >
              <Github className="h-5 w-5 sm:h-6 sm:w-6" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}