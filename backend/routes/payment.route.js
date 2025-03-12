import express from 'express' ; 
import { starterAccountPaymentHandler  , proffesionalAccountPaymentHandler , enterpriseAccountPaymentHandler} from '../controllers/payment.controller.js';
const paymentRouter = express.Router() ; 

paymentRouter.post("/create-payment-intent" ,   starterAccountPaymentHandler)
paymentRouter.post("/create-payment-intent-professional" ,   proffesionalAccountPaymentHandler)
paymentRouter.post("/create-payment-intent-enterprise" ,   enterpriseAccountPaymentHandler)

export {paymentRouter} ; 
