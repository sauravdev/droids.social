import express from 'express';
import { createCheckoutSession , createPayment} from '../controllers/dodoPaymentsController.js';
const dodoRouter  = express.Router() ;


dodoRouter.post('/create-dodo-checkout-session' , createPayment ) ; 







export {dodoRouter}