import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, Tag, ArrowRight, Bot } from 'lucide-react';
import { SEOProvider } from '../components/SEOProvider';

interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  readTime: string;
}

const blogPosts: BlogPost[] = [
  {
    slug: 'ai-social-media-strategy-2025',
    title: 'AI Social Media Strategy 2025: The Complete Guide',
    description: 'Discover how AI is revolutionizing social media marketing in 2025. Learn strategies, tools, and best practices for AI-powered social media success.',
    date: '2025-01-14',
    tags: ['ai social media', 'social media strategy', 'content automation', 'linkedin post generator'],
    readTime: '8 min read'
  },
  {
    slug: 'linkedin-content-automation-guide',
    title: 'LinkedIn Content Automation: The Ultimate Guide for 2025',
    description: 'Learn how to automate LinkedIn content creation, scheduling, and engagement using AI tools. Boost your professional presence with automated LinkedIn marketing.',
    date: '2025-01-14',
    tags: ['linkedin automation', 'linkedin post generator', 'b2b marketing', 'content automation'],
    readTime: '10 min read'
  },
  {
    slug: 'instagram-carousel-automation',
    title: 'Instagram Carousel Automation: Create Engaging Multi-Slide Posts with AI',
    description: 'Learn how to automate Instagram carousel creation using AI tools. Discover strategies for creating engaging multi-slide posts that drive engagement and conversions.',
    date: '2025-01-14',
    tags: ['instagram carousel maker', 'instagram automation', 'visual content', 'social media marketing'],
    readTime: '12 min read'
  },
  {
    slug: 'ai-content-calendar-template',
    title: 'AI Content Calendar: 30-Day Template',
    description: 'Download a free AI-powered calendar and learn the workflow. Transform your social media strategy with our comprehensive AI-powered content calendar template.',
    date: '2025-01-14',
    tags: ['ai social media', 'content calendar', 'linkedin post generator'],
    readTime: '6 min read'
  }
];

export function Blog() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [filteredPosts, setFilteredPosts] = useState(blogPosts);

  // Get all unique tags from blog posts
  const allTags = Array.from(new Set(blogPosts.flatMap(post => post.tags)));

  useEffect(() => {
    let filtered = blogPosts;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by selected tag
    if (selectedTag) {
      filtered = filtered.filter(post =>
        post.tags.includes(selectedTag)
      );
    }

    setFilteredPosts(filtered);
  }, [searchTerm, selectedTag]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <SEOProvider
      title="Blog - AI Social Media Marketing Insights"
      description="Discover the latest insights, strategies, and tips for AI-powered social media marketing. Expert guides on LinkedIn automation, Instagram carousels, and more."
      canonical="https://socialdroids.ai/blog"
    >
      <div className="min-h-screen bg-gray-900">
        {/* Simple Header for Blog */}
        <nav className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <Link to="/" className="flex items-center">
                  <Bot className="h-8 w-8 text-purple-500" />
                  <span className="ml-2 text-xl font-bold text-white">socialdroids.ai</span>
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <Link to="/" className="text-gray-300 hover:text-white text-sm font-medium">
                  Home
                </Link>
                <Link to="/login" className="text-gray-300 hover:text-white text-sm font-medium">
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <div className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center mb-16">
              <h1 className="text-4xl font-extrabold text-white sm:text-5xl mb-6">
                AI Social Media Marketing Blog
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Discover the latest insights, strategies, and tips for AI-powered social media marketing. 
                Expert guides on LinkedIn automation, Instagram carousels, and more.
              </p>
            </div>

            {/* Search and Filter */}
            <div className="mb-12">
              {/* Search Bar */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Tag Filters */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedTag('')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedTag === '' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  All Posts
                </button>
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedTag === tag 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Blog Posts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post) => (
                <article key={post.slug} className="bg-gray-800 rounded-lg overflow-hidden hover:transform hover:scale-105 transition-transform duration-300">
                  <div className="p-6">
                    {/* Meta Info */}
                    <div className="flex items-center text-sm text-gray-400 mb-4">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>{formatDate(post.date)}</span>
                      <span className="mx-2">•</span>
                      <span>{post.readTime}</span>
                    </div>

                    {/* Title */}
                    <h2 className="text-xl font-bold text-white mb-3 line-clamp-2">
                      <Link 
                        to={`/blog/${post.slug}`}
                        className="hover:text-purple-400 transition-colors"
                      >
                        {post.title}
                      </Link>
                    </h2>

                    {/* Description */}
                    <p className="text-gray-300 mb-4 line-clamp-3">
                      {post.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      {post.tags.length > 3 && (
                        <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                          +{post.tags.length - 3} more
                        </span>
                      )}
                    </div>

                    {/* Read More Link */}
                    <Link
                      to={`/blog/${post.slug}`}
                      className="inline-flex items-center text-purple-400 hover:text-purple-300 font-medium transition-colors"
                    >
                      Read More
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            {/* No Results */}
            {filteredPosts.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg mb-4">
                  No articles found matching your search criteria.
                </div>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedTag('');
                  }}
                  className="text-purple-400 hover:text-purple-300 font-medium"
                >
                  Clear filters
                </button>
              </div>
            )}

            {/* Newsletter Signup */}
            <div className="mt-16 bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg p-8 text-center">
              <h3 className="text-2xl font-bold text-white mb-4">
                Stay Updated with AI Social Media Insights
              </h3>
              <p className="text-purple-100 mb-6 max-w-2xl mx-auto">
                Get the latest AI social media marketing tips, strategies, and insights delivered to your inbox. 
                Join thousands of marketers who are transforming their social media with AI.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
                />
                <button className="px-6 py-3 bg-white text-purple-600 font-medium rounded-lg hover:bg-gray-100 transition-colors">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SEOProvider>
  );
}

export default Blog;
