import express from 'express';
import { generateAccessToken , getUserInfo , postContentHandler  ,schedulePostHandler  } from '../controllers/twitter.controller.js'; 
const twitterRouter = express.Router()  ; 




twitterRouter.post('/twitter/oauth/token',  generateAccessToken);
twitterRouter.get('/twitter/users/me',  getUserInfo);
twitterRouter.post("/post/tweet/twitter"  , postContentHandler  )
twitterRouter.post('/schedule/post/api'  , schedulePostHandler )


export {twitterRouter}