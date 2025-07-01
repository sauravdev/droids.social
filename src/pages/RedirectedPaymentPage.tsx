import React  , {useEffect, useState} from 'react';
import { PaymentFailure } from './PaymentFailure';
import { PaymentSuccess } from './PaymentSuccess';

export function RedirectedPaymentPage() {  

    const [status , setStatus] = useState(''); 
    useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search );
    const paymentStatus = queryParams.get("status");
    setStatus(paymentStatus || "");
  }, []);


    if(status == 'failed') 
    {
      return <PaymentFailure/>
    }
    else if(status == "succeeded") 
    {
      return <PaymentSuccess/>
    }
    else{
      return <></>
    }
}