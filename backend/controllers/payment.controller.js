import Stripe from 'stripe';
import dotenv from 'dotenv' ; 
dotenv.config() 
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const starterAccountPaymentHandler = async (req, res) => {

    const {email } = req.body ; 
    console.log("email = " , email )  ;
    if(!email ) 
    {
        return res.status(400).json({error : "Invalid body : email not recieved!!"}) ;
    }
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 1000,
        currency: 'usd',
        payment_method_types: ['card'],
        receipt_email: email , 
      });
      console.log("paymentIntent.client_secret = " , paymentIntent.client_secret) ; 
      res.json({
        clientSecret: paymentIntent.client_secret,
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  const proffesionalAccountPaymentHandler = async (req, res) => {
    console.log("payment api")  ; 

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 5000,
        currency: 'usd',
        payment_method_types: ['card'],
        receipt_email: 'hemant6081@gmail.com', 
      });
      console.log("paymentIntent.client_secret = " , paymentIntent.client_secret) ; 
      res.json({
        clientSecret: paymentIntent.client_secret,
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  const enterpriseAccountPaymentHandler = async (req, res) => {
    console.log("payment api")  ; 
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 10000,
        currency: 'usd',
        payment_method_types: ['card'],
        receipt_email: 'hemant6081@gmail.com', 
      });
      console.log("paymentIntent.client_secret = " , paymentIntent.client_secret) ; 
      res.json({
        clientSecret: paymentIntent.client_secret,
      });
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  export {starterAccountPaymentHandler , enterpriseAccountPaymentHandler , proffesionalAccountPaymentHandler } ; 