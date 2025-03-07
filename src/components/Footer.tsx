import React from 'react';
import { Bot, Github, Twitter } from 'lucide-react';
import { Link } from 'react-router-dom';
export function Footer() {
  return (
    <footer className="bg-gray-800 border-t border-gray-700">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1">
            <div className="flex items-center">
              <Bot className="h-8 w-8 text-purple-500" />
              <span className="ml-2 text-xl font-bold text-white">socialdroids.ai</span>
            </div>
            <p className="mt-2 text-gray-400">
              Your AI-powered social media copilot
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-2 flex flex-col gap-1">
              <Link to = "/howitworks"> <li className="text-gray-400 hover:text-white">How it Works</li> </Link>
              <Link to = "/pricing"><li className="text-gray-400 hover:text-white">Pricing</li></Link>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-2 flex flex-col gap-1 ">
              <Link to = "/about"><li  className="text-gray-400 hover:text-white">About </li></Link>
              <Link to = "/testimonials" >  <li className="text-gray-400 hover:text-white">Testimonials</li></Link>
              <Link to = "/contact"><li  className="text-gray-400 hover:text-white">Contact</li></Link>
            </ul>
          </div>

          {/* Legal */}
          {/* <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white">Privacy</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">Terms</a></li>
            </ul>
          </div> */}
        </div>

        <div className="mt-8 pt-8 border-t border-gray-700 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400">© 2024 socialdroids.ai. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-white">
              <Twitter className="h-6 w-6" />
            </a>
            <a href="#" className="text-gray-400 hover:text-white">
              <Github className="h-6 w-6" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}