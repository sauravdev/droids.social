// import {scheudleJobMap} from ''
import { scheduledJobsMap } from "../index.js";
import { loadScheduledJobs , updateScheduledPost } from "../test.js";
import { PDFDocument } from 'pdf-lib';
const linkedInClientId = '77zwm3li56ua2a';
const linkedInClientSecret = 'WPL_AP1.FTEeZCfxW20evekT.BoujnA==';
const redirectUri = 'http://127.0.0.1:5173/linkedin/callback/auth/linkedIn';
import schedule from 'node-schedule' ; 
import axios from 'axios'
import fs from 'fs' ; 
const generateAccessToken = async (req , res ) => {
  const { code } = req.body;
  try {
    const response = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: linkedInClientId,
        client_secret: linkedInClientSecret,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        code: code,
      }),
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    return res.status(500).json({error : error.message || "Something went wrong"})
  }
}

const getUserInfo = async (req  , res ) => {
  const {access_token} = req.params ;
  try {
    const response = await fetch("https://api.linkedin.com/v2/userinfo", {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json'
        }
    });
    const data = await response.json();
    console.log('User Info:', data);
    return res.status(200).json(data);
} catch (error) {
    console.error('Error fetching LinkedIn user info:', error);
}
}


const uploadContent = async (accessToken , id ,postId = null , text = "Certainly! SocialBee offers various valuable properties such as user-friendly in management."  ) => {
  
  try{
    const response = await fetch("https://api.linkedin.com/v2/rest/posts", {
      method: "POST",
      headers: {
          'LinkedIn-Version': 202401,
          'X-Restli-Protocol-Version': "2.0.0" ,
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
      "author": `urn:li:person:${id}`,
      "commentary": `${text}`,
      "visibility": "PUBLIC",
      "distribution": {
        "feedDistribution": "MAIN_FEED",
        "targetEntities": [],
        "thirdPartyDistributionChannels": []
      },
      "lifecycleState": "PUBLISHED",
      "isReshareDisabledByAuthor": false
      }),
      
    } )
    if(postId) 
    {
      await updateScheduledPost(postId , {status : 'published'})
    }
    console.log("linkedin scheduled post published successfully")
  }
  catch(err) 
  {
    console.log(err ) ; 
    return null ;
  }
}

const uploadContentHandler = async (req , res ) => {
  const { id   , text  , postId  } = req.body ; 
  console.log(req.body) ;
  const authHeader = req.header("Authorization")
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No valid access token provided' });
  }

  // add validation for text
  if(!id) 
  {
    return res.status(400).json({message : "invalid body"})
  }
  const accessToken = authHeader.replace("Bearer " , "") ; 
  console.log("accessToken" , accessToken) ;
  try{
      await  uploadContent(accessToken , id , postId    )
      return res.status(201).json({message : `post uploaded successfully`})
  }
  catch(err) 
  {
    return res.status(500).json({message :err ||  "something went wrong"})  ;
  }
}


const scheduleContentHandler = async (req  , res ) => {
  const {id   ,text  , date , jobId } = req.body ; 
  const authHeader = req.header("Authorization")
  if(!jobId) 
    {
      return res.status(400).json({ error: "Invalid body : Missing jobId"}) ;
    }
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No valid access token provided' });
  }
  if(!id || !date || !text ) {
    return res.status(400).json({message : "Invalid body : Incomplete data recieved"})  ;  // date is required  in the request body.  // should validate date format as well.  // date should be in ISO 8601 format.  // date should be in future.  // date should not be in past.   // date should not be in the past.   // date should not be in the past.   // date should not be in the past.   // date should not be in the past.   // date should not be in the past.   // date should not be in the past.   // date should not be in the past.   // date should not be in the past.   // date should not be in the past.   // date should not be in the past.   // date should not be in the past.   // date should not be in the past.   // date should not be in the
  }
  const accessToken = authHeader.replace("Bearer " , "") ; 
  try{
    const response = await loadScheduledJobs() ;
    if(response) {
      if(scheduledJobsMap.has(jobId) && scheduledJobsMap.get(jobId)?.cancel){
        const job = scheduledJobsMap.get(jobId) 
        job.cancel()  ; 
        console.log("cancelling already scheduled job and scheduling a new one" )
        scheduledJobsMap.delete(jobId) 
        const newJob = schedule.scheduleJob(date ,  () => { uploadContent(accessToken , id  , jobId )}  ) ;
        scheduledJobsMap.set(jobId , newJob) ; 
       }
       else{
        console.log("scheduling new job") ;
        const job = schedule.scheduleJob(date ,  () => { uploadContent(accessToken , id  , jobId )}  ) ;
        console.log("job = " , job) ;
        scheduledJobsMap.set(jobId , job) ; 
       }
      return res.status(201).json({message:"Scheduled Instagam post for " , date })
    }
  }
  catch(err) 
  {
    console.log(err?.message || "Something went wrong"); 
    res.status(500).json({message : err?.code || "Something went wrong"} );

  }

}


const postLinkedinCarousel = async (req, res) => {
  const {caption , id } = req.body; 
  console.log("caption = " , caption ) ; 
  console.log("id = " , id ) ; 
  const authHeader = req.header("Authorization")
  if(!id) 
    {
      return res.status(400).json({message : "invalid body"})
    }
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No valid access token provided' });
  }
 

  if (!req.file) {
    return res.status(400).json({ error: 'No PDF file uploaded' });
  }
  console.log("req file = " , req.file)
  const accessToken = authHeader.replace("Bearer " , "") ; 
  console.log("accessToken" , accessToken) ;
  
  try {
    const filePath = req.file.path;
    const registerResponse = await axios.post(
        "https://api.linkedin.com/v2/assets?action=registerUpload",
        {
          "registerUploadRequest": {
            "owner": `urn:li:person:${id}`,
            "recipes": ["urn:li:digitalmediaRecipe:document"],
            "serviceRelationships": [
              {
                "relationshipType": "OWNER",
                "identifier": "urn:li:userGeneratedContent"
              }
            ]
          }
        },
        { headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" } }
    );

    const asset = registerResponse.data.value.asset;
    const uploadUrl = registerResponse.data.value.uploadMechanism["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"].uploadUrl;
    const pdfData = fs.readFileSync(filePath);
    await axios.put(uploadUrl, pdfData, {
        headers: { "Content-Type": "application/pdf" },
    });
    const publishResponse = await axios.post(
        "https://api.linkedin.com/v2/ugcPosts",
        {
            author: `urn:li:person:${id}`,
            lifecycleState: "PUBLISHED",
            specificContent: {
                "com.linkedin.ugc.ShareContent": {
                    shareCommentary: { text: "Check out this document!" },
                    shareMediaCategory: "DOCUMENT",
                    media: [{ status: "READY", description: { text: "PDF Carousel" }, media: asset, title: { text: "My PDF" } }],
                },
            },
            visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
        },
        { headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" } }
    );

    res.json({ message: "PDF Uploaded and Post Created!", postResponse: publishResponse.data });
} catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to upload PDF" });
}



};


const postMultipleImagesLinkedin = async (req , res ) => {
  const imageUrls = [
  "https://zkzdqldpzvjeftxbzgvh.supabase.co/storage/v1/object/public/profile-images/uploads/Dalle-slide-20250220084749049-1.png",
  "https://zkzdqldpzvjeftxbzgvh.supabase.co/storage/v1/object/public/profile-images/uploads/Dalle-slide-20250220084809260-2.png",
  "https://zkzdqldpzvjeftxbzgvh.supabase.co/storage/v1/object/public/profile-images/uploads/Dalle-slide-20250220084823063-3.png"]
  console.log("image urls = " , imageUrls) 
  const {  caption , id } = req.body; 
  console.log("caption = " , caption ) ; 
  console.log("id = " , id ) ; 
  const authHeader = req.header("Authorization")
  if(!id) 
    {
      return res.status(400).json({message : "invalid body"})
    }
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No valid access token provided' });
  }
  const accessToken = authHeader.replace("Bearer " , "") ; 
  console.log("accessToken" , accessToken) ;
  try {
    const postData = {
        author: `urn:li:person:${id}`,
        lifecycleState: "PUBLISHED",
        specificContent: {
            "com.linkedin.ugc.ShareContent": {
                shareCommentary: { text: caption  },
                shareMediaCategory: "IMAGE",
                media: imageUrls.map((url) => ({
                    status: "READY",
                    originalUrl: url, 
                })),
            },
        },
        visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    };

    const postResponse = await axios.post(
        "https://api.linkedin.com/v2/ugcPosts",
        postData,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        }
    );

    console.log("Post created:", postResponse.data);
    return res.status(201).json({message : "carousel posted on linkedin"})
} catch (error) {
    console.error("Error creating post:", error )  ;
    return res.status(500).json({message : `Something went wrong = ${ error}`})
}
}

export {generateAccessToken ,getUserInfo , uploadContentHandler , scheduleContentHandler  , postLinkedinCarousel , postMultipleImagesLinkedin } 