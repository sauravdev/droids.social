import express from 'express' ; 
import {fintuningModelHandler} from '../controllers/openai.controller.js'
import { upload } from '../multer.config.js';
const openaiRouter = express.Router() ; 

openaiRouter.post('/tune/custom/model'   ,upload.single("file"), fintuningModelHandler)


export {openaiRouter}