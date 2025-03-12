import express from 'express';
import bodyParser from 'body-parser' ; 
import cors from 'cors';
import { loadScheduledJobs } from './test.js';
import { supabase , testConnection} from './config/supabase.js'
import { linkedinRouter } from './routes/linkedin.route.js';
import { twitterRouter } from './routes/twitter.route.js';
import { instagramRouter } from './routes/instagram.route.js';
import { openaiRouter } from './routes/oepnai.route.js';
import axios from 'axios' ;
import dotenv from 'dotenv' ;
import { TwitterApi } from 'twitter-api-v2';
import { paymentRouter } from './routes/payment.route.js';
dotenv.config() 


dotenv.config() ; 
const app = express();
const port = process.env.PORT || 3001;
app.use(cors());
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));
app.use(twitterRouter); 
app.use(linkedinRouter)
app.use(instagramRouter)
app.use(openaiRouter) ; 
app.use(paymentRouter) ; 


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




// const jsonlData = dataset
//   .map(entry =>
//     JSON.stringify({
//       messages: [
//         { role: "system", content: "You are a social media assistant." },
//         { role: "user", content: entry.prompt },
//         { role: "assistant", content: entry.completion }
//       ]
//     })
//   )
//   .join("\n");

// fs.writeFileSync("dataset.jsonl", jsonlData);
// console.log("JSONL file created successfully!");






// fintuningModelF() 

// try {
//   const response = await fetch('http://64.227.142.60:5009/api/process', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json'
//     },
//     body: JSON.stringify(
//       {
//         "keyword": "artificial intelligence",
//         "source": ["arxiv"],
//         "N": 2,
//         "converted_source": ["twitter"],
//         "content_types": ["text"]
//       }
//     )
//   });
//   const result = await response.json();
//   console.log('API response:', result );
// } catch (error) {
//   console.error('Error processing content:', error);
// }

app.listen(port, async () => {
  if(fullName) {
    console.log(`Hi ${fullName}! supabase connection established...`)
  }
  else{
    console.log("Some error occured while connecting to supabase server....")
  }
  console.log(`Proxy server is running at http://localhost:${port}`);
});

// const response = await axios.get("https://zkzdqldpzvjeftxbzgvh.supabase.co/storage/v1/object/public/profile-images/uploads/Dalle-avatar-20250226053147227.png", { responseType: 'arraybuffer' });
// const imageBase64 = Buffer.from(response.data).toString('base64');

// console.log("image base 64 = " , imageBase64) ;


// updateProfileInfo() 









export {scheduledJobsMap}




