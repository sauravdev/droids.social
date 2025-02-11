import React from 'react';
import { Calendar, MessageSquare, Users, TrendingUp, Twitter, Linkedin, Instagram, Link2 } from 'lucide-react';
import { useProfile } from '../hooks/useProfile';
import { useScheduledPosts } from '../hooks/useScheduledPosts';
import { useSocialAccounts } from '../hooks/useSocialAccounts';
import { initializeTwitterAuth } from '../lib/twitter';
import { initializeLinkedInAuth } from '../lib/linkedin';
import { useNavigate } from 'react-router-dom';
import { loginWithInstagram } from '../lib/InstagramAuth';
import LinkedInAuth from '../lib/LinkedInAuth';
import { handleLogin } from '../lib/LinkedInAuth';

export function Dashboard() {
  const { profile, loading: profileLoading } = useProfile();
  const { posts, loading: postsLoading } = useScheduledPosts();
  const { accounts, loading: accountsLoading } = useSocialAccounts();


  if (profileLoading || postsLoading || accountsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const totalFollowers = accounts.reduce((sum, account) => sum + parseInt(account.username) || 0, 0);
  const upcomingPostsCount = posts.filter(post => new Date(post.scheduled_for) > new Date()).length;

  const handleConnect = async (platform: string) => {
    switch (platform) {
      case 'twitter':
        await initializeTwitterAuth();
        break;
      case 'linkedin':
        handleLogin() 
        break;
      case 'instagram':
          loginWithInstagram() ; 
          break;
      default:
        console.log('Platform not implemented:', platform);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">
        Welcome back, {profile?.full_name || 'User'}!
      </h1>
      
      {/* Social Connections CTA */}
      { (
        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Connect Your Social Accounts</h2>
          <p className="text-gray-400 mb-6">Get started by connecting your social media accounts to enable automatic posting and analytics.</p>
          <div className="flex flex-wrap gap-4">
            { <button
              disabled={accounts.find((account) => account?.platform == "twitter") ? true : false}
              onClick={() => handleConnect('twitter')}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
            >
              <Twitter className="h-5 w-5" />
              <span>{accounts.find((account) => account?.platform == "twitter") ? 'twitter connected' : 'connect twitter'}</span>
              <Link2 className="h-4 w-4" />
            </button>}
            <button
            disabled={accounts.find((account) => account?.platform == "linkedin") ? true : false}
              onClick={() => handleConnect('linkedin')}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg"
            >
              <Linkedin className="h-5 w-5" />
              <span>{accounts.find((account) => account?.platform == 'linkedin') ? "linkedIn connected" : "connect linkedIn"}</span>
              <Link2 className="h-4 w-4" />
            </button>
            <button
            onClick={() => {handleConnect("instagram")}}
            disabled={accounts.find((account) => account?.platform == "instagram") ? true : false}
              className="flex items-center space-x-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg"
            >
              <Instagram className="h-5 w-5" />
              <span>{accounts.find((account) => account?.platform == 'instagram') ? "instagram connected" : "connect instagram"}</span>
              <Link2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<Users className="w-6 h-6 text-purple-500" />}
          title="Total Followers"
          value={totalFollowers.toLocaleString()}
          trend="+23%"
        />
        <StatCard
          icon={<MessageSquare className="w-6 h-6 text-purple-500" />}
          title="Engagement Rate"
          value="4.8%"
          trend="+1.2%"
        />
        <StatCard
          icon={<Calendar className="w-6 h-6 text-purple-500" />}
          title="Scheduled Posts"
          value={upcomingPostsCount.toString()}
          trend="Next 7 days"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6 text-purple-500" />}
          title="Growth Rate"
          value="2.4%"
          trend="+0.6%"
        />
      </div>

      {/* Content Calendar Preview */}
      <div className="bg-gray-800 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-bold text-white mb-4">Upcoming Content</h2>
        <div className="space-y-4">
          {posts
            .filter(post => new Date(post.scheduled_for) > new Date())
            .slice(0, 3)
            .map((post) => (
              <div key={post.id} className="flex items-center justify-between bg-gray-700 p-4 rounded-lg">
                <div>
                  <p className="text-white font-medium">{post.content.slice(0, 50)}...</p>
                  <p className="text-gray-400 text-sm">{post.platform}</p>
                </div>
                <div className="text-right">
                  <p className="text-purple-400">
                    {new Date(post.scheduled_for).toLocaleDateString()}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {new Date(post.scheduled_for).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* AI Suggestions */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">AI Suggestions</h2>
        <div className="space-y-4">
          {suggestions.map((suggestion, index) => (
            <div key={index} className="bg-gray-700 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${suggestion.type === 'high' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                <span className="text-white font-medium">{suggestion.title}</span>
              </div>
              <p className="text-gray-400">{suggestion.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  trend: string;
}

function StatCard({ icon, title, value, trend }: StatCardProps) {
  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-gray-700 rounded-lg">{icon}</div>
        <span className="text-green-500 text-sm">{trend}</span>
      </div>
      <h3 className="text-gray-400 text-sm mb-1">{title}</h3>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

const suggestions = [
  {
    type: "high",
    title: "Engagement Opportunity",
    description: "A trending hashtag #TechTips is gaining traction. Consider creating a thread sharing your expertise."
  },
  {
    type: "medium",
    title: "Content Gap",
    description: "Your audience engages well with tutorial content. Consider posting more how-to guides this week."
  }
];