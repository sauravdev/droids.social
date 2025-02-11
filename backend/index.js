import express from 'express';
import bodyParser from 'body-parser' ; 
import cors from 'cors';
import { linkedinRouter } from './routes/linkedin.route.js';
import { twitterRouter } from './routes/twitter.route.js';
import { instagramRouter } from './routes/instagram.route.js';
const app = express();
const port = 3000;
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(twitterRouter); 
app.use(linkedinRouter)
app.use(instagramRouter)
app.listen(port, () => {
  console.log(`Proxy server is running at http://localhost:${port}`);
});











