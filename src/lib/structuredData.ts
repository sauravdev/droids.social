// Structured Data Schemas for SEO

export const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Socialdroids.ai",
  "applicationCategory": "MarketingApplication",
  "operatingSystem": "Cloud",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "url": "https://socialdroids.ai"
};

export const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Automate Social Media with AI",
  "description": "Learn how to automate your social media content creation and scheduling with AI in 3 simple steps.",
  "totalTime": "PT5M",
  "step": [
    {
      "@type": "HowToStep",
      "name": "Connect Your Social Accounts",
      "text": "Connect your LinkedIn, Instagram, and X accounts securely with one click."
    },
    {
      "@type": "HowToStep", 
      "name": "Create AI Content",
      "text": "Generate engaging posts, carousels, and videos using our AI content engine."
    },
    {
      "@type": "HowToStep",
      "name": "Schedule and Grow",
      "text": "Schedule your content and watch your engagement grow with AI-powered analytics."
    }
  ]
};

export const productSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Socialdroids.ai",
  "description": "AI-powered social media automation platform",
  "offers": [
    {
      "@type": "Offer",
      "name": "Free Plan",
      "price": "0",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    },
    {
      "@type": "Offer", 
      "name": "Starter Plan",
      "price": "29",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    },
    {
      "@type": "Offer",
      "name": "Pro Plan", 
      "price": "79",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    }
  ]
};

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Socialdroids.ai",
  "url": "https://socialdroids.ai",
  "logo": "https://socialdroids.ai/logo.png",
  "description": "AI-powered social media automation platform",
  "sameAs": [
    "https://twitter.com/socialdroids",
    "https://linkedin.com/company/socialdroids"
  ]
};

export const faqSchema = (faqData: Array<{question: string, answer: string}>) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqData.map(item => ({
    "@type": "Question",
    "name": item.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": item.answer
    }
  }))
});
