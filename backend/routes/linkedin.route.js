import express from 'express';
import { upload } from '../multer.config.js';
const linkedinRouter = express.Router()  ;
import { generateAccessToken  , getUserInfo , uploadContentHandler , scheduleContentHandler, postLinkedinCarousel} from '../controllers/linkedin.controller.js';
linkedinRouter.post('/auth/linkedIn/token' , generateAccessToken ) 
linkedinRouter.get("/auth/linkedIn/user/:access_token", getUserInfo);
linkedinRouter.post('/upload/post/linkedin' , uploadContentHandler)
linkedinRouter.post('/schedule/post/linkedin' , scheduleContentHandler)
linkedinRouter.post("/upload/carousel/linkedin" ,  upload.single('pdf') , postLinkedinCarousel)
export {linkedinRouter}
