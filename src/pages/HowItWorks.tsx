import React from 'react';
import { Zap , Target , Sparkles } from 'lucide-react';
export function HowItWorks() {
    return  <>
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-xl text-gray-300">
              Three simple steps to transform your social media presence
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="flex justify-center">
                <div className="bg-purple-600 rounded-lg p-3">
                  <Zap className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="mt-4 text-xl font-semibold text-white">Connect</h3>
              <p className="mt-2 text-gray-300">
                Link your social media accounts and let our AI analyze your audience
              </p>
            </div>
            <div className="text-center">
              <div className="flex justify-center">
                <div className="bg-purple-600 rounded-lg p-3">
                  <Target className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="mt-4 text-xl font-semibold text-white">Create</h3>
              <p className="mt-2 text-gray-300">
                Generate engaging content tailored to your brand and audience
              </p>
            </div>
            <div className="text-center">
              <div className="flex justify-center">
                <div className="bg-purple-600 rounded-lg p-3">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="mt-4 text-xl font-semibold text-white">Grow</h3>
              <p className="mt-2 text-gray-300">
                Watch your engagement and following grow with optimized content
              </p>
            </div>
          </div>
        </div>
     
    </>
}

export default  HowItWorks; 