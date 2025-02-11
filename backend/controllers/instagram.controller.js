

import schedule from 'node-schedule' ; 
import fetch from 'node-fetch' ;
import { URLSearchParams  } from 'url';

const INSTAGRAM_APP_ID = "1074024207741727"; 
const INSTAGRAM_APP_SECRET = "d23b1129f266b193ae8ade404851eae6";
const INSTAGRAM_REDIRECT_URI =  "https://39f6-103-66-61-91.ngrok-free.app/auth/instagram";

const generateAccessToken = async (req, res) => {
  const { code } = req.body;
  console.log("code = " , code)  ;
  if (!code) {
    return res.status(400).json({ error: "Authorization code is required" });
  }

  try {
    const tokenResponse = await fetch(
      `https://api.instagram.com/oauth/access_token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: INSTAGRAM_APP_ID,
          client_secret: INSTAGRAM_APP_SECRET,
          grant_type: "authorization_code",
          redirect_uri: INSTAGRAM_REDIRECT_URI,
          code: code,
        }),
      }
    );

    
    const tokenData = await tokenResponse.json();
    console.log("tokenData" , tokenData) ; 
    if(!tokenData)
    {
      return res.status(500).json({error :  "Something went wrong : while fetching token"}) ;
    }
    const { access_token, user_id } = tokenData;
    console.log("Access token: " + access_token) ;
    res.status(200).json({
      access_token: access_token,
      user_id,
    });
  } catch (error) {
    console.error("Error exchanging Instagram token:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
const getUserInfo = async (req, res) => {
  const { access_token } = req.params;
  console.log("access token in me api " , access_token);

  if (!access_token) {
    return res.status(400).json({ error: "Access token is required" });
  }

  try {
    const userResponse = await fetch(
      `https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${access_token}`
    );

    const userData = await userResponse.json();
    console.log("userData = " , userData )

    if (userData.error) {
      return res.status(400).json({ error: userData.error.message });
    }

    res.status(200).json(userData);
  } catch (error) {
    console.error("Error fetching Instagram user data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}


const uploadContent =async (ACCESS_TOKEN , IG_USER_ID , generatedContent) => {

  const imageUrl = "https://res.cloudinary.com/dbnivp7nr/image/upload/v1731472487/bsuvfszuay9rp8odnbrd.jpg";
  const caption = generatedContent
  try{

    let response = await fetch(`https://graph.instagram.com/v19.0/${IG_USER_ID}/media`, {
      method: "POST",
      body: new URLSearchParams({
        image_url: imageUrl,
        caption: caption,
        access_token: ACCESS_TOKEN,
      }),
    });
    let data = await response.json();
    const creationId = data.id;
    console.log("creation id ", creationId);
    // Step 2: Publish Media
    const response2 = await fetch(`https://graph.instagram.com/v19.0/${IG_USER_ID}/media_publish`, {
      method: "POST",
      body: new URLSearchParams({
        creation_id: creationId,
        access_token: ACCESS_TOKEN,
      }),
    });

    console.log(await response2.json() )
    return true ; 

  }
  catch(err) 
  {
    console.log(err) ; 
    return false; 
  }
}

const uploadContentHandler = async (req  , res ) => {
    const {caption} = req.body ; 
    const ACCESS_TOKEN = "IGAAPQ0b9h8x9BZAE9pMXNtR1NFR01TRnppMWJPMjVvS1VHdzVLMDEyT0FCZAVliNThGeFZAhaGdxOENuX1VGZA29RbTVCcTVvQkF6QnVSRHNQZAkg0Y252bV93ZAVVZAQkxWbDYyakZAud3JOZAWQ3YzRPM2hPWldPV004MFVIaWphRUMzaHY4XzR6QTY2ZAXl3";
    const IG_USER_ID ="8985857874796578";
    if ( await uploadContent(ACCESS_TOKEN , IG_USER_ID , caption) ) 
       {return res.status(201).json({message  :"Content posted successfully"})}
    else { return res.status(500).json({message : "Something went wrong"}) } 
  } 

const scheduleContentHandler = async (req , res ) => {
  // schedule job 
  const ACCESS_TOKEN = "IGAAPQ0b9h8x9BZAE9pMXNtR1NFR01TRnppMWJPMjVvS1VHdzVLMDEyT0FCZAVliNThGeFZAhaGdxOENuX1VGZA29RbTVCcTVvQkF6QnVSRHNQZAkg0Y252bV93ZAVVZAQkxWbDYyakZAud3JOZAWQ3YzRPM2hPWldPV004MFVIaWphRUMzaHY4XzR6QTY2ZAXl3";
  const IG_USER_ID ="8985857874796578";
  const { date  , caption } = req.body ;
  console.log(req.body);
  
  if(!date || !caption ) return res.status(400).json({message : "Bad request :Invalid date and caption fields"}) ;
  console.log("Instagram post scheduled successfully to be posted at " + date.toString() ) ; 
  try{
    schedule.scheduleJob(date ,  () => { uploadContent(ACCESS_TOKEN , IG_USER_ID ,  caption)}  ) ;
    return res.status(201).json({message:"Scheduled Instagam post for " , date })
  }
  catch(error) {
    console.error("Error scheduling instagram post:", error);
    return res.status(500).json({message : "Failed to schedule instagram post" })
  }
}
export {generateAccessToken , getUserInfo  , uploadContentHandler , scheduleContentHandler }
