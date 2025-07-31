import { updateContentPlan } from "./supabase.controller.js";

async function generateVideoDescription(req, res) {
  const { topic } = req.body;
  if (!topic) {
    return res.status(400).json({ message: "Invalid body" });
  }

  const prompt = `Write a detailed Instagram SEO optimised video description with well researched popular hashtags ${topic}, 
Here's what to include:
- 2-3 engaging sentences with appropriate emojis.
- 3-5 relevant hashtags based on the video title.
- A clear call-to-action encouraging comments.`;

  try {
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

    // if (userId && planId) {
    //   console.log("updated plan suggestion in grok api");
    //   await updateContentPlan(userId, planId, { suggestion: generatedContent });
    // }

    if (!generatedContent) {
      return res
        .status(500)
        .json({ message: "Something went wrong while generating content!" });
    }
    return res.status(200).json({ message: generatedContent });
  } catch (error) {
    // if (userId && planId) {
    //   console.log("updated plan suggestion in grok api (inside catch) ");
    //   await updateContentPlan(userId, planId, {
    //     suggestion:
    //       "Something went wrong while generating content please try with some another model",
    //   });
    // }
    console.error("Grok API Error:", error);
    return res.status(500).json({
      message:
        "Something went wrong while generating content please try with some another model",
    });
  }
}

async function generateVideoGenerationPrompt(req, res) {
  const { topic } = req.body;
  if (!topic) {
    return res.status(400).json({ message: "Invalid body" });
  }

  const prompt = `Create a 10-second vertical video script for Instagram Reels or TikTok explaining the topic: "${topic}" in a visually engaging and simple way that anyone can understand.

The scene should include a dynamic hook in the first 2 seconds.

Use clear visuals or actions relevant to the topic.

Add a strong call-to-action at the end encouraging viewers to follow or subscribe.

Return the response as a short descriptive string like:
"Show a person walking briskly through a green park at sunrise, cutting to a smartwatch showing heart rate, with text overlay: 'Walking 30 mins daily boosts heart health!' End with: 'Follow for daily fitness tips!'."`;

  try {
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

    // if (userId && planId) {
    //   console.log("updated plan suggestion in grok api");
    //   await updateContentPlan(userId, planId, { suggestion: generatedContent });
    // }

    if (!generatedContent) {
      return res
        .status(500)
        .json({ message: "Something went wrong while generating content!" });
    }
    return res.status(200).json({ message: generatedContent });
  } catch (error) {
    // if (userId && planId) {
    //   console.log("updated plan suggestion in grok api (inside catch) ");
    //   await updateContentPlan(userId, planId, {
    //     suggestion:
    //       "Something went wrong while generating content please try with some another model",
    //   });
    // }
    console.error("Grok API Error:", error);
    return res.status(500).json({
      message:
        "Something went wrong while generating content please try with some another model",
    });
  }
}

async function generateTopics(req, res) {
  const { topic, platform } = req.body;
  if (!topic || !platform) {
    return res.status(400).json({ message: "Invalid body" });
  }

  const prompt = `Conduct advanced keyword research for the following topic niche: ${topic}
    Analyze current discussions from Reddit, X (formerly Twitter), and Google News.
    Identify 5 high-performing, niche keywords specific to the topic of Generative AI and LLMs.
    For each keyword, analyze real-time trends and discourse to generate one niche-specific, viral post title for ${platform}.

    Ensure the titles are:
    – Optimized for virality and engagement
    – Use high-performing, niche keywords
    – Inspired by real community insights
    – Reflect expert tone and originality

    Format the final output strictly as a flat JSON array (no nesting, no keys) of 5 comma-separated titles.

    Output format example (match tone and structure):

    json
    Copy
    Edit
    [
      "Unlock the Power of Prompt Engineering: 3 Real‑World Hacks Every AI Practitioner Needs Today",
      "Why LLMOps Is the Missing Link in Enterprise AI: Lessons from Reddit & X Buzz",
      "Vibe Coding: Embracing Flow‑Based Development with LLMs – A Game Changer for Software Teams",
      "RAG Reloaded: How Retrieval‑Augmented Generation Is Disrupting Knowledge Workflows in 2025",
      "Battling AI Hallucinations: What Recent Reddit & X Debates Reveal About LLM Trust"
    ]`;

  try {
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

    // if (userId && planId) {
    //   console.log("updated plan suggestion in grok api");
    //   await updateContentPlan(userId, planId, { suggestion: generatedContent });
    // }

    if (!generatedContent) {
      return res
        .status(500)
        .json({ message: "Something went wrong while generating content!" });
    }
    return res.status(200).json({ message: generatedContent });
  } catch (error) {
    // if (userId && planId) {
    //   console.log("updated plan suggestion in grok api (inside catch) ");
    //   await updateContentPlan(userId, planId, {
    //     suggestion:
    //       "Something went wrong while generating content please try with some another model",
    //   });
    // }
    console.error("Grok API Error:", error);
    return res.status(500).json({
      message:
        "Something went wrong while generating content please try with some another model",
    });
  }
}

async function generatePost(req, res) {
  console.log(req.body);
  const { topic, platform, userId, planId } = req.body;
  console.log(req.body);
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

    const goals = ["reach", "followers", "engagement"];
    const prompt = `You are a social media expert. Create a high-performing niche post for the topic: "${topic}", optimized for maximum reach, engagement, and virality. The post should align with the following goals: ${goals.join(
      ", "
    )}.

Guidelines:
- Base the content on the strategy: "${topic}"
- Tailor it specifically for the ${platform} platform
- Follow platform best practices: ${platformGuide[platform]}${
      tone ? `, with a ${tone} tone` : ""
    }
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
- **Do not use parentheses under any circumstances**
- Keep the response concise and under 200 words
`;

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

    if (userId && planId) {
      console.log("updated plan suggestion in grok api");
      await updateContentPlan(userId, planId, { suggestion: generatedContent });
    }

    if (!generatedContent) {
      return res
        .status(500)
        .json({ message: "Something went wrong while generating content" });
    }
    return res.status(200).json({ message: generatedContent });
  } catch (error) {
    if (userId && planId) {
      console.log("updated plan suggestion in grok api (inside catch) ");
      try {
    await updateContentPlan(userId, planId, {
      suggestion:
        "Something went wrong while generating content please try with some another model",
    });
  } catch (err) {
    console.error("Failed to update content plan inside catch:", err);
  }
    }
    console.error("Grok API Error:", error);
    return res.status(500).json({
      message:
        "Something went wrong while generating content please try with some another model",
    });
  }
}

export { generatePost, generateTopics, generateVideoGenerationPrompt  ,  generateVideoDescription };





