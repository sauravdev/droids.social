

import schedule from 'node-schedule' ; 
import fetch from 'node-fetch' ;
import { URLSearchParams  } from 'url';
import { scheduledJobsMap } from "../index.js";
import dotenv from 'dotenv' ;
import { loadScheduledJobs , updateScheduledPost } from '../test.js';
import axios from 'axios' ;
dotenv.config() 
const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID; 
const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET;
const INSTAGRAM_REDIRECT_URI =  process.env.INSTAGRAM_REDIRECT_URI;

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

    console.log("token response = " , tokenResponse) ; 
    
    const tokenData = await tokenResponse.json();
    console.log("tokenData" , tokenData) ; 
    if(!tokenData)
    {
      return res.status(500).json({error :  "Something went wrong : while fetching token"}) ;
    }
    const { access_token, user_id } = tokenData;
    const longLivedTokenResponse = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${INSTAGRAM_APP_SECRET}&access_token=${access_token}`
    );

    const longLivedTokenData = await longLivedTokenResponse.json();
    console.log("Long-lived tokenData:", longLivedTokenData);

    if (!longLivedTokenData.access_token) {
      return res
        .status(500)
        .json({ error: "Something went wrong while fetching long-lived token" });
    }
    res.status(200).json({
      access_token: longLivedTokenData.access_token,
      user_id , 
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


const uploadContent =async (ACCESS_TOKEN , IG_USER_ID , generatedContent  = "This is a sample caption posted from my nodejs application"  , imageUrl , postId = null    ) => {

  // const imageUrl = "https://zkzdqldpzvjeftxbzgvh.supabase.co/storage/v1/object/public/profile-images/uploads/Dalle-slide-20250228155509783-1.png";
  if(postId) 
    {
        await updateScheduledPost(postId , {status : 'published'})
    }
  const caption = generatedContent
  try{

    let response = await fetch(`https://graph.instagram.com/v19.0/${IG_USER_ID}/media`, {
      method: "POST",
      body: new URLSearchParams({
        image_url: imageUrl || "https://zkzdqldpzvjeftxbzgvh.supabase.co/storage/v1/object/public/profile-images/uploads/Dalle-slide-20250228155509783-1.png" ,
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

    console.log(await response2.json() ) ;
  
    return true ; 
   
  }
  catch(err) 
  {
    console.log(err) ; 
    return false; 
  }
}

const uploadContentHandler = async (req  , res ) => {
    const {IG_USER_ID , caption , postId , imageUrl } = req.body ; 
    const authHeader = req.header("Authorization") ; 
    if(!imageUrl) 
    {
      return res.status(400).json({error  :"Invalid body : No imageUrl provided"}) ;
    }
    if(!IG_USER_ID){
      return res.status(400).json({ error: "Invalid body : Missing IG_USER_ID"}) ;
    }
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No valid access token provided' });
  }
    const ACCESS_TOKEN = authHeader.replace('Bearer ', '')
    console.log("Access token recieved in header" , ACCESS_TOKEN) ; 
    if ( await uploadContent(ACCESS_TOKEN , IG_USER_ID , caption ,   imageUrl   ,postId  ) ) 
       {return res.status(201).json({message  :"Content posted successfully"})}
    else { return res.status(500).json({message : "Something went wrong"}) } 
  } 

const scheduleContentHandler = async (req , res ) => {
  const { IG_USER_ID , date  , caption  ,   imageUrl ,  jobId  } = req.body ;
  console.log(req.body);
  if(!imageUrl ) 
  {
    return res.status(400).json({message  :"Invalid body  : Image Url is missing"})
  }
  if(!jobId) 
  {
    return res.status(400).json({ error: "Invalid body : Missing jobId"}) ;
  }
  const authHeader = req.header("Authorization") ;
  const ACCESS_TOKEN = authHeader.replace("Bearer " , "") ; 
  if(!IG_USER_ID) 
  {
      return res.status(400).json({ error: "Invalid body : Missing IG_USER_ID"})
  }
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No valid access token provided' });
  }
  if(!date || !caption ) return res.status(400).json({message : "Bad request :Invalid date and caption fields"}) ;
  console.log("Instagram post scheduled successfully to be posted at " + date.toString() ) ; 
  
  try{
    const response  = await loadScheduledJobs() ; 
    if(response) {
      // 
      if( scheduledJobsMap.has(jobId) && scheduledJobsMap.get(jobId)?.cancel){
        const job = scheduledJobsMap.get(jobId) 
        console.log("jobb" , job); 
        job.cancel()  ; 
        console.log("cancelling already scheduled job and scheduling a new one" )
        scheduledJobsMap.delete(jobId) 
        const newJob = schedule.scheduleJob(date ,  () => { uploadContent(ACCESS_TOKEN , IG_USER_ID ,  caption ,  imageUrl  , jobId )}  ) ;
        scheduledJobsMap.set(jobId , newJob) ; 
       }
       else{
        console.log("scheduling new job")
        const job =schedule.scheduleJob(date ,  () => { uploadContent(ACCESS_TOKEN , IG_USER_ID ,  caption ,    imageUrl   , jobId )}  ) ;
        console.log("job = " , job) ;
        scheduledJobsMap.set(jobId , job) ; 
       }
    return res.status(201).json({message:"Scheduled Instagam post for " , date })
    }
    
  }
  catch(error) {
    console.error("Error scheduling instagram post:", error);
    return res.status(500).json({message : "Failed to schedule instagram post" })
  }
}
async function publishCarousel(imageUrls , ACCESS_TOKEN , IG_USER_ID , caption , postId = null ) {
  console.log(imageUrls)
  if(postId) 
    {
      await updateScheduledPost(postId , {status : 'published'})
    }
  try {
    const mediaContainerIds = [];
    for (const imageUrl of imageUrls) {
      const uploadResponse = await axios.post(
        `https://graph.instagram.com/v19.0/${IG_USER_ID}/media`,
        {
          image_url: imageUrl,
          caption
        },
        {
          headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
        }
      );
      if (uploadResponse.data.id) {
        mediaContainerIds.push(uploadResponse.data.id);
      }
    }
    if (mediaContainerIds.length === 0) {
      throw new Error("Failed to upload images");
    }
    const carouselResponse = await axios.post(
      `https://graph.instagram.com/v19.0/${IG_USER_ID}/media`,
      {
        media_type: "CAROUSEL",
        children: mediaContainerIds,
        caption 
      },
      {
        headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
      }
    );
    const publishResponse = await axios.post(
      `https://graph.instagram.com/v19.0/${IG_USER_ID}/media_publish`,
      {
        creation_id: carouselResponse.data.id,
      },
      {
        headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
      }
    );

    console.log("Carousel published successfully! Post ID:", publishResponse.data.id);
 
    return publishResponse.data.id;
  } catch (error) {
    console.error("Error publishing carousel:", error.message || error.response?.data || error.message);
  }
}

const publishInstagramCarousel = async (req, res) => {
  const {imageUrls  , userId , caption }  = req.body;
  console.log("caption = " , caption ) ; 
  const authHeader = req.header("Authorization") ;
  if(!caption ) 
  {
    return res.status(400).json({error : "Please provide caption"})
  }
  if(!userId) 
    {
        return res.status(400).json({ error: "Invalid body : Missing IG_USER_ID"})
    }
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No valid access token provided' });
    }
    const ACCESS_TOKEN = authHeader.replace('Bearer ', '')
    console.log("access toke ="  ,ACCESS_TOKEN ) 
  try {
    const postId = await publishCarousel(imageUrls , ACCESS_TOKEN , userId , caption);
    res.status(200).json({
      success: true,
      message: "Carousel post published successfully!",
      postId,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error publishing carousel post",
      error: error.message,
    });
  }
}
const scheduleInstagramCarousel = async (req  , res ) => {
  const {imageUrls  , userId , date  ,  caption , jobId}  = req.body;
  console.log("body  = ", req.body );
  const authHeader = req.header("Authorization") ;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No valid access token provided' });
  }
  if(!jobId || !imageUrls || !userId || !date || !caption  ) 
  {
      return res.status(400).json({ error: "Invalid body"}) ;
  }
    const ACCESS_TOKEN = authHeader.replace('Bearer ', '')
    console.log("access toke ="  ,ACCESS_TOKEN ) 
  try {
    const response  = await loadScheduledJobs() ; 
    if(response) {
      if( scheduledJobsMap.has(jobId) && scheduledJobsMap.get(jobId)?.cancel){
        const job = scheduledJobsMap.get(jobId) 
        console.log("jobb" , job); 
        job.cancel()  ; 
        console.log("cancelling already scheduled job and scheduling a new one" )
        scheduledJobsMap.delete(jobId) 
        const newJob = schedule.scheduleJob(date ,  () => {   publishCarousel(imageUrls , ACCESS_TOKEN , userId , caption , jobId)}  ) ;
        scheduledJobsMap.set(jobId , newJob) ; 
       }
       else{
        console.log("scheduling new job")
        const job =schedule.scheduleJob(date ,  () => { publishCarousel(imageUrls , ACCESS_TOKEN , userId , caption , jobId)}  ) ;
        console.log("job = " , job) ;
        scheduledJobsMap.set(jobId , job) ; 
       }
    return res.status(201).json({message:"Scheduled Instagam CAROUSEL for " , date })
    }


  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error publishing carousel post",
      error: error.message,
    });
  }

}

export {generateAccessToken , getUserInfo  , uploadContentHandler , scheduleContentHandler  , publishInstagramCarousel , scheduleInstagramCarousel}
