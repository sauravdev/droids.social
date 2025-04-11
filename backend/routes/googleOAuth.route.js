import express from 'express' ; 
import { googleAuthentication } from '../controllers/googleAuthController.js';
const googleOAuthRouter = express.Router() ;
googleOAuthRouter.post('/auth/google',googleAuthentication  );
export {googleOAuthRouter}; 