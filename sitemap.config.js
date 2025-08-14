import { SitemapStream, streamToPromise } from 'sitemap';
import { createWriteStream } from 'fs';
import { resolve } from 'path';

const siteUrl = 'https://socialdroids.ai';

const urls = [
  { url: '/', changefreq: 'daily', priority: 1.0 },
  { url: '/how-it-works', changefreq: 'weekly', priority: 0.8 },
  { url: '/pricing', changefreq: 'weekly', priority: 0.8 },
  { url: '/testimonials', changefreq: 'weekly', priority: 0.7 },
  { url: '/about', changefreq: 'monthly', priority: 0.6 },
  { url: '/contact', changefreq: 'monthly', priority: 0.6 },
  { url: '/blog', changefreq: 'weekly', priority: 0.7 },
];

const sitemap = new SitemapStream({ hostname: siteUrl });

// Add URLs to sitemap
urls.forEach(url => {
  sitemap.write(url);
});

sitemap.end();

// Write sitemap to file
streamToPromise(sitemap).then(sm => {
  const writeStream = createWriteStream(resolve('./public/sitemap.xml'));
  writeStream.write(sm.toString());
  writeStream.end();
  console.log('Sitemap generated successfully!');
});
