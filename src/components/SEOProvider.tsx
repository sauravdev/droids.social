import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProviderProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  structuredData?: object;
  children: React.ReactNode;
}

export const SEOProvider: React.FC<SEOProviderProps> = ({
  title = "Your AI Social Media Co-Pilot",
  description = "Automate content creation, scheduling & analytics with AI.",
  canonical = "https://socialdroids.ai",
  ogImage = "/og-cover.png",
  ogType = "website",
  structuredData,
  children
}) => {
  const fullTitle = title === "Your AI Social Media Co-Pilot" 
    ? title 
    : `${title} | Socialdroids.ai`;

  return (
    <>
      <Helmet>
        {/* Basic Meta Tags */}
        <title>{fullTitle}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        
        {/* Open Graph */}
        <meta property="og:title" content={fullTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content={ogType} />
        <meta property="og:site_name" content="Socialdroids.ai" />
        <meta property="og:image" content={`https://socialdroids.ai${ogImage}`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Socialdroids.ai dashboard" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={fullTitle} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={`https://socialdroids.ai${ogImage}`} />
        
        {/* Robots */}
        <meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large" />
        
        {/* Structured Data */}
        {structuredData && (
          <script type="application/ld+json">
            {JSON.stringify(structuredData)}
          </script>
        )}
      </Helmet>
      {children}
    </>
  );
};
