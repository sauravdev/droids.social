
import express from 'express';
const instagramRouter = express.Router()  ;
import { generateAccessToken , getUserInfo,   publishInstagramCarousel ,scheduleInstagramCarousel} from '../controllers/instagram.controller.js'; 
import { uploadContentHandler , scheduleContentHandler } from '../controllers/ayrshare-instagram.controller.js';
instagramRouter.post("/auth/instagram/token", generateAccessToken);
instagramRouter.post("/auth/instagram/user/:access_token", getUserInfo );
instagramRouter.post("/upload/post/instagram" , uploadContentHandler)
instagramRouter.post("/schedule/post/instagram" , scheduleContentHandler) ;
instagramRouter.post("/publish/carousel/instagram" , publishInstagramCarousel) ;
instagramRouter.post("/schedule/carousel/instagram" , scheduleInstagramCarousel) ;

export {instagramRouter}