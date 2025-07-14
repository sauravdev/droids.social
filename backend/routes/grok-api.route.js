import express from 'express' ;
import { generatePost, generateTopics ,generateVideoGenerationPrompt , generateVideoDescription} from '../controllers/grok-api.controller.js';
const grokApiRouter = express.Router() ; 

grokApiRouter.post('/generate-content' ,  generatePost); 
grokApiRouter.post('/generate-topics' ,  generateTopics); 
grokApiRouter.post("/generate-video-prompt" , generateVideoGenerationPrompt) ; 
grokApiRouter.post("/generate-video-description" , generateVideoDescription) ; 
export {grokApiRouter} ; 