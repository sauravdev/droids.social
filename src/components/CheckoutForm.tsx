import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FRONTEND_URI } from '../constants';

export function  CheckoutForm() {
  
  const stripe = useStripe();
  const navigateTo = useNavigate() ; 
  const elements = useElements();

  const handleSubmit = async (event : any ) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
         return_url: `${FRONTEND_URI.BASEURL}/payment-success`
      },
    });
    console.log(result) ;

    if (result.error) {
      console.log(result.error.message);
    } else {
     console.log("payment completed")

    }
  };

  return (
    <form className='text-white bg-white p-10 rounded-xl ' onSubmit={handleSubmit}>
      <PaymentElement className='text-white' />
     <div className='flex gap-4'>
     <button className='bg-gray-500 my-4 px-4 py-2 rounded-xl ' disabled={!stripe}>Submit</button>
     <button type = "button" onClick={() => {navigateTo('/')}} className='bg-red-500 my-4 px-4 py-2 rounded-xl ' disabled={!stripe}>Cancel</button>
     </div>
    </form>
  );
};
