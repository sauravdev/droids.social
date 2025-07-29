import express from 'express';
import { generateAccessToken , getTwitterInsights, getUserInfo ,updateProfileInfo } from '../controllers/twitter.controller.js'; 

import {postContentHandler , schedulePostHandler} from '../controllers/ayrshare-twitter.controller.js'

const twitterRouter = express.Router()  ; 
twitterRouter.post('/twitter/oauth/token',  generateAccessToken);
twitterRouter.post('/twitter/users/me',  getUserInfo) ;

twitterRouter.post("/post/tweet/twitter"  , postContentHandler  ) ;
twitterRouter.post('/schedule/post/api'  , schedulePostHandler ) ;

twitterRouter.post('/twitter/insights'  , getTwitterInsights ) ; 
twitterRouter.post('/twitter/update/profile'  , updateProfileInfo ) ; 
export {twitterRouter}