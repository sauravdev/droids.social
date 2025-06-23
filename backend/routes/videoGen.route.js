import express from 'express';
import { get5sVideoUrl } from '../controllers/videoGeneratorController.js';
const videoGenRouter = express.Router();
videoGenRouter.post('/generate-video', get5sVideoUrl);
export {videoGenRouter} ; 