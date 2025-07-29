// import {scheudleJobMap} from ''
import { scheduledJobsMap } from "../index.js";
import { loadScheduledJobs , updateScheduledPost } from "../test.js";
import schedule from 'node-schedule' ; 
import dotenv from 'dotenv' ;
import axios from 'axios'
import fs from 'fs' ; 
import { DateTime } from 'luxon';
dotenv.config() 
const linkedInClientId = process.env.linkedInClientId;
const linkedInClientSecret = process.env.linkedInClientSecret;
const linkedInRedirectURI = process.env.linkedInRedirectURI;

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
        redirect_uri: linkedInRedirectURI,
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


const formatPostText = (text) => {
  if (!text) return "this is a sample post";

  return text
    .replace(/\\n/g, '\n')   
    .replace(/\s+\n/g, '\n')
    .trim();
};


const uploadContent = async (accessToken , id ,postId = null , rawText  ) => {
  const text = formatPostText(rawText);
  console.log("body = " , JSON.stringify({
        "author": `urn:li:person:${id}`,
        "commentary":  text || "this is a sample post" ,
        "visibility": "PUBLIC",
        "lifecycleState": "PUBLISHED",
        "distribution": {
          "feedDistribution": "MAIN_FEED",
          "targetEntities": [],
          "thirdPartyDistributionChannels": []
        }
      }))
  try{
    const response = await fetch("https://api.linkedin.com/rest/posts", {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'LinkedIn-Version': '202503',
        'X-Restli-Protocol-Version': '2.0.0',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "author": `urn:li:person:${id}`,
        "commentary":  text || "this is a sample post" ,
        "visibility": "PUBLIC",
        "lifecycleState": "PUBLISHED",
        "distribution": {
          "feedDistribution": "MAIN_FEED",
          "targetEntities": [],
          "thirdPartyDistributionChannels": []
        }
      }),
      
    } )
    console.log("response = " , response) ; 
    // console.log("-----------> " , await response.json() ) ; 
    if(postId) 
    {
      const post = await updateScheduledPost(postId , {status : 'published'}) ; 
      console.log("post => " , post) ;
    }
    console.log("linkedin  post published successfully"  ) ; 
  }
  catch(err) 
  {
    console.log(err ) ; 
    return null ;
  }
}

const uploadContentHandler = async (req , res ) => {
  const { id   , text  , postId  } = req.body ; 
  const authHeader = req.header("Authorization")
  console.log(req.body) ;
  if(!text || !id) 
  {
    return res.status(400).json({message  : "Invalid body "})
  }
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No valid access token provided' });
  }
  // add validation for text
  const accessToken = authHeader.replace("Bearer " , "") ; 
  console.log("accessToken" , accessToken) ;
  try{
      await  uploadContent(accessToken , id , postId  , text    )
      return res.status(201).json({message : `post uploaded successfully`})
  }
  catch(err) 
  {
    return res.status(500).json({message :err ||  "something went wrong"})  ;
  }
}


const scheduleContentHandler = async (req  , res ) => {
  const {id   ,text  , date , jobId } = req.body ; 
  const authHeader = req.header("Authorization") ;
  if(!jobId) 
    {
      return res.status(400).json({ error: "Invalid body : Missing jobId"}) ;
    }
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No valid access token provided' });
  }
  if(!id || !date || !text ) {
    return res.status(400).json({message : "Invalid body : Incomplete data recieved"})  ; 
  }
  const accessToken = authHeader.replace("Bearer " , "") ; 
  try{
    const response = await loadScheduledJobs() ;
    const localTime = DateTime.fromISO(date, { zone: "Asia/Kolkata" });
     const utcTime = localTime.toUTC()
       console.log("Tweet scheduled successfully to be posted at " +utcTime.toISO()  ) ;
    if(response) {
      if(scheduledJobsMap.has(jobId) && scheduledJobsMap.get(jobId)?.cancel){
        const job = scheduledJobsMap.get(jobId) 
        job.cancel()  ; 
        console.log("cancelling already scheduled job and scheduling a new one" )
        scheduledJobsMap.delete(jobId) 
        const newJob = schedule.scheduleJob(utcTime.toISO() ,  () => { uploadContent(accessToken , id  , jobId , text  )}  ) ;
        scheduledJobsMap.set(jobId , newJob) ; 
       }
       else{
        console.log("scheduling new job") ;
        const job = schedule.scheduleJob(utcTime.toISO() ,  () => { uploadContent(accessToken , id  , jobId , text  )}  ) ;
        console.log("job = " , job) ;
        scheduledJobsMap.set(jobId , job) ; 
       }
      return res.status(201).json({message:"Scheduled linkedin post for " , date })
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
  if(!id || !caption ) 
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