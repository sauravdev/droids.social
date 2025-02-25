import express from 'express';
import bodyParser from 'body-parser' ; 
import cors from 'cors';
import { loadScheduledJobs } from './test.js';
import { supabase , testConnection} from './config/supabase.js'
import { linkedinRouter } from './routes/linkedin.route.js';
import { twitterRouter } from './routes/twitter.route.js';
import { instagramRouter } from './routes/instagram.route.js';
import axios from 'axios' ;
const app = express();
const port = 3000;
app.use(cors());
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));
app.use(twitterRouter); 
app.use(linkedinRouter)
app.use(instagramRouter)

const conn = supabase.conn 
const data = await testConnection() ; 
const fullName = data?.[0]?.full_name
const scheduledJobsMap = new Map();
// const scheduledJobs = await loadScheduledJobs() 
// if(scheduledJobs)
// {
//   console.log("--------------------Displaying all scheduled jobs-------------------")
// scheduledJobsMap.forEach((value , key ) => {
//   console.log(`key = ${key} , value = ${value}`)
// })
// }


app.get("/fetch-image", async (req, res) => {
  try {
    const imageUrl = req.query.url; // Get the image URL from the frontend
    console.log(imageUrl)
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    res.setHeader("Content-Type", "image/png");
    res.send(Buffer.from(response.data)); 
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch image" });
  }
});
app.listen(port, async () => {
  if(fullName) {
    console.log(`Hi ${fullName}! supabase connection established...`)
  }
  else{
    console.log("Some error occured while connecting to supabase server....")
  }
  console.log(`Proxy server is running at http://localhost:${port}`);
});


try {
  const response = await fetch('http://64.227.142.60:5009/api/process', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(
      {
        "keyword": "machine learning",
        "source": ["arxiv", "twitter"],
        "N": 2,
        "converted_source": ["twitter", "linkedin", "blog", "instagram"],
        "content_types": ["text", "image", "video"]
      
  
      }
    )
  });
  
  const result = await response.json();
  console.log('API response:', result );
} catch (error) {
  console.error('Error processing content:', error);
}






export {scheduledJobsMap}




