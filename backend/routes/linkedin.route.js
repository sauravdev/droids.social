import express from 'express';
const linkedinRouter = express.Router()  ;
import { generateAccessToken  , getUserInfo , uploadContentHandler , scheduleContentHandler} from '../controllers/linkedin.controller.js';
linkedinRouter.post('/auth/linkedIn/token' , generateAccessToken ) 
linkedinRouter.get("/auth/linkedIn/user/:access_token", getUserInfo);
linkedinRouter.post('/upload/post/linkedin' , uploadContentHandler)
linkedinRouter.post('/schedule/post/linkedin' , scheduleContentHandler)

export {linkedinRouter}
