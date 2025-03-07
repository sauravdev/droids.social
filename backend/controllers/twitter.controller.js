import { TwitterApi } from 'twitter-api-v2';
import schedule from 'node-schedule' ; 
import fetch from 'node-fetch' ;
import { URLSearchParams  } from 'url';
import dotenv from 'dotenv' ;
import { scheduledJobsMap } from "../index.js";
import { loadScheduledJobs  ,updateScheduledPost } from '../test.js';
// const TWITTER_CLIENT_ID = 'Y2RKeWJ2T1hzQ3dxNnBuT3BCUVI6MTpjaQ';
// const TWITTER_CLIENT_SECRET = 'MP0G4dsn7efJqahuJL2HsEm9L9eUBcHtCsLJLVHPF-t9qVMe9Q';
// const REDIRECT_URI = 'http://localhost:5173/callback/twitter';
dotenv.config() 
const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID;
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET;
const TWITTER_REDIRECT_URI = process.env.TWITTER_REDIRECT_URI;

const twitterClient = new TwitterApi({
    appKey:process.env.Twitter_APP_KEY,
    appSecret: process.env.Twitter_APP_SECRET,
    accessToken: process.env.Twitter_ACCESSS_TOKEN,
    accessSecret: process.env.Twitter_APP_SECRET,
  });


const generateAccessToken = async (req, res) => {
  const { code, code_verifier } = req.body;
  console.log("code =   " + code);
  console.log("code_verifier = " + code_verifier);
  if (!code ||!code_verifier) {
    return res.status(400).json({ error: 'Missing code or code_verifier' });
  }
  try {
    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: TWITTER_REDIRECT_URI,
        code_verifier,
      }),
    });
    if (!tokenResponse.ok) {
      const error = await tokenResponse.json();
      return res.status(400).json({ error: error.error_description });
    }

    const tokens = await tokenResponse.json();
    console.log(tokens);
    return res.json(tokens);
  } catch (error) {
    console.error('Error fetching token:', error);
    return res.status(500).json({ error: 'Failed to fetch token' });
  }
}
const getUserInfo = async (req, res) => {
  const { access_token } = req.headers;
  console.log("access token for user " + access_token);

  if (!access_token) {
    return res.status(400).json({ error: 'Missing access token' });
  }

  try {
    const userResponse = await fetch('https://api.twitter.com/2/users/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });
   
    const userData = await userResponse.json();
    console.log("user data " + JSON.stringify(userData));
    return res.json(userData);
  } catch (error) {
    console.error('Error fetching user info:', error);
    return res.status(500).json({ error: 'Failed to fetch user info' });
  }
}

const getInsights = async ( req  , res ) => {

  await new  Promise((resolve , reject) => {setTimeout(() => {resolve("")} , 5000)})
  const data = {
    followers : 1 , 
    engagement : 63.5 ,
    post : 5 , 
    reach : 100 

  }
  return res.status(200).json({data}) ;
}
const postContent = async (data = "Some random text" , postId = null  ) => {
  if(data == "") {
    data = "Sample data from  nodejs application"
  }
    try {
      const tweetText = data ; 
      const rwClient = twitterClient.readWrite;
      await rwClient.v2.tweet(tweetText);
      console.log("Tweet posted successfully:", tweetText);
      if(postId ) 
      {
        await updateScheduledPost(postId , {status : 'published'} )
      }
      return true  
    
    } catch (error) {
      console.error("Error posting tweet:", error);
      return false 
    } 
  };


const postContentHandler = async (req , res ) => {
    console.log(req.body);
    const {data , postId } = req.body ;
    if(!data) return res.status(400).json({message : "Bad request : Empty body received"})
    if (  postContent(data , postId  ) ) {
      return res.status(201).json({message : "Tweet posted successfully"})
    }
    return res.status(500).json({message : "Something went wrong" })
  }

const schedulePostHandler = async  (req , res ) => {
    const { data  ,date , jobId} = req.body ;
    if(!jobId) 
      {
        return res.status(400).json({ error: "Invalid body : Missing jobId"}) ;
      }
    if(!date || !data ) return res.status(400).json({message : "Bad request :Invalid date and data fields"}) ;
    console.log("Tweet scheduled successfully to be posted at " + date.toString() ) ; 
    try{
      const resposne = await loadScheduledJobs() ; 
       if(resposne) {
        if(scheduledJobsMap.has(jobId  && scheduledJobsMap.get(jobId)?.cancel)){
          const job = scheduledJobsMap.get(jobId) 
          job.cancel()  ; 
          console.log("cancelling already scheduled job and scheduling a new one" )
          scheduledJobsMap.delete(jobId) 
          const newJob = schedule.scheduleJob(date ,  () => { postContent(data = "some random text" , jobId )}  ) ;
          scheduledJobsMap.set(jobId , newJob) ; 
         }
         else{
          console.log("scheduling new job") ; 
          const job = schedule.scheduleJob(date ,  () => { postContent(data = "some random text" , jobId )}  ) ;
          console.log("job = " , job) ;
          scheduledJobsMap.set(jobId , job) ; 
         }
    return res.status(201).json({message:"Scheduled Tweet for " , date })
       }
    }
    catch(error) {
      console.error("Error scheduling tweet:", error);
      return res.status(500).json({message : "Failed to schedule tweet" })
    }
  } 
  

  const getTwitterInsights = async ( req  , res ) => {
    const {id} = req.body ;
    console.log("id = "  , id) ;
    const authHeader = req.header("Authorization") ;
    const ACCESS_TOKEN = authHeader.replace("Bearer " , "") ; 
    if(!id) 
    {
      return res.status(400).json({message : "invalid body : id field is absent"}) ;
    }
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No valid access token provided' });
    }
    try{
      const response = await fetch(`https://api.twitter.com/2/users/${id}?user.fields=public_metrics` , {
        headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
      })
      const data = await response.json() ; 
      const insights = {
        followers : data?.followers , 
        reach : data?.reach , 
        post : data?.post , 
        engagement : data?.engagement 

      }

      return res.status(200).json(insights) ;  
    }
    catch(error) 
    {
      console.log("Something went wrong " , error || error?.message) ; 
      return res.status(500).json(`Something went wrong ${error?.message}`) ; 
    }
  }

  const updateProfileInfo = async (req , res ) => {
    const {name , bio , avatar } = req.body ; 
    console.log("req body = " , req.body)  ;
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
myHeaders.append("Cookie", "guest_id=v1%3A174047070539156476; guest_id_ads=v1%3A174047070539156476; guest_id_marketing=v1%3A174047070539156476; personalization_id=\"v1_ukYfe4WD/MYETqVKvPJHeA==\"; lang=en");

const urlencoded = new URLSearchParams();
  urlencoded.append("name", name);
  urlencoded.append("description", bio );
  urlencoded.append("oauth_consumer_key", "q3YtflSi3IPte1PjEpS4kwHql");
  urlencoded.append("oauth_token", "1882376046340866048-VAnej1QhJB8viefa3BCH1qRM7utYpz");
  urlencoded.append("oauth_signature_method", "HMAC-SHA1");
  urlencoded.append("oauth_timestamp", "1740773326");
  urlencoded.append("oauth_nonce", "OpAfc9TVg3p");
  urlencoded.append("oauth_version", "1.0");
  urlencoded.append("oauth_signature", "HiK8reBzXxg+me2+DcIEOuDeGrA=");

const requestOptions = {
  method: "POST",
  headers: myHeaders,
  body: urlencoded,
  redirect: "follow"
};
    try{
      const response  = await fetch("https://api.x.com/1.1/account/update_profile.json", requestOptions) ; 
      const data  = await response.json() ; 
      console.log(data); 
      return res.status(200).json(data )
    }
    catch(err) 
    {
      console.log(err) ; 
      // return res.status(500).json({message : "Something went wrong"}) 
    }
    
} 


export {generateAccessToken , getUserInfo  ,postContent , postContentHandler ,schedulePostHandler  ,getInsights , updateProfileInfo ,getTwitterInsights }  