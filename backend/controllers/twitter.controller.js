import { TwitterApi } from 'twitter-api-v2';
import schedule from 'node-schedule' ; 
import fetch from 'node-fetch' ;
import { URLSearchParams  } from 'url';

// const TWITTER_CLIENT_ID = 'Y2RKeWJ2T1hzQ3dxNnBuT3BCUVI6MTpjaQ';
// const TWITTER_CLIENT_SECRET = 'MP0G4dsn7efJqahuJL2HsEm9L9eUBcHtCsLJLVHPF-t9qVMe9Q';
// const REDIRECT_URI = 'http://localhost:5173/callback/twitter';

const TWITTER_CLIENT_ID = 'RU5fRHA4eU4yNGFIWFAxXy1vRHY6MTpjaQ';
const TWITTER_CLIENT_SECRET = 'FAQL-iZ6_0cGjjVEIrF2xqFtJv3lBbBhZkocclY8lZyUAkXee2';
const REDIRECT_URI = `http://localhost:5173/callback/twitter`;


const twitterClient = new TwitterApi({
    appKey:"D7gu7UvfHW6eSnNUQpAPRFnIE",
    appSecret: "dZ88s1jBR0SxdtfFhDTN3qGdUGpEd6h3w4CQlUHwce4IpznJv6",
    accessToken: "1885259563978678273-zafy8O4B6W7eTGdgEFCLfD2eWCgInP",
    accessSecret: "Px704QUdVjanXoW09ilXo96qc34zVRyxrXvZS9uEOVQb9",
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
        redirect_uri: REDIRECT_URI,
        code_verifier,
      }),
    });
    if (!tokenResponse.ok) {
      const error = await tokenResponse.json();
      return res.status(400).json({ error: error.error_description });
    }

    const tokens = await tokenResponse.json();
    console.log(tokens);
    res.json(tokens);
  } catch (error) {
    console.error('Error fetching token:', error);
    res.status(500).json({ error: 'Failed to fetch token' });
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
    res.json(userData);
  } catch (error) {
    console.error('Error fetching user info:', error);
    res.status(500).json({ error: 'Failed to fetch user info' });
  }
}

const postContent = async (data) => {
 
    try {
      const tweetText = data ; 
      const rwClient = twitterClient.readWrite;
      await rwClient.v2.tweet(tweetText);
      console.log("Tweet posted successfully:", tweetText);
      return true  
    } catch (error) {
      console.error("Error posting tweet:", error);
      return false 
    } 
  };


const postContentHandler = async (req , res ) => {
    console.log(req.body);
    const {data} = req.body ;
    if(!data) return res.status(400).json({message : "Bad request : Empty body received"})
    if (  postContent(data ) ) {
      return res.status(201).json({message : "Tweet posted successfully"})
    }
    return res.status(500).json({message : "Something went wrong" })
  }

const schedulePostHandler = async  (req , res ) => {

    const { data  ,date} = req.body ;
    if(!date || !data ) return res.status(400).json({message : "Bad request :Invalid date and data fields"}) ;
    console.log("Tweet scheduled successfully to be posted at " + date.toString() ) ; 
    try{
      schedule.scheduleJob(date ,  () => { postContent(data)}  ) ;
      return res.status(201).json({message:"Scheduled Tweet for " , date })
    }
    catch(error) {
      console.error("Error scheduling tweet:", error);
      return res.status(500).json({message : "Failed to schedule tweet" })
    }
  } 

export {generateAccessToken , getUserInfo  ,postContent , postContentHandler ,schedulePostHandler  }  