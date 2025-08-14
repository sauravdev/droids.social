import React from 'react';
import { SEOProvider } from '../components/SEOProvider';

export function Contact() {
  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "name": "Contact Socialdroids.ai",
    "description": "Get in touch with our team for support and inquiries"
  };

  return (
    <SEOProvider
      title="Get in Touch"
      description="Have questions? Our team is here 24/7. Drop us a message and we'll respond within one business day."
      canonical="https://socialdroids.ai/contact"
      structuredData={contactSchema}
    >
      <div className="min-h-screen bg-gray-900 py-20">
        <div className="max-w-lg mx-auto">
          <h1 className='text-4xl text-white mb-8 text-center'>Contact Us</h1>
          <form className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300">
                Name
              </label>
              <input
                type="text"
                id="name"
                className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-300">
                Message
              </label>
              <textarea
                id="message"
                rows={4}
                className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Send Message
              </button>
            </div>
          </form>
        </div>
      </div>
    </SEOProvider>
  );
}

export default Contact; 