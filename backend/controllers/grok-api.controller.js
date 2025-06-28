import { updateContentPlan } from "./supabase.controller.js";

async function generatePost(req, res) {
  console.log(req.body);
  const { topic, platform , userId  , planId } = req.body;
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

  const goals = ['reach'  , 'followers' , 'engagement']
  const prompt = `You are a social media expert. Create a high-performing niche post for the topic: "${topic}", optimized for maximum reach, engagement, and virality. The post should align with the following goals: ${goals.join(", ")}.

Guidelines:
- Base the content on the strategy: "${topic}"
- Tailor it specifically for the ${platform} platform
- Follow platform best practices: ${platformGuide[platform]}${tone ? `, with a ${tone} tone` : ""}
- Research current trends and conversations on the internet and X (Twitter) related to "${topic}", and ensure alignment with what's currently resonating
- Write in a natural, human, and conversational tone — avoid robotic or generic language
- Break the content into short, skimmable paragraphs with real line breaks (not \\n or markdown)
- Ensure the first ~200 characters act as a standalone hook to grab attention in LinkedIn's preview
- Introduce a clear CTA (e.g., “Comment below”, “Tag a friend”, “Share your thoughts”) within the first 3–5 sentences to ensure visibility before truncation
- Integrate any hashtags or trend mentions mid-post or earlier — avoid placing them at the end of the content
- Avoid ending the post with footnotes, summary remarks, CTAs, or hashtags, as these are often clipped
- Structure the post to be visually scannable with line breaks every 2–3 sentences
- Include viral elements where relevant, such as storytelling, humor, trending hashtags, or emotional hooks
- Make the content niche-specific, insightful, practical, and authentic
- Avoid markdown formatting entirely
- Keep the response concise and under 200 words`


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
        temperature: 0.8,
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

    if(userId && planId) 
    {
      console.log("updated plan suggestion in grok api") ; 
      await updateContentPlan(userId , planId , {suggestion : generatedContent }) ;
    }

    if (!generatedContent) {
      return res
        .status(500)
        .json({ message: "Something went wrong while generating content" });
    }
    return res.status(200).json({ message: generatedContent });
  } catch (error) {
    if(userId && planId) 
    {
      console.log("updated plan suggestion in grok api (inside catch) ") ; 
      await updateContentPlan(userId , planId , {suggestion : "Something went wrong while generating content please try with some another model" }) ;
    }
    console.error("Grok API Error:", error);
    return res
      .status(500)
      .json({ message: "Something went wrong while generating content please try with some another model" });
  }
}

export { generatePost };
