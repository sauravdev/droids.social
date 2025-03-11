import React , {useState} from 'react';
import { Link } from 'react-router-dom';
import {Check} from 'lucide-react' ; 
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { BACKEND_APIPATH } from '../constants';

import {CheckoutForm} from '../components/CheckoutForm'
export function Pricing() {
  const stripePromise = loadStripe('pk_test_51R12emDCiR3nso8UC0vdYSlOA2zj3rYKCvcfFYM1V0M4Nkqe3TTrfXH8EHvtcvIBF4VRlhmNS5SMsnSd6551Ktye00f3pk3q3W');
  const [paymentResponse , setPaymentResponse] = useState<boolean>(false) ; 
  const [options , setoptions ] = useState<any>({}) ; 
    const pricingPlans = [
        {
          name: 'Starter',
          price: '10',
          features: [
            '3 Social Media Accounts',
            '100 AI-Generated Posts/mo',
            'Basic Analytics',
            'Content Calendar',
            'Email Support'
          ]
        },
        {
          name: 'Professional',
          price: '50',
          features: [
            '10 Social Media Accounts',
            'Unlimited AI-Generated Posts',
            'Advanced Analytics',
            'Content Calendar',
            'Priority Support',
            'Custom Branding'
          ]
        },
        {
          name: 'Enterprise',
          price: '100',
          features: [
            'Unlimited Social Accounts',
            'Unlimited AI-Generated Posts',
            'Advanced Analytics & Reports',
            'Content Calendar',
            '24/7 Priority Support',
            'Custom AI Training'
          ]
        }
      ];

      const handlePayments = async () => {
        fetch(`${BACKEND_APIPATH.BASEURL}/create-payment-intent`  , {method : 'post'})
        .then((response) => response.json())
        .then((data) => {
          const newOptions = { clientSecret: data.clientSecret };
          setoptions(newOptions) ;
          setPaymentResponse(true); 
        });
      }
      if(paymentResponse) 
      {
        
        return (
          <Elements stripe={stripePromise} options={options}>
            <CheckoutForm />
          </Elements>
        );
      }
    return  <>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                Simple, Transparent Pricing
            </h2>
            <p className="mt-4 text-xl text-gray-300">
                Choose the plan that's right for you
            </p>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            {pricingPlans.map((plan) => (
                <div key={plan.name} className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
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
                        onClick={handlePayments}
                        className="block w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md text-center"
                    >
                        Get Started
                    </button>
                    </div>
                </div>
                </div>
            ))}
            </div>
        </div>
    </>
}