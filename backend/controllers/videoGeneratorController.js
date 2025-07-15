import jwt from 'jsonwebtoken' ; 
import {updateContentPlan} from './supabase.controller.js'
function encodeJwtToken() {
  const ak = "ATg988yrLBTLgPnB83mBGG8fLfKMLana"; 
  const sk = "Lp4BLyYfk8bHJCH3pQG9JKyJ9YmPtGTd";
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

const checkStatus = async (taskId , authorization) => {
  console.log("task id = "  , taskId)  ;  
  const response = await fetch(`https://api-singapore.klingai.com/v1/videos/text2video/${taskId}`, {
    headers: {
      "Content-Type" : "application/json",
      'Authorization': `Bearer ${authorization}`
    }
  });
  const data = await response.json() ; 
  console.log("current status ..... = " ,data ) ; 
  return data ;
};


const generateKlingVideo = async (prompt , authorization) => {
  const body =  JSON.stringify({
    "prompt": prompt,
    "duration": "10"}
  )
  const headers =   {
    "Content-Type" : "application/json",
    "Authorization" : `Bearer ${authorization}`

  }
  const response = await fetch('https://api-singapore.klingai.com/v1/videos/text2video', {
    method: 'POST',
    headers , 
    body 
  });
  
  const data = await response.json();

  console.log("response from video generation api = " , data)  ; 

  if(data?.code === 1102) 
  {
    return {
    status: data?.data?.task_status || 'processing',
    code : 1102
  };
  }

  if(data?.code === 1200) 
  {
    throw Error("Too many request") ;
  }

  return {
    status: data?.data?.task_status || 'processing',
    task_id: data?.data?.task_id ,
    video_url: data.video?.url || null,
    eta: data.eta || 30 
  };
};



const get5sVideoUrl = async (req , res ) => {

  const {prompt , planId , userId } =  req.body ; 
  console.log("req  body in video gen api  = " , req.body) ;
  if(!prompt || !planId || !userId ) 
  {
    return  res.status(400).json({error: "Invalid body"}) ; 
  }
  const authorization = encodeJwtToken();
  console.log("video generation token = " ,  authorization) ;
  const result = await generateKlingVideo(prompt  , authorization);
  console.log("response in getvideourl api = " , result) ; 
  if(result?.code == 1102) 
  {
    console.log("limit reached ...................") ; 
    return res.status(429).json({message : "account balance not enough to generate the video"}) ;
  }
  if (result.video_url) {

   
     return res.status(200).json({
        video_url: 
        result.video_url,
        task_id: result?.task_id
      });
  } else if (result.task_id) {
      
    let status;
    do {
      await new Promise(r => setTimeout(r, 5000));
      status = await checkStatus(result.task_id , authorization);
      if(status?.data?.task_status === "failed")
      {
        return res.status(500).json({error : "Video generation failed !"});
      }
    } while (status?.data?.task_status !== "succeed");

    if (status?.data?.task_status === "succeed") {
      console.log("video generation completed successfully") ;
      console.log("video url = " , status?.data?.task_result?.videos?.[0]?.url) ;
      const mediaUrl = status?.data?.task_result?.videos?.[0]?.url; 
      await updateContentPlan(userId , planId , {media : mediaUrl }) ;
      return res.status(200).json({
        video_url: status?.data?.task_result?.videos?.[0]?.url, 
        task_id: result.task_id
      });
    } else {
      return res.status(500).json({error: "Video generation failed !"});
    }
  } else {
    return res.status(500).json({error: "Video generation failed !"});
  }
};

// // Usage
// get5sVideoUrl("A man driving car in snow")
//   .then(url => console.log("5s Video URL:", url))
//   .catch(err => console.error(err));



export {get5sVideoUrl} ;