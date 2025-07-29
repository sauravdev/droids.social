import express from 'express'; 
import {getProfileData} from '../controllers/ayrshare-user.controller.js'
const userRouter = express.Router() ;
userRouter.post('/user' , getProfileData ) ;
export {userRouter}; 