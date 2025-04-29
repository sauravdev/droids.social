
 async function generatePost( req  , res 
    
  ) {

    console.log(req.body) ;
    const {topic , platform  } = req.body ; 
    if(!topic || !platform )  
    {
        return res.status(400).json({message : "Invalid body"}); 
    } 

    let tone = 'default' 
    try {
      const platformGuide = {
        twitter: 'short, engaging, under 280 characters',
        linkedin: 'professional tone, business-focused',
        instagram: 'visual, engaging, with emojis and hashtags'
      };
      const prompt = `Create a ${platform || 'social media' } post about "${topic}". 
  Make it ${platformGuide[platform]}${tone ? ` with a ${tone } tone` : ''}. 
  Avoid using any markdown formatting like **, *, or __. Just return plain text without styling symbols.`;
  
      // Use fetch API to call Grok
      const response = await fetch('https://api.grok.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_GROK_API_KEY}`
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: "You are an expert social media copywriter."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          model: "grok-1", // Replace with the actual model identifier
          temperature: 0.7
        })
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error?.message || `API error: ${response.status}`);
      }
  
      const data = await response.json();
      const generatedContent = data.choices[0].message.content;
      
      console.log("response from handle generate ", generatedContent);
      
      if (!generatedContent) {
        return res.status(500).json({message : "Something went wrong while generating content"}) ; 
      }
      return res.status(200).json({message : generatedContent} );
    } catch (error) {
      console.error('Grok API Error:', error);
      return res.status(500).json({message : "Something went wrong while generating content"}) ; 
    }
  }

  export {generatePost} ; 