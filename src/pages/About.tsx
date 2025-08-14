import React from 'react';
import { SEOProvider } from '../components/SEOProvider';
import { organizationSchema } from '../lib/structuredData';

export function About() {
   
  return (
    <SEOProvider
      title="About Socialdroids.ai – Our Mission to Democratise Social Media Success"
      description="We're a team of AI enthusiasts & social media experts building tools that turn anyone into a content powerhouse."
      canonical="https://socialdroids.ai/about"
      structuredData={organizationSchema}
    >
      <div className="min-h-screen bg-gray-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-white sm:text-5xl mb-8">
              Our Story
            </h1>
            <p className="mt-4 text-xl text-gray-300 max-w-3xl mx-auto">
              We're a team of AI enthusiasts and social media experts on a mission to democratize social media success.
              Our platform combines cutting-edge AI technology with proven social media strategies to help creators and
              businesses grow their online presence.
            </p>
          </div>
        </div>
      </div>
    </SEOProvider>
  );
}

export default About; 