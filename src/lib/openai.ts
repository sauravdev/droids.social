import OpenAI from 'openai';
import type { ContentStrategy } from './types';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, API calls should be made through a backend
});


interface ProcessRequest {
  keyword: string;
  source: string[];
  N?: number;
  converted_source?: string[];
  content_types?: string[];
}

async function processContent(data: ProcessRequest): Promise<void> {
  try {
    const response = await fetch('http://64.227.142.60:5009/api/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({data : "cricket"})
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('API response:', result);
  } catch (error) {
    console.error('Error processing content:', error);
  }
}


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
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DURATION - timeSinceLastRequest));
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

export async function generateContentStrategy(niche: string, goals: string[]): Promise<ContentStrategy> {
  const cacheKey = `strategy:${niche}:${goals.join(',')}`;
  const cached = checkCache<ContentStrategy>(cacheKey);
  if (cached) return cached;

  await rateLimit();

  try {
    const prompt = `Create a monthly social media content strategy for a ${niche} business with the following goals: ${goals.join(', ')}.
    
    Include:
    1. A monthly theme
    2. Weekly themes
    3. Daily content suggestions for Twitter, LinkedIn, and Instagram
    4. Mix of content formats (text, image, video)
    
    Format the response as a structured JSON object with the following schema:
    {
      "monthly_theme": string,
      "weekly_plans": [{
        "theme": string,
        "days": [{
          "date": string (ISO date),
          "posts": [{
            "platform": "twitter" | "linkedin" | "instagram",
            "format": "text" | "image" | "video",
            "topic": string,
            "suggestion": string,
            "status": "pending"
          }]
        }]
      }]
    }`;

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert social media strategist who creates detailed content plans."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      // model: "gpt-4-turbo-preview",
      model  :"gpt-o3-mini",
      response_format: { type: "json_object" }
    });

    const response = completion.choices[0].message.content;
    if (!response) throw new Error('Failed to generate content strategy');

    const strategy = JSON.parse(response);
    setCache(cacheKey, strategy);
    return strategy;
  } catch (error: any) {
    console.error('OpenAI API Error:', error);
    throw new Error(error.message || 'Failed to generate content strategy');
  }
}

export async function generatePost(
  topic: string,
  platform: 'twitter' | 'linkedin' | 'instagram',
  tone?: string
): Promise<string> {
  const cacheKey = `post:${topic}:${platform}:${tone || 'default'}`;
  const cached = checkCache<string>(cacheKey);
  if (cached) return cached;  

  await rateLimit();

  try {
    const platformGuide = {
      twitter: 'short, engaging, under 280 characters',
      linkedin: 'professional tone, business-focused',
      instagram: 'visual, engaging, with emojis and hashtags'
    };

    const prompt = `Create a ${platform} post about "${topic}". 
    Make it ${platformGuide[platform]}${tone ? ` with a ${tone} tone` : ''}.`;

    const completion = await openai.chat.completions.create({
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
      model  :"gpt-4o-mini",
      // model: "gpt-4-turbo-preview"
    });

    const response = completion.choices[0].message.content;
    if (!response) throw new Error('Failed to generate post');

    setCache(cacheKey, response);
    return response;
  } catch (error: any) {
    console.error('OpenAI API Error:', error);
    throw new Error(error.message || 'Failed to generate post');
  }
}

export async function generateProfileContent(name: string, niche: string) {
  const prompt = `Generate a professional profile content for a ${niche} professional named ${name}. Include:
  1. A short, engaging bio (max 160 characters)
  2. A detailed bio (max 500 characters)
  3. A profile picture description for DALL-E (max 100 characters)
  4. A banner image description for DALL-E (max 100 characters)

  Format as JSON with these keys: shortBio, longBio, profileImagePrompt, bannerImagePrompt`;

  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "You are an expert at creating engaging professional profiles."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    model  :"gpt-4o-mini",
    response_format: { type: "json_object" }
  });

  const response = completion.choices[0].message.content;
  if (!response) throw new Error('Failed to generate profile content');

  return JSON.parse(response);
}



export async function generateAIContentSuggestion() {
const prompt = `Generate a JSON array of social media growth tips to help increase reach and followers. Each item in the array should follow this structure:
{
  "type": "Category of the tip (e.g., Engagement, Hashtags, Content Strategy, Posting Time, Algorithm Optimization, etc.)",
  "title": "A short and catchy title summarizing the tip",
  "description": "A detailed explanation, including actionable advice on how to use this strategy effectively"
}

Ensure:
- Return a object having key as tips and value as array
- At least 5 unique social media growth tips  
- A mix of strategies related to engagement, posting consistency, algorithm hacks, audience interaction, and content optimization  
- The response should be a valid JSON array.`;

  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "You are an expert at creating engaging professional profiles."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    model  :"gpt-4o-mini",
    response_format: { type: "json_object" }
  });

  const response = completion.choices[0].message.content;
  if (!response) throw new Error('Failed to generate profile content');

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