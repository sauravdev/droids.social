async function generatePost(req, res) {
  console.log(req.body);
  const { topic, platform } = req.body;
  console.log(req.body) ;
  if (!topic || !platform) {
    return res.status(400).json({ message: "Invalid body" });
  }

  let tone = "default";
  try {
    const platformGuide = {
      twitter: "short, engaging, under 280 characters",
      linkedin: "professional tone, business-focused",
      instagram: "visual, engaging, with emojis and hashtags",
    };
  //   const prompt = `Create a ${
  //     platform || "social media"
  //   } post about "${topic}". 
  // Make it ${platformGuide[platform]}${tone ? ` with a ${tone} tone` : ""}. 
  // Avoid using any markdown formatting like **, *, or __. Just return plain text without styling symbols.`;
  const goals = ['reach'  , 'followers' , 'engagement']
  const prompt = `You are an expert social media . Create a niche post for topic : "${topic}".  designed to maximize reach, engagement, and virality, with the following goals: ${goals.join(', ')}. Craft posts that feel authentic, human-like, and resonate with the target audience, using trending tactics and platform-specific best practices
  Guidelines:
- the content should be based on the following content startegy : $strategy
- the content should be tailored for  ${platform} platform
- Make it ${platformGuide[platform]}${tone ? ` with a ${tone} tone` : ''}. 
- search internet and X, find latest trends and discussions in the domain: ${topic} , make sure the content is based on those trends
- Design posts to feel conversational, human-like, and authentic—no robotic or generic phrasing.
- Incorporate viral elements like storytelling, humor, trending hashtags, or emotional hooks where relevant.
- Include at least 1 CTA per post (e.g., "Comment below," "Tag a friend," "Save this") to boost interaction.
- Make the content informative and useful
- Post should be detailed , niche and specialised in the domain of ${topic}
- Avoid using any markdown formatting like **, *, or __. Just return plain text without styling symbols.`;

    // Use fetch API to call Grok
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROK_API_KEY}`,
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: "you are a social media agent",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        model: "grok-3-latest",
        stream: false,
        temperature: 0,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.error?.message || `API error: ${response.status}`
      );
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    console.log("response from handle generate ", generatedContent);

    if (!generatedContent) {
      return res
        .status(500)
        .json({ message: "Something went wrong while generating content" });
    }
    return res.status(200).json({ message: generatedContent });
  } catch (error) {
    console.error("Grok API Error:", error);
    return res
      .status(500)
      .json({ message: "Something went wrong while generating content" });
  }
}

export { generatePost };
