

// fetch("https://api.ayrshare.com/api/user", {
//     method: "GET",
//     headers: {
//       "Authorization": `Bearer ${API_KEY}`
//     }
//   })
//     .then((res) => res.json())
//     .then((json) => console.log(json))
//     .catch(console.error);
  

const getProfileData = async (req , res ) => {
  const {API_KEY}  = req.body; 
  if(!API_KEY) {
    return res.status(401).json({message : "Invalid api key"} )
  }
  try{
    const response = await fetch("https://api.ayrshare.com/api/user", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${API_KEY}`
      }
    })
    const data = await response.json() ; 
    console.log("data = " , data  ) ; 
    if(data?.code == 102) 
    {
      return res.status(401).json({status : 401 , message : "Unauthorized or Invalid Api key"})
    }
    if(data?.code == 106) 
      {
        return res.status(429).json({status : 429 , message : "You have exceeded your API quota for the month."})
      }
    return res.status(200).json({status : 200 , data  }) ;
  }
  catch(err) 
  {
    console.log(err) ; 
    res.status(err?.code || 500).json(err?.message || "Something went wrong") ;
  }
}

export {getProfileData} ;