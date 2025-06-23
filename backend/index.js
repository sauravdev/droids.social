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
import crypto from 'crypto'; 
import querystring from 'querystring' ;
import OAuth from 'oauth-1.0a';
import { googleOAuthRouter } from './routes/googleOAuth.route.js';
import { grokApiRouter } from './routes/grok-api.route.js';
import jwt from 'jsonwebtoken' ;
import razorpayRouter from './routes/razorpayPayment.route.js';
import { videoGenRouter } from './routes/videoGen.route.js';
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
app.use(googleOAuthRouter); 
app.use(grokApiRouter); 
app.use(razorpayRouter) ;
app.use(videoGenRouter) ; 



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



const AK = "ATg988yrLBTLgPnB83mBGG8fLfKMLana"; 
const SK = "Lp4BLyYfk8bHJCH3pQG9JKyJ9YmPtGTd";

function encodeJwtToken(ak, sk) {
  const headers = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const payload = {
    iss: ak,
    exp: Math.floor(Date.now() / 1000) + 1800, // Current time + 1800s (30min)
    nbf: Math.floor(Date.now() / 1000) - 5    // Current time - 5s
  };
  
  const token = jwt.sign(payload, sk, { header: headers });
  return token;
}

const authorization = encodeJwtToken(AK, SK);
console.log(authorization);





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



app.post('/api/getRequestToken' , async (req, res) => {
  const oauth = OAuth({
    consumer: {
      key: process.env.Twitter_APP_KEY,
      secret: process.env.Twitter_APP_SECRET
    },
    signature_method: 'HMAC-SHA1',
    hash_function(base_string, key) {
      return crypto.createHmac('sha1', key).update(base_string).digest('base64');
    },
  });
  const url = 'https://api.twitter.com/oauth/request_token';
  const method = 'POST';
  const callback = process.env.TWITTER_REDIRECT_URI;

  const request_data = {
    url,
    method,
    data: {
      oauth_callback: callback,
    },
  };

  const headers = {
    ...oauth.toHeader(oauth.authorize(request_data)),
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const body = querystring.stringify({ oauth_callback: callback });

  console.log('Headers:', headers);
  console.log('Body:', body);

  try {
    const response = await fetch(url, {
      method,
      headers,
      body,
    });

    const text = await response.text();
    console.log('Twitter Response:', text);

    const params = querystring.parse(text);
    if (params.oauth_token && params.oauth_token_secret) {
      return res.json({
        oauth_token: params.oauth_token,
        oauth_token_secret: params.oauth_token_secret,
        authorization_url: `https://api.twitter.com/oauth/authorize?oauth_token=${params.oauth_token}`,
      });
    } else {
      throw new Error('Invalid response from Twitter');
    }
  } catch (error) {
    console.error('Error fetching request token:', error);
    res.status(500).json({ error: 'Failed to fetch request token' });
  }
});


app.post('/api/getAccessToken' , async (req, res) => {
  const { oauth_token, oauth_verifier } = req.body;
  if (!oauth_token || !oauth_verifier) {
    return res.status(400).json({ error: 'Missing oauth_token or oauth_verifier' });
  }

  try {
    const response = await fetch('https://api.twitter.com/oauth/access_token', {
      method: 'POST',
      headers: {
        Authorization: `OAuth oauth_consumer_key="${process.env.Twitter_APP_KEY}", oauth_nonce="${crypto.randomBytes(16).toString('hex')}", oauth_signature_method="HMAC-SHA1", oauth_timestamp="${Math.floor(Date.now() / 1000)}", oauth_version="1.0"`,
      },
      body: new URLSearchParams({
        oauth_token,
        oauth_verifier,
      }),
    });

    const data = await response.text();
    const params = querystring.parse(data);

    if (params.oauth_token && params.oauth_token_secret) {
      console.log('Access Token:', params);
      return res.json({
        access_token: params.oauth_token,
        access_token_secret: params.oauth_token_secret,
      });
    } else {
      throw new Error('Failed to obtain access token');
    }
  } catch (error) {
    console.error('Error fetching access token:', error);
    return res.status(500).json({ error: 'Failed to fetch access token' });
  }
}
)







export {scheduledJobsMap}




