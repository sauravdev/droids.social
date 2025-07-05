import React from 'react';

export function Testimonials() {

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
   
    return  <>
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
    </>
}

export default Testimonials; 