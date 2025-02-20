import express from 'express';
const instagramRouter = express.Router()  ;
import { generateAccessToken , getUserInfo, scheduleContentHandler, uploadContentHandler  ,  publishInstagramCarousel} from '../controllers/instagram.controller.js'; 


instagramRouter.post("/auth/instagram/token", generateAccessToken);
instagramRouter.get("/auth/instagram/user/:access_token", getUserInfo );
instagramRouter.post("/upload/post/instagram" , uploadContentHandler)
instagramRouter.post("/schedule/post/instagram" , scheduleContentHandler) ;
instagramRouter.post("/publish/carousel/instagram" , publishInstagramCarousel) ;
export {instagramRouter}