import express from 'express' ;
import { generatePost } from '../controllers/grok-api.controller.js';
const grokApiRouter = express.Router() ; 


grokApiRouter.post('/generate-content' ,  generatePost); 
export {grokApiRouter} ; 