import React, { useState } from 'react';
import { TrendingUp, Users, MessageSquare, BarChart3, Calendar, ArrowUp, ArrowDown, Twitter, Linkedin, Instagram } from 'lucide-react';

// Time range options
const timeRanges = [
  { label: '1M', value: '1month' },
  { label: '3M', value: '3months' },
  { label: '6M', value: '6months' },
  { label: '1Y', value: '1year' }
];

export function Analytics() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('1month');

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Analytics Overview</h1>
        
        {/* Time Range Selector */}
        <div className="flex space-x-2">
          {timeRanges.map(range => (
            <button
              key={range.value}
              onClick={() => setSelectedTimeRange(range.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                selectedTimeRange === range.value
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Platform Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {platforms.map(platform => (
          <PlatformCard key={platform.name} {...platform} />
        ))}
      </div>

      {/* Growth Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          icon={<Users className="w-6 h-6 text-purple-500" />}
          title="Total Followers"
          value="12,345"
          change="+23%"
          positive={true}
          timeRange={selectedTimeRange}
        />
        <MetricCard
          icon={<MessageSquare className="w-6 h-6 text-purple-500" />}
          title="Engagement Rate"
          value="4.8%"
          change="+1.2%"
          positive={true}
          timeRange={selectedTimeRange}
        />
        <MetricCard
          icon={<TrendingUp className="w-6 h-6 text-purple-500" />}
          title="Reach"
          value="45.2K"
          change="+15%"
          positive={true}
          timeRange={selectedTimeRange}
        />
        <MetricCard
          icon={<Calendar className="w-6 h-6 text-purple-500" />}
          title="Posts"
          value="128"
          change="+8"
          positive={true}
          timeRange={selectedTimeRange}
        />
      </div>

      {/* Historical Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Content */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Top Performing Content</h2>
          <div className="space-y-4">
            {topContent.map((content, index) => (
              <div key={index} className="bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <PlatformIcon platform={content.platform} />
                    <span className="text-white font-medium">{content.title}</span>
                  </div>
                  <span className="text-purple-400">{content.date}</span>
                </div>
                <p className="text-gray-300 text-sm mb-2">{content.excerpt}</p>
                <div className="flex justify-between items-center text-sm">
                  <div className="flex space-x-4">
                    <span className="text-gray-400">Engagement: {content.engagement}</span>
                    <span className="text-gray-400">Reach: {content.reach}</span>
                  </div>
                  <span className={`${content.growth >= 0 ? 'text-green-400' : 'text-red-400'} flex items-center`}>
                    {content.growth >= 0 ? <ArrowUp className="h-4 w-4 mr-1" /> : <ArrowDown className="h-4 w-4 mr-1" />}
                    {Math.abs(content.growth)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">AI Insights</h2>
          <div className="space-y-4">
            {aiInsights.map((insight, index) => (
              <div key={index} className="bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <div className={`w-2 h-2 rounded-full ${insight.type === 'positive' ? 'bg-green-500' : insight.type === 'negative' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                  <span className="text-white font-medium">{insight.title}</span>
                </div>
                <p className="text-gray-300 text-sm">{insight.description}</p>
                {insight.recommendation && (
                  <div className="mt-2 p-2 bg-gray-600 rounded">
                    <p className="text-sm text-purple-300">Recommendation:</p>
                    <p className="text-sm text-gray-300">{insight.recommendation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PlatformIcon({ platform }: { platform: string }) {
  switch (platform.toLowerCase()) {
    case 'twitter':
      return <Twitter className="h-5 w-5 text-blue-400" />;
    case 'linkedin':
      return <Linkedin className="h-5 w-5 text-blue-600" />;
    case 'instagram':
      return <Instagram className="h-5 w-5 text-pink-500" />;
    default:
      return null;
  }
}

interface PlatformCardProps {
  name: string;
  icon: React.ReactNode;
  color: string;
  followers: string;
  engagement: string;
  growth: number;
  posts: number;
}

function PlatformCard({ name, icon, color, followers, engagement, growth, posts }: PlatformCardProps) {
  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
        <span className={`flex items-center ${growth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {growth >= 0 ? <ArrowUp className="h-4 w-4 mr-1" /> : <ArrowDown className="h-4 w-4 mr-1" />}
          {Math.abs(growth)}%
        </span>
      </div>
      <h3 className="text-lg font-semibold text-white mb-4">{name}</h3>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-400">Followers</span>
          <span className="text-white">{followers}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Engagement</span>
          <span className="text-white">{engagement}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Posts</span>
          <span className="text-white">{posts}</span>
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  change: string;
  positive: boolean;
  timeRange: string;
}

function MetricCard({ icon, title, value, change, positive, timeRange }: MetricCardProps) {
  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-gray-700 rounded-lg">{icon}</div>
        <span className={`flex items-center ${positive ? 'text-green-400' : 'text-red-400'}`}>
          {positive ? <ArrowUp className="h-4 w-4 mr-1" /> : <ArrowDown className="h-4 w-4 mr-1" />}
          {change}
        </span>
      </div>
      <h3 className="text-gray-400 text-sm mb-1">{title}</h3>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-gray-400 mt-2">
        Last {timeRange === '1month' ? 'month' : timeRange === '3months' ? '3 months' : timeRange === '6months' ? '6 months' : 'year'}
      </p>
    </div>
  );
}

const platforms = [
  {
    name: "Twitter",
    icon: <Twitter className="h-6 w-6 text-white" />,
    color: "bg-blue-600",
    followers: "8,234",
    engagement: "3.2%",
    growth: 12.5,
    posts: 45
  },
  {
    name: "LinkedIn",
    icon: <Linkedin className="h-6 w-6 text-white" />,
    color: "bg-blue-700",
    followers: "3,456",
    engagement: "4.8%",
    growth: 8.3,
    posts: 32
  },
  {
    name: "Instagram",
    icon: <Instagram className="h-6 w-6 text-white" />,
    color: "bg-pink-600",
    followers: "12,789",
    engagement: "5.1%",
    growth: -2.1,
    posts: 51
  }
];

const topContent = [
  {
    platform: "twitter",
    title: "AI in Social Media Management",
    excerpt: "Exploring how AI is revolutionizing social media management...",
    date: "2 weeks ago",
    engagement: "2.4K",
    reach: "15.2K",
    growth: 45
  },
  {
    platform: "linkedin",
    title: "Future of Digital Marketing",
    excerpt: "Insights into the evolving landscape of digital marketing...",
    date: "1 month ago",
    engagement: "1.8K",
    reach: "12.5K",
    growth: 32
  },
  {
    platform: "instagram",
    title: "Behind the Scenes",
    excerpt: "A day in the life of our development team...",
    date: "3 weeks ago",
    engagement: "3.2K",
    reach: "18.7K",
    growth: -5
  }
];

const aiInsights = [
  {
    type: "positive",
    title: "Growing Engagement",
    description: "Your engagement rate has increased by 25% in the last month, primarily driven by video content on LinkedIn.",
    recommendation: "Consider creating more video content, especially during peak hours (2-4 PM EST)."
  },
  {
    type: "warning",
    title: "Content Gap Detected",
    description: "There's a noticeable drop in engagement during weekends.",
    recommendation: "Try scheduling 2-3 posts for weekends to maintain consistent engagement."
  },
  {
    type: "negative",
    title: "Declining Instagram Reach",
    description: "Your Instagram reach has decreased by 15% in the past two weeks.",
    recommendation: "Experiment with more Reels and Stories, which have shown higher reach potential."
  },
  {
    type: "positive",
    title: "Hashtag Performance",
    description: "The hashtag #TechInnovation has generated 45% more impressions than your other hashtags.",
    recommendation: "Include this hashtag in relevant future posts to maximize reach."
  }
];