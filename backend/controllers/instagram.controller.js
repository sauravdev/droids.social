

import schedule from 'node-schedule' ; 
import fetch from 'node-fetch' ;
import { URLSearchParams  } from 'url';
import { scheduledJobsMap } from "../index.js";
import dotenv from 'dotenv' ;
import { loadScheduledJobs , updateScheduledPost } from '../test.js';
import axios from 'axios' ;
import { DateTime } from 'luxon';
dotenv.config() 
const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID; 
const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET;
const INSTAGRAM_REDIRECT_URI =  process.env.INSTAGRAM_REDIRECT_URI;

const generateAccessToken = async (req, res) => {
  const { code } = req.body;
  console.log("Received code:", code);
  if (!code) {
    return res.status(400).json({ error: "Authorization code is required" });
  }

  try {
    // Step 1: Exchange code for Facebook User Access Token
    console.log("Exchanging code for Facebook User Access Token...");
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
      new URLSearchParams({
        client_id: process.env.INSTAGRAM_APP_ID,
        client_secret: process.env.INSTAGRAM_APP_SECRET,
        redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
        code: code,
      }),
      { method: "GET" }
    );
    const tokenData = await tokenResponse.json();
    console.log("Token exchange response:", tokenData);

    if (!tokenData.access_token) {
      return res.status(500).json({ error: "Failed to get access token", details: tokenData });
    }

    const userAccessToken = tokenData.access_token;

    // Step 2: Get user's Facebook Pages
    console.log("Fetching user's Facebook Pages...");
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?access_token=${userAccessToken}`
    );
    const pagesData = await pagesResponse.json();
    console.log("Pages data response:", pagesData);

    if (!pagesData.data || !pagesData.data.length) {
      return res.status(500).json({ error: "No Facebook Pages found" });
    }

    // Step 3: Find the page with an Instagram Business Account connected
    let igBusinessAccountId = null;
    for (const page of pagesData.data) {
      console.log(`Checking page ${page.id} for connected Instagram Business Account...`);
      const pageDetailsResponse = await fetch(
        `https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${userAccessToken}`
      );
      const pageDetails = await pageDetailsResponse.json();
      console.log(`Page ${page.id} details:`, pageDetails);

      if (pageDetails.instagram_business_account) {
        igBusinessAccountId = pageDetails.instagram_business_account.id;
        console.log(`Found Instagram Business Account ID: ${igBusinessAccountId} linked to page ${page.id}`);
        break;
      }
    }
    if (!igBusinessAccountId) {
      return res.status(500).json({ error: "No Instagram Business Account linked to any Page" });
    }

    // Step 4: Return the access token and IG Business Account ID
    res.status(200).json({
      access_token: userAccessToken,
      ig_user_id: igBusinessAccountId,
    });
    console.log("Access token and Instagram Business Account ID sent to client.");
  } catch (error) {
    console.error("Error in Instagram Graph API flow:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getUserInfo = async (req, res) => {
  const { access_token, ig_user_id } = req.body;
  console.log("Access token in user info API:", access_token);
  console.log("Instagram Business Account ID:", ig_user_id);

  if (!access_token || !ig_user_id) {
    return res.status(400).json({ error: "Access token and Instagram User ID are required" });
  }

  try {
    // Fetch Instagram Business Account info
    const userResponse = await fetch(
      `https://graph.facebook.com/v19.0/${ig_user_id}?fields=id,username&access_token=${access_token}`
    );
    const userData = await userResponse.json();
    console.log("Instagram user data:", userData);

    if (userData.error) {
      return res.status(400).json({ error: userData.error.message });
    }

    res.status(200).json(userData);
  } catch (error) {
    console.error("Error fetching Instagram user data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const uploadContent =async (ACCESS_TOKEN , IG_USER_ID , generatedContent  = "This is a sample caption posted from my nodejs application"  , imageUrl , postId = null    ) => {

  // const imageUrl = "https://zkzdqldpzvjeftxbzgvh.supabase.co/storage/v1/object/public/profile-images/uploads/Dalle-slide-20250228155509783-1.png";
  if(postId) 
    {
        await updateScheduledPost(postId , {status : 'published'})
    }
  const caption = generatedContent
  try{

    let response = await fetch(`https://graph.facebook.com/v21.0/${IG_USER_ID}/media`, {
      method: "POST",
      body: new URLSearchParams({
        image_url: imageUrl || "https://zkzdqldpzvjeftxbzgvh.supabase.co/storage/v1/object/public/profile-images/uploads/Dalle-slide-20250228155509783-1.png" ,
        caption: caption,
        access_token: ACCESS_TOKEN,
      }),
    });
    console.log("response  = " , response)  ;
    let data = await response.json();
    const creationId = data.id;
    console.log("creation id ", creationId);
    // Step 2: Publish Media
    const response2 = await fetch(`https://graph.facebook.com/v21.0/${IG_USER_ID}/media_publish`, {
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
  const localTime = DateTime.fromISO(date, { zone: "Asia/Kolkata" });
  const utcTime = localTime.toUTC()
    console.log("Tweet scheduled successfully to be posted at " +utcTime.toISO()  ) ;
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
        const newJob = schedule.scheduleJob(utcTime.toISO() ,  () => { uploadContent(ACCESS_TOKEN , IG_USER_ID ,  caption ,  imageUrl  , jobId )}  ) ;
        scheduledJobsMap.set(jobId , newJob) ; 
       }
       else{
        console.log("scheduling new job")
        const job =schedule.scheduleJob(utcTime.toISO() ,  () => { uploadContent(ACCESS_TOKEN , IG_USER_ID ,  caption ,    imageUrl   , jobId )}  ) ;
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
  console.log("Starting image uploads...");

  const uploadResponses = await Promise.all(imageUrls.map(async (imageUrl, index) => {
    console.log(`Uploading image ${index + 1}: ${imageUrl}`);
    const response = await axios.post(
      `https://graph.facebook.com/v21.0/${IG_USER_ID}/media`,
      {
        image_url: imageUrl,
      },
      {
        headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
      }
    );
    console.log(`Upload response for image ${index + 1}:`, response.data);
    return response;
  }));

  const mediaContainerIds = uploadResponses.map(res => res.data.id).filter(Boolean);
  console.log("Media container IDs:", mediaContainerIds);

  if (mediaContainerIds.length === 0) {
    console.error("No media container IDs were returned.");
    throw new Error("Failed to upload images");
  }

  console.log("Creating carousel with media_container_ids...");

  const carouselResponse = await axios.post(
    `https://graph.facebook.com/v21.0/${IG_USER_ID}/media`,
    {
      media_type: "CAROUSEL",
      children: mediaContainerIds,
      caption
    },
    {
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
    }
  );

  console.log("Carousel creation response:", carouselResponse.data);

  const publishResponse = await axios.post(
    `https://graph.facebook.com/v21.0/${IG_USER_ID}/media_publish`,
    {
      creation_id: carouselResponse.data.id,
    },
    {
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
    }
  );

  console.log("Publish response:", publishResponse.data);
  console.log("Carousel published successfully! Post ID:", publishResponse.data.id);

  return publishResponse.data.id;

} catch (error) {
  console.error("Error publishing carousel:", error.response?.data || error.message);
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
    console.log("access toke ="  ,ACCESS_TOKEN ) ; 
  const localTime = DateTime.fromISO(date, { zone: "Asia/Kolkata" });
  const utcTime = localTime.toUTC()
  try {
    const response  = await loadScheduledJobs() ; 
    if(response) {
      if( scheduledJobsMap.has(jobId) && scheduledJobsMap.get(jobId)?.cancel){
        const job = scheduledJobsMap.get(jobId) 
        console.log("jobb" , job); 
        job.cancel()  ; 
        console.log("cancelling already scheduled job and scheduling a new one" )
        scheduledJobsMap.delete(jobId) 
        const newJob = schedule.scheduleJob(utcTime.toISO()  ,  () => {   publishCarousel(imageUrls , ACCESS_TOKEN , userId , caption , jobId)}  ) ;
        scheduledJobsMap.set(jobId , newJob) ; 
       }
       else{
        console.log("scheduling new job")
        const job =schedule.scheduleJob(utcTime.toISO()  ,  () => { publishCarousel(imageUrls , ACCESS_TOKEN , userId , caption , jobId)}  ) ;
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
