const linkedInClientId = '77zwm3li56ua2a';
const linkedInClientSecret = 'WPL_AP1.FTEeZCfxW20evekT.BoujnA==';
const redirectUri = 'http://127.0.0.1:5173/linkedin/callback/auth/linkedIn';

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


const uploadContent = async (accessToken = 'AQXdfh39h_D4yrqid439z9p-PhWeYZGOYskSKMchboy3ITZkyOjznnWLQRhZ-nlKqr6uHyl4hFF_ONYDuO1krEctiaelfcl3oBbY5lMTlf79HIwH3akXGnWov5SnZocuEgHB9g6ySFtsRb_jGULcqHM_-L-7kZM1v9IAI7f1TgxBycHDNB_BkhHfdVUH7jn4UlgYrMkZwakPtONhX6flg71ZOjNM19WA-fBnNG79BSktPtZuJqbgVHLuK5fhzVJnVJOMDM1QbskTNFlWU4GkgS206jzXrIn_T5SEBH9z5XagISoDCQcJDlVN06kKopPClA1niXL7fODbT-4QMTOxBgu6gpBN6w' ,  id = 'XiwWdJIUQv' , text = "Sample text posted from my nodejs application" ) => {
  
  try{
    const response = await fetch("https://api.linkedin.com/rest/post", {
      method: "POST",
      header: {
          'LinkedIn-Version': '202210',
          'X-Restli-Protocol-Version': '2.0.0',
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

    const data = await response.json() ; 
    console.log(data) ; 
    return data; 

  }
  catch(err) 
  {
    console.log(err?.message || err ) ; 
    return null ;
  }
}

const uploadContentHandler = async (req , res ) => {
  const { id   , text  } = req.body ; 
  // if(!accessToken || !id  || !text) 
  // {
  //   return res.status(400).json({message : "invalid body"})
  // }
  if(uploadContent()){
    return res.status(201).json({message : "post uploaded successfully"})
  }
  return res.status(500).json({message : err?.message ||  "something went wrong"})  ;
}


const scheduleContentHandler = async (req  , res ) => {
  const {id   ,text  , date } = req.body ; 
  console.log(req.body);

  // if(!accessToken || !id  || !text) 
  // {
  //   return res.status(400).json({message : "invalid body"})
  // } 
  if(!date) {
    return res.status(400).json({message : "Invalid body : date is required"})  ;  // date is required  in the request body.  // should validate date format as well.  // date should be in ISO 8601 format.  // date should be in future.  // date should not be in past.   // date should not be in the past.   // date should not be in the past.   // date should not be in the past.   // date should not be in the past.   // date should not be in the past.   // date should not be in the past.   // date should not be in the past.   // date should not be in the past.   // date should not be in the past.   // date should not be in the past.   // date should not be in the past.   // date should not be in the past.   // date should not be in the
  }
  try{
     schedule.scheduleJob(date ,  () => { uploadContent()}  ) ;
        return res.status(201).json({message:"Scheduled Instagam post for " , date })
    
  }
  catch(err) 
  {
    console.log(err?.message || "Something went wrong"); 
    res.status(500).json({message : err?.code || "Something went wrong"} );

  }

}
export {generateAccessToken ,getUserInfo , uploadContentHandler , scheduleContentHandler } 