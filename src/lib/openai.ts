import OpenAI from "openai";
import type { ContentStrategy } from "./types";
import { getCustomModels } from "./api";
import Groq from "groq-sdk";
// import { encode } from 'tiktoken';
import { PYTHON_SERVER_URI, GROK_API_KEY, BACKEND_APIPATH } from "../constants";

// Initialize OpenAI client

// const countTokens = (text: string, model: string = "gpt-4o-mini") => {
//   try {
//     const encoding = encode(text, model);
//     return encoding.length;
//   } catch (error) {
//     console.error("Error encoding tokens:", error);
//     return 0;
//   }
// };

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Note: In production, API calls should be made through a backend
});

interface ProcessRequest {
  keyword: string;
  source: string[];
  N?: number;
  converted_source?: string[];
  content_types?: string[];
}

// async function processContent(data: ProcessRequest): Promise<void> {
//   try {
//     const response = await fetch('http://64.227.142.60:5009/api/process', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify({data : "cricket"})
//     });

//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }

//     const result = await response.json();
//     console.log('API response:', result);
//   } catch (error) {
//     console.error('Error processing content:', error);
//   }
// }

// const sample  = "in sarcastic mannar"

// Cache for API responses
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 1000 * 60 * 5; // 5 minutes
const RATE_LIMIT_DURATION = 1000; // 1 second between requests
let lastRequestTime = 0;

// Helper to enforce rate limiting
async function rateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < RATE_LIMIT_DURATION) {
    await new Promise((resolve) =>
      setTimeout(resolve, RATE_LIMIT_DURATION - timeSinceLastRequest)
    );
  }
  lastRequestTime = Date.now();
}

// Helper to check cache
function checkCache<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data as T;
  }
  return null;
}

// Helper to set cache
function setCache<T>(key: string, data: T) {
  cache.set(key, { data, timestamp: Date.now() });
}

export async function generateContentStrategy(
  niche: string,
  goals: string[],
  platforms: any
): Promise<ContentStrategy> {
  let allowedPlatforms = "";
  for (const platform of platforms) {
    allowedPlatforms = allowedPlatforms + platform + " | ";
  }

  console.log("allowed platforms = ", allowedPlatforms);

  const cacheKey = `strategy:${niche}:${goals.join(",")}`;
  const cached = checkCache<ContentStrategy>(cacheKey);
  if (cached) return cached;
  await rateLimit();
  try {
    const prompt = `You are an expert social media strategist.Create a weekly social media content strategy for a ${niche} topic designed to maximize reach, engagement, and virality, with the following goals: ${goals.join(
      ", "
    )}. Craft posts that feel authentic, human-like, and resonate with the target audience, using trending tactics and platform-specific best practices.

Include:
Daily Content Suggestions: Realistic, platform-optimized post ideas for ${allowedPlatforms} , covering all days of a week
Mix of Content Formats: A balanced blend of formats (text, image, video, carousel, poll) with clear, actionable suggestions to spark engagement (e.g., questions, CTAs, relatable hooks).
search internet and X, find latest trends and discussions in the domain: ${niche} , make sure the content ideas are based on those trends

Guidelines:
- Design posts to feel conversational, human-like, and authentic—no robotic or generic phrasing.
- Incorporate viral elements like storytelling, humor, trending hashtags, or emotional hooks where relevant.
- Tailor content to each platform’s audience and style (e.g., visual for Instagram, professional for LinkedIn, concise for Twitter).
- Include at least 1 CTA per post (e.g., "Comment below," "Tag a friend," "Save this") to boost interaction.
- Ensure variety: mix educational, promotional, entertaining, and community-building posts.
- Post ideas should be detailed , niche and specialised in the domain of ${niche}
- Posts ideas should also include informative posts

Format the response as a structured JSON object with this schema:
{
  "monthly_theme": string,
  "weekly_plans": [{
    "week_number": number (1-4),
    "theme": string,
    "days": [{
      "date": string (ISO format, e.g., "2025-05-01"),
      "posts": [{
        "platform": string (${allowedPlatforms}),
        "format": "text" | "image" | "video" ,
        "topic": string,
        "suggestion": string (concise, max 30 words, with CTA and viral hook),
        "status": "pending"
      }]
    }]
  }]
`;

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are an expert social media strategist who creates detailed content plans.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      // model: "gpt-4-turbo-preview",
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
    });

    const response = completion.choices[0].message.content;
    if (!response) throw new Error("Failed to generate content strategy");
    const strategy = JSON.parse(response);
    setCache(cacheKey, strategy);
    return strategy;
  } catch (error: any) {
    console.error("OpenAI API Error:", error);
    throw new Error(error.message || "Failed to generate content strategy");
  }
}

export async function generateTopics(
  topic: string,
  platform:string
): any {
  const cacheKey = `post:${topic}:${platform}:${"default"}`;
  const cached = checkCache<string>(cacheKey);
  if (cached) return cached;

  await rateLimit();

  console.log("topic = ", topic);

  try {
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

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert social media copywriter.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "gpt-4o-mini",
      // model: "gpt-4-turbo-preview"
    });
    const response = completion.choices[0].message.content;
    console.log("response from handle generate ", response);
    if (!response) throw new Error("Failed to generate post");
    setCache(cacheKey, response);

    return response;
  } catch (error: any) {
    console.error("OpenAI API Error:", error);
    throw new Error(error.message || "Failed to generate post");
  }
}

export async function generatePost(
  topic: string,
  platform: "twitter" | "linkedin" | "instagram",
  tone?: string
): Promise<string> {
  const cacheKey = `post:${topic}:${platform}:${tone || "default"}`;
  const cached = checkCache<string>(cacheKey);
  if (cached) return cached;

  await rateLimit();

  console.log("topic = ", topic);

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
- Keep the response concise and under 200 words`;

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert social media copywriter.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "gpt-4o-mini",
      // model: "gpt-4-turbo-preview"
    });
    // console.log("tokens in prompt = " , countTokens(prompt)) ;
    const response = completion.choices[0].message.content;
    console.log("response from handle generate ", response);
    // console.log("tokens in response = " , countTokens(response) ) ;

    // const data = await generatePostFromCustomModel(prompt) ;
    if (!response) throw new Error("Failed to generate post");

    setCache(cacheKey, response);
    return response;
  } catch (error: any) {
    console.error("OpenAI API Error:", error);
    throw new Error(error.message || "Failed to generate post");
  }
}

export async function generateProfileContent(name: string, niche: string) {
  const prompt = `Generate a professional profile content for a ${niche} professional named ${name}. Include:
  1. A short, engaging bio (max 160 characters)
  2. A detailed bio (max 500 characters)
  3. A profile picture description for DALL-E (max 100 characters)
  4. A banner image description for DALL-E (max 100 characters)

  Format as JSON with these keys: shortBio, longBio, profileImagePrompt, bannerImagePrompt`;
  // await postGenerationApi(prompt) ;
  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          "You are an expert at creating engaging professional profiles.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
  });

  const response = completion.choices[0].message.content;
  if (!response) throw new Error("Failed to generate profile content");
  // const response = await generatePostFromCustomModel(prompt) ;
  return JSON.parse(response);
}

export async function generateAIContentSuggestion() {
  const prompt =
    'Generate a JSON object containing social media growth tips for Instagram and Twitter. The object should have a key named "tips" with an array of at least 5 unique growth strategies. Each item in the array must follow this structure:\n\n{\n  "type": "Category of the tip (e.g., Engagement, Hashtags, Content Strategy, Posting Time, Algorithm Optimization, etc.)",\n  "title": "A short and catchy title summarizing the tip",\n  "description": "A detailed explanation, including actionable advice on how to use this strategy effectively."\n}\n\nRequirements:\n- Include a mix of strategies such as engagement techniques, content optimization, posting frequency, audience interaction, and algorithm insights.\n- Ensure the response is a valid JSON object, properly formatted for direct use in a frontend application.';

  // await postGenerationApi(prompt) ;

  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          "You are an expert at creating engaging professional profiles.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
  });

  const response = completion.choices[0].message.content;
  if (!response) throw new Error("Failed to generate profile content");
  return JSON.parse(response);
}

export async function generateImage(prompt: string) {
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt: prompt,
    n: 1,
    size: "1024x1024",
  });

  return response.data[0].url;
}

export async function generatePostFromCustomModel(
  topic: string,
  selectedPlatform: string,
  model: any
): any {
  try {
    console.log("selected model found = ", model);
    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: "Marv is a factual chatbot that is also sarcastic.",
        },
        { role: "user", content: topic },
      ],
      temperature: 0.8,
    });

    console.log("Response:", response.choices[0].message.content);

    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error using fine-tuned model:", error);
  }
}

export async function postGenerationApi(prompt: string) {
  const response = await fetch(`${PYTHON_SERVER_URI.BASEURL}/api/process`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      keyword: prompt,
      source: ["arxiv"],
      converted_source: ["instagram"],
      content_types: ["text"],
    }),
  });
  const data = await response.json();
  console.log("response from the server post generation api ", data);
  console.log("Response:", data.results[0].text[0]);
  return data?.results[0]?.text[0];
}

export async function generateTopicsUsingGrok(
  topic: string,
  platform: string
): any {
  console.log("inside generate post using grok api");

  try {
    const response = await fetch(`${BACKEND_APIPATH.BASEURL}/generate-topics`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ topic, platform }),
    });
    const data = await response.json();
    const topics = data?.message;
    console.log("topics generated using grok = ", topics);
    return topics;
    // return chatCompletion.choices[0]?.message?.content;
  } catch (error) {
    console.error("Error calling Groq API:", error);
    throw error;
  }
}

export async function generateVideoPromptUsingGrok(topic: string): any {
  try {
    const response = await fetch(
      `${BACKEND_APIPATH.BASEURL}/generate-video-prompt`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic }),
      }
    );
    const data = await response.json();
    const content = data?.message;
    return content;
    // return chatCompletion.choices[0]?.message?.content;
  } catch (error) {
    console.error("Error calling Groq API:", error);
    return null;
  }
}

export async function generateVideoDescription(topic: string): any {
  console.log("topic = ", topic);

  try {
    const prompt = `Write a detailed Instagram SEO optimised video description with well researched popular hashtags ${topic}, 
Here's what to include:
- 2-3 engaging sentences with appropriate emojis.
- 3-5 relevant hashtags based on the video title.
- A clear call-to-action encouraging comments.`;

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert social media copywriter.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "gpt-4o-mini",
      // model: "gpt-4-turbo-preview"
    });
    const response = completion.choices[0].message.content;
    console.log("response from handle generate ", response);
    if (!response) throw new Error("Failed to generate post");
    return response;
  } catch (error: any) {
    console.error("OpenAI API Error:", error);
    throw new Error(error.message || "Failed to generate post");
  }
}

export async function generateVideoDescriptionUsingGrok(topic: string): any {
  try {
    const response = await fetch(
      `${BACKEND_APIPATH.BASEURL}/generate-video-description`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic }),
      }
    );
    const data = await response.json();
    const content = data?.message;
    return content;
    // return chatCompletion.choices[0]?.message?.content;
  } catch (error) {
    console.error("Error calling Groq API:", error);
    return null;
  }
}

export async function generateVideoPrompt(topic: string): any {
  console.log("topic = ", topic);

  try {
    const prompt = `Create a 10-second vertical video script for Instagram Reels or TikTok explaining the topic: "${topic}" in a visually engaging and simple way that anyone can understand.

The scene should include a dynamic hook in the first 2 seconds.

Use clear visuals or actions relevant to the topic.

Add a strong call-to-action at the end encouraging viewers to follow or subscribe.

Return the response as a short descriptive string like:
"Show a person walking briskly through a green park at sunrise, cutting to a smartwatch showing heart rate, with text overlay: 'Walking 30 mins daily boosts heart health!' End with: 'Follow for daily fitness tips!'."`;

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert social media copywriter.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "gpt-4o-mini",
      // model: "gpt-4-turbo-preview"
    });
    const response = completion.choices[0].message.content;
    console.log("response from handle generate ", response);
    if (!response) throw new Error("Failed to generate post");
    return response;
  } catch (error: any) {
    console.error("OpenAI API Error:", error);
    throw new Error(error.message || "Failed to generate post");
  }
}

export async function generatePostUsingGrok(
  topic: string,
  platform: "twitter" | "linkedin" | "instagram",
  userId = "",
  planId = ""
): any {
  console.log("inside generate post using grok api");

  try {
    const response = await fetch(
      `${BACKEND_APIPATH.BASEURL}/generate-content`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic, platform, userId, planId }),
      }
    );
    const data = await response.json();
    const content = data?.message;
    return content;
    // return chatCompletion.choices[0]?.message?.content;
  } catch (error) {
    console.error("Error calling Groq API:", error);
    throw error;
  }
}

export async function generatePostGeneric(
  topic: string,
  selectedPlatform: string,
  model: string
) {
  console.log("model used for generation   = ", model);
  if (model == "grok") {
    const content = await generatePostUsingGrok(topic, selectedPlatform);
    return content;
  } else if (model == "openai") {
    const content = await generatePost(topic, selectedPlatform);
    return content;
  } else {
    if (model == "") return;
    console.log("custom model used for generation => ", model);
    // pass custom model to the api
    const content = await generatePostFromCustomModel(
      topic,
      selectedPlatform,
      model
    );
    return content;
  }
}
