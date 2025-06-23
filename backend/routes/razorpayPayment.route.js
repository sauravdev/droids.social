import express from 'express' 
import {createOrder , verifyPayment , getPaymentDetails } from '../controllers/razaorpayController.js'
const razorpayRouter = express.Router();


razorpayRouter.post('/api/create-order' , createOrder) ; 
razorpayRouter.post('/api/verify-payment' , verifyPayment) ;
razorpayRouter.get('/api/payment/:paymentId' , getPaymentDetails) ;


export default razorpayRouter; 