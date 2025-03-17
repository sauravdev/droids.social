import express from 'express';
import { generateAccessToken , getInsights, getUserInfo , postContentHandler  ,schedulePostHandler ,updateProfileInfo } from '../controllers/twitter.controller.js'; 
const twitterRouter = express.Router()  ; 
twitterRouter.post('/twitter/oauth/token',  generateAccessToken);
twitterRouter.post('/twitter/users/me',  getUserInfo) ;
twitterRouter.post("/post/tweet/twitter"  , postContentHandler  ) ;
twitterRouter.post('/schedule/post/api'  , schedulePostHandler ) ;
twitterRouter.post('/twitter/insights'  , getInsights ) ; 
twitterRouter.post('/twitter/update/profile'  , updateProfileInfo ) ; 
export {twitterRouter}