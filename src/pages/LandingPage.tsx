import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, Rocket, Calendar, MessageSquare, BarChart3, Zap, Target, Sparkles, Check } from 'lucide-react';
import { HashLink } from 'react-router-hash-link';
import { useNavigate } from 'react-router-dom';
import { SEOProvider } from '../components/SEOProvider';
import { softwareApplicationSchema } from '../lib/structuredData';

function LandingPage() {
  const navigate = useNavigate();
  
  return (
    <SEOProvider
      title="Your AI Social Media Co-Pilot"
      description="Automate content creation, scheduling & analytics across LinkedIn, Instagram and X in minutes with Socialdroids.ai – no marketing team required."
      canonical="https://socialdroids.ai/"
      structuredData={softwareApplicationSchema}
    >
    <div className="min-h-screen bg-gray-900">
      {/* Navigation */}
      <nav className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Bot className="h-8 w-8 text-purple-500" />
              <span className="ml-2 text-xl font-bold text-white">socialdroids.ai</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#how-it-works" className="text-gray-300 hover:text-white text-sm font-medium">
                How it Works
              </a>
              <HashLink smooth to="/#pricing" className="text-gray-300 hover:text-white text-sm font-medium">
                Pricing
              </HashLink>
              <a href="#testimonials" className="text-gray-300 hover:text-white text-sm font-medium">
                Testimonials
              </a>
              <a href="#about" className="text-gray-300 hover:text-white text-sm font-medium">
                About Us
              </a>
              <a href="#contact" className="text-gray-300 hover:text-white text-sm font-medium">
                Contact
              </a>
              <Link to="/login" className="text-gray-300 hover:text-white text-sm font-medium">
                Login
              </Link>
              <Link
                to="/signup"
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl">
              <span className="block">Your AI-Powered</span>
              <span className="block text-purple-500">Social Media CoPilot</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-300 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Transform your social media presence with AI-driven content creation, scheduling, and engagement.
              From zero to influencer with socialdroids.ai
            </p>
            <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
              <div className="rounded-md shadow">
                <Link
                  to="/signup"
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 md:py-4 md:text-lg md:px-10"
                >
                  Start Free Trial
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How it Works */}
      <section id="how-it-works" className="bg-gray-800 py-20">
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
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-4 text-xl text-gray-300">
            Choose the plan that's right for you
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pricingPlans.map((plan) => (
            plan?.id != "pdt_8kregStG7i8Ow0tdKq6kK" ? <div key={plan.id} className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <div className="px-6 py-8">
                <h3 className="text-2xl font-semibold text-white">{plan.name}</h3>
                <p className="mt-4">
                  <span className="text-4xl font-extrabold text-white">${plan.price}</span>
                  <span className="text-gray-300">/month</span>
                </p>
                <ul className="mt-6 space-y-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <Check className="h-5 w-5 text-purple-500 mr-2" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>


                
                <div className="mt-8">
                  <button
                    onClick={() => {navigate('/signup')}}
                    className="block w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md text-center"
                  >
                    Get Started
                  </button>
                </div>
              </div>
            </div> : <div key={plan.id} className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <div className="px-6 py-8">
                <h3 className="text-2xl font-semibold text-white">{plan.name}</h3>
                <p className="mt-4">
                  <span className="text-4xl font-extrabold text-white">Custom Pricing</span>
                  
                </p>
                <ul className="mt-6 space-y-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <Check className="h-5 w-5 text-purple-500 mr-2" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <a
                    href="#contact"
                    className="block w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md text-center"
                  >
                    Contact Us
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

      {/* Testimonials */}
      <section id="testimonials" className="bg-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              What Our Users Say
            </h2>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-700 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="h-12 w-12 rounded-full"
                  />
                  <div className="ml-4">
                    <h4 className="text-lg font-semibold text-white">{testimonial.name}</h4>
                    <p className="text-gray-400">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-300">{testimonial.quote}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Us */}
      <section id="about" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              About Us
            </h2>
            <p className="mt-4 text-xl text-gray-300 max-w-3xl mx-auto">
              We're a team of AI enthusiasts and social media experts on a mission to democratize social media success.
              Our platform combines cutting-edge AI technology with proven social media strategies to help creators and
              businesses grow their online presence.
            </p>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="bg-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Get in Touch
            </h2>
            <p className="mt-4 text-xl text-gray-300">
              Have questions? We're here to help.
            </p>
          </div>

          <div className="mt-12 max-w-lg mx-auto">
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
      </section>
    </div>
    </SEOProvider>
  );
}

const pricingPlans = [
  {
    id: 'Free123',
    name: 'Free',
    price: '0',
    features: [
      '3 Social Media Accounts',
      '100 Free Tokens',
      'Content Calendar',
      'Email Support'
    ]
  },
  // {
  //   id: 'pdt_dxSbp9be9x6ISDYyZLOjq',
  //   name: 'Starter',
  //   price: '10',
  //   features: [
  //     '3 Social Media Accounts',
  //     '100 AI-Generated Posts/mo',
  //     'Content Calendar',
  //     'Email Support',
  //   ],
  //   tokens: 1000,
  // },
  {
    id: 'pdt_kaFtp9yz76HqvwH9arGQp',
    name: 'Premium',
    price: '160',
    features: [
      'Premium Ayrshare API', 
      '3 Social Media Accounts',
      'Unlimited AI-Generated Posts',
      'Advanced Analytics',
      'Content Calendar',
      'Priority Support',
      'Custom Branding',
    ],
    tokens: 5000,
  },
  {
    id: 'pdt_8kregStG7i8Ow0tdKq6kK',
    name: 'Enterprise',
    price: 'Custom Pricing',
    features: [
      '3 Social Media Accounts',
      'Unlimited AI-Generated Posts',
      'Advanced Analytics & Reports',
      'Content Calendar',
      '24/7 Priority Support',
      'Custom AI Training',
    ],
    tokens: 10000,
  },
];

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Digital Marketing Manager',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
    quote: 'socialdroids.ai has transformed how we manage our social media. The AI-generated content is incredibly engaging and saves us hours every week.'
  },
  {
    name: 'Michael Rodriguez',
    role: 'Content Creator',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
    quote: 'As a solo creator, this tool has been a game-changer. It\'s like having a whole social media team at my fingertips.'
  },
  {
    name: 'Emily Watson',
    role: 'Startup Founder',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80',
    quote: 'The analytics and AI suggestions have helped us grow our following by 300% in just three months. Incredible results!'
  }
];

export default LandingPage ;