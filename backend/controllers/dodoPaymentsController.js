import dotenv from 'dotenv' ; 
import DodoPayments from 'dodopayments';
import axios from 'axios';
dotenv.config() ; 


const client = new DodoPayments({
  bearerToken: process.env['DODO_PAYMENTS_API_KEY'],
  environment: 'test_mode',
});

const createCheckoutSession = async (req , res ) =>  {
  console.log("req body = "  ,req.body) ; 
  const {product_cart} = req.body; 
  console.log("product cart " , product_cart) ; 
  if(!Array.isArray(product_cart) ||  !product_cart?.[0]?.id)
  {
    return res.status(400).json("Invalid request") ; 
  }
  try {
    const response = await axios.post(
      `https://checkout.dodopayments.com/buy/${product_cart?.[0]?.id}`,
      {
        product_cart: req.body.product_cart
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.DODO_PAYMENTS_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      }
    );
    // console.log("data = " , response )  ;
    // const data = await response.json() ; 
    console.log("parsed data = " , respone ) ;  
    res.status(200).json(response.config.url);
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({ error: 'Payment service timeout. Please try again.' });
    }
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;
      switch (status) {
        case 400:
          return res.status(400).json({ error: 'Invalid payment data.', details: errorData });
        case 401:
        case 403:
          return res.status(401).json({ error: 'Authentication failed with payment provider.' });
        case 404:
          return res.status(404).json({ error: 'Payment endpoint not found.' });
        case 422:
          return res.status(422).json({ error: 'Unprocessable payment data.', details: errorData });
        case 429:
          return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
        default:
          return res.status(502).json({ error: 'Payment provider error.', details: errorData });
      }
    } else if (error.request) {
        console.log("error = "  , error); 
      return res.status(503).json({ error: 'No response from payment provider. Please try again.' });
    } else {
        console.log("error  = " , error) ; 
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }
}


const createPayment = async (req , res ) => {

    console.log("req body = "  ,req.body) ; 
  const {product_cart , name , email } = req.body; 
  
  console.log("product cart " , product_cart) ; 
  if(!name || !email || !Array.isArray(product_cart) ||  !product_cart?.[0]?.id)
  {
    return res.status(400).json("Invalid request") ; 
  }
  const product_id = product_cart?.[0]?.id  ; 
  const product_array  = [{product_id , quantity : 1 }] ; 
  console.log("product array = " , product_array) ; 
  try {
    const response = await client.payments.create({
        billing : {
            city : "" , 
            country: 'IN' , 
            state : "" , 
            street : "" , 
            zipcode : "" , 
        },
        customer : {
            email  :email , 
            name : name ,
        },
        payment_link : true , 
        product_cart : product_array,
        return_url : process.env.FRONTEND_URL
    })
    console.log("response = " , response) ; 
    if(!response?.payment_id) 
    {
        return  res.status(500).json("Something went wrong") ;
    }
    return res.status(200).json(response) ; 
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({ error: 'Payment service timeout. Please try again.' });
    }
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;
      switch (status) {
        case 400:
          return res.status(400).json({ error: 'Invalid payment data.', details: errorData });
        case 401:
        case 403:
          return res.status(401).json({ error: 'Authentication failed with payment provider.' });
        case 404:
          return res.status(404).json({ error: 'Payment endpoint not found.' });
        case 422:
          return res.status(422).json({ error: 'Unprocessable payment data.', details: errorData });
        case 429:
          return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
        default:
          return res.status(502).json({ error: 'Payment provider error.', details: errorData });
      }
    } else if (error.request) {
        console.log("error = "  , error); 
      return res.status(503).json({ error: 'No response from payment provider. Please try again.' });
    } else {
        console.log("error  = " , error) ; 
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }


}

async function listProducts() {
    try{

        const products = await client.products.list() ; 
        console.log("products start ----------------------------- ") ; 
        console.log(products) ; 
        console.log("products end ----------------------------------")

    }
    catch(error) 
    {
        console.log(error) ; 
    }
}

export {createCheckoutSession , createPayment}