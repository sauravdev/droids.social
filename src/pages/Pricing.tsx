import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { BACKEND_APIPATH } from '../constants';
import { getProfile } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SEOProvider } from '../components/SEOProvider';
import { productSchema } from '../lib/structuredData';

export function Pricing() {
  const { setTokens } = useAuth();

  const [profile, setProfile] = useState<any>(null);
  const  navigate = useNavigate() ; 

  useEffect(() => {
    (async () => {
      const data = await getProfile();
      console.log('profile info = ', data);
      setProfile(data);
    })();
  }, []);

  const handleNavigateToContactUs = () => {
    navigate("/contact") ;
  }

  const pricingPlans = [
    {
      id: 'pdt_dxSbp9be9x6ISDYyZLOjq',
      name: 'Starter',
      price: '10',
      features: [
        '3 Social Media Accounts',
        '100 AI-Generated Posts/mo',
        'Content Calendar',
        'Email Support',
      ],
      tokens: 1000,
    },
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

  const handlePayments = async (plan: { id : string ,  price: string; tokens: number; name: string }) => {
    if (!profile?.email || !profile?.full_name ) {
      alert('Please login to proceed with payment.');
      return;
    }
    
    try {
      const response = await fetch(`${BACKEND_APIPATH.BASEURL}/create-dodo-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email : profile?.email  , 
          name : profile?.full_name , 

        product_cart: [
          {
            id: plan?.id,              
            name: plan.name,
            price: Number(plan.price),
            quantity: 1,
            // tokens: plan.tokens,      // optional
            // email: profile.email      // optional
          }
        ]
        ,
        payment_link : true
      }),
      });
  
      const data = await response.json();
      console.log('dodo payment response  = ' , data)  ; 

      if (data?.payment_id) {
       
        localStorage.setItem('tokens', plan.tokens.toString());
        setTokens(plan.tokens);
        window.location.href = data?.payment_link ;
      } else {
        alert('Failed to initiate payment. Please try again.');
      }
    } catch (error) {
      console.error('Payment initiation error:', error);
      alert('Something went wrong during payment initiation.');
    }
  };

  return (
    <SEOProvider
      title="Simple, Transparent Pricing"
      description="Free forever for starters. Scale with affordable plans – Starter $29, Pro $79, Enterprise $199. Unlimited AI posts & analytics."
      canonical="https://socialdroids.ai/pricing"
      structuredData={productSchema}
    >
      <div className="min-h-screen bg-gray-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-white sm:text-5xl mb-8">Pricing That Grows With You</h1>
            <p className="mt-4 text-xl text-gray-300">Choose the plan that's right for you</p>
          </div>

        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
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
                    onClick={() => handlePayments(plan)}
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
                  <button
                    onClick={() => {handleNavigateToContactUs() }}
                    className="block w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md text-center"
                  >
                    Contact Us
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        </div>
      </div>
    </SEOProvider>
  );
}


export default Pricing; 