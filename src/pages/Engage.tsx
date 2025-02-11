import React from 'react';
import { MessageSquare, ThumbsUp, Share2, Twitter, Linkedin, Instagram, Link2, Heart, Repeat2, Reply, Quote } from 'lucide-react';
import { useSocialAccounts } from '../hooks/useSocialAccounts';
import { initializeTwitterAuth } from '../lib/twitter';
import { initializeLinkedInAuth } from '../lib/linkedin';

export function Engage() {
  const { accounts, loading, error } = useSocialAccounts();

  const handleConnect = (platform: string) => {
    switch (platform) {
      case 'twitter':
        initializeTwitterAuth();
        break;
      case 'linkedin':
        initializeLinkedInAuth();
        break;
      default:
        console.log('Platform not implemented:', platform);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4 bg-red-100 rounded-lg">
        Error loading social accounts: {error}
      </div>
    );
  }
  // changing condition 
  if (accounts.length ===0  ) { 
    return (
      <div>
        <h1 className="text-3xl font-bold text-white mb-8">Engagement Hub</h1>
        <div className="bg-gray-800 rounded-xl p-8 text-center">
          <h2 className="text-xl font-semibold text-white mb-4">No Social Media Accounts Connected</h2>
          <p className="text-gray-400 mb-6">Connect your social media accounts to start engaging with your audience.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => handleConnect('twitter')}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
            >
              <Twitter className="h-5 w-5" />
              <span>Connect Twitter</span>
              <Link2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleConnect('linkedin')}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg"
            >
              <Linkedin className="h-5 w-5" />
              <span>Connect LinkedIn</span>
              <Link2 className="h-4 w-4" />
            </button>
            <button
              className="flex items-center space-x-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg"
            >
              <Instagram className="h-5 w-5" />
              <span>Connect Instagram</span>
              <Link2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Engagement Hub</h1>

      {/* Consolidated Feed */}
      <div className="space-y-6">
        {socialFeed.map((post, index) =>  (
          <div key={index} className="bg-gray-800 rounded-xl p-6">
            {/* Post Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <img
                  src={post.user.avatar}
                  alt={post.user.name}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="text-white font-medium">{post.user.name}</p>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400 text-sm">@{post.user.handle}</span>
                    <span className="text-gray-500">·</span>
                     <span className="text-gray-400 text-sm">{post.time}</span>
                  </div>
                </div>
              </div>
              <PlatformIcon platform={post.platform} />
            </div>

            {/* Post Content */}
            <div className="mb-4">
              <p className="text-white">{post.content}</p>
              {post.image && (
                <img
                  src={post.image}
                  alt="Post content"
                  className="mt-3 rounded-lg w-full object-cover"
                />
              )}
            </div>

            {/* Engagement Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-700">
              <EngagementButton
                icon={<Heart className="h-5 w-5" />}
                count={post.likes}
                onClick={() => console.log('Like')}
                active={post.liked}
              />
              <EngagementButton
                icon={<Reply className="h-5 w-5" />}
                count={post.comments}
                onClick={() => console.log('Comment')}
              />
              <EngagementButton
                icon={<Repeat2 className="h-5 w-5" />}
                count={post.reposts}
                onClick={() => console.log('Repost')}
                active={post.reposted}
              />
              <EngagementButton
                icon={<Quote className="h-5 w-5" />}
                count={post.quotes}
                onClick={() => console.log('Quote')}
              />
            </div>
          </div>
        ))}
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

interface EngagementButtonProps {
  icon: React.ReactNode;
  count: number;
  onClick: () => void;
  active?: boolean;
}

function EngagementButton({ icon, count, onClick, active }: EngagementButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 p-2 rounded-lg transition-colors ${
        active
          ? 'text-purple-500 hover:text-purple-400'
          : 'text-gray-400 hover:text-white'
      }`}
    >
      {icon}
      <span className="text-sm">{count}</span>
    </button>
  );
}

// Sample data for the social feed
const socialFeed = [
  {
    user: {
      name: "Sarah Chen",
      handle: "sarahchen",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330"
    },
    content: "Just launched our new AI-powered feature! Check out how it's revolutionizing the way we handle social media management. #TechInnovation #AI",
    time: "5m ago",
    platform: "twitter",
    likes: 24,
    comments: 5,
    reposts: 8,
    quotes: 2,
    liked: true,
    reposted: false
  },
  {
    user: {
      name: "David Kim",
      handle: "davidkim",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d"
    },
    content: "Excited to share my thoughts on the future of AI in social media management. What are your predictions for the next 5 years?",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995",
    time: "15m ago",
    platform: "linkedin",
    likes: 156,
    comments: 23,
    reposts: 12,
    quotes: 5,
    liked: false,
    reposted: true
  },
  {
    user: {
      name: "Alex Rivera",
      handle: "alexrivera",
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6"
    },
    content: "Behind the scenes look at how we're building the future of social media management! 🚀 #TechStartup #Innovation",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f",
    time: "1h ago",
    platform: "instagram",
    likes: 342,
    comments: 18,
    reposts: 45,
    quotes: 8,
    liked: false,
    reposted: false
  }
];