import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader, Sparkles } from 'lucide-react';
import { useProfile } from '../hooks/useProfile';
import { useProfileSettings } from '../hooks/useProfileSettings';
import { useAuth } from '../context/AuthContext';
import { generateProfileContent, generateImage } from '../lib/openai';
import { SocialAccountsManager } from '../components/SocialAccountsManager';
import { ProfileImageUpload } from '../components/ProfileImageUpload';

export function ProfileSettings() {
  const navigate = useNavigate();
  const { isFirstLogin } = useAuth();
  const { profile, loading: profileLoading, error: profileError, updateProfile } = useProfile();
  const { settings, loading: settingsLoading, error: settingsError, updateSettings } = useProfileSettings();
  
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [bio, setBio] = useState(settings?.bio || '');
  const [niche, setNiche] = useState('');
  const [timezone, setTimezone] = useState(settings?.timezone || 'UTC');
  const [notificationPreferences, setNotificationPreferences] = useState(
    settings?.notification_preferences || { email: true, push: true }
  );
  const [updating, setUpdating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  

  const handleGenerateProfile = async () => {
    if (!fullName || !niche) {
      setError('Please provide your name and niche before generating profile content');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      // Generate profile content
      const content = await generateProfileContent(fullName, niche);
      
      // Generate images using the generated prompts
      const [avatarUrl, bannerUrl] = await Promise.all([
        generateImage(content.profileImagePrompt),
        generateImage(content.bannerImagePrompt)
      ]);

      // Update profile and settings
      await Promise.all([
        updateProfile({
          full_name: fullName,
          avatar_url: avatarUrl
        }),
        updateSettings({
          bio: content.longBio,
          banner_image_url: bannerUrl
        })
      ]);

      // Update local state
      setBio(content.longBio);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setError(null);

    try {
      // Update profile
      await updateProfile({ full_name: fullName });

      // Update settings
      await updateSettings({
        bio,
        timezone,
        notification_preferences: notificationPreferences
      });

      if (isFirstLogin) {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  if (profileLoading || settingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">
          {isFirstLogin ? 'Complete Your Profile' : 'Profile Settings'}
        </h1>
        {isFirstLogin && (
          <p className="mt-2 text-gray-400">
            Let's set up your profile to get started. You can always update these details later.
          </p>
        )}
      </div>

      {(error || profileError || settingsError) && (
        <div className="bg-red-900 text-white px-4 py-2 rounded-md text-sm mb-6">
          {error || profileError || settingsError}
        </div>
      )}

      <div className="space-y-6">
        {/* Profile Images */}
        <div className="bg-gray-800 rounded-xl overflow-hidden">
          <ProfileImageUpload
            type="banner"
            currentUrl={settings?.banner_image_url || null}
            onUpload={url => updateSettings({ banner_image_url: url })}
          />
          <div className="p-6">
            <div className="flex items-end -mt-16 mb-4">
              <div className="w-32 h-32 relative">
                <ProfileImageUpload
                  type="avatar"
                  currentUrl={profile?.avatar_url || null}
                  onUpload={url => updateProfile({ avatar_url: url })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl p-6 space-y-6">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-300">
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:ring-purple-500 focus:border-purple-500"
              required
            />
          </div>

          <div>
            <label htmlFor="niche" className="block text-sm font-medium text-gray-300">
              Professional Niche
            </label>
            <input
              type="text"
              id="niche"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="e.g., Tech Entrepreneur, Digital Marketing Expert"
              className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-300">
              Bio
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div>
            <label htmlFor="timezone" className="block text-sm font-medium text-gray-300">
              Timezone
            </label>
            <select
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
            </select>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-300">Notification Preferences</h3>
            <div className="mt-2 space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={notificationPreferences.email}
                  onChange={(e) => setNotificationPreferences(prev => ({
                    ...prev,
                    email: e.target.checked
                  }))}
                  className="rounded border-gray-600 text-purple-600 focus:ring-purple-500 bg-gray-700"
                />
                <span className="ml-2 text-sm text-gray-300">Email Notifications</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={notificationPreferences.push}
                  onChange={(e) => setNotificationPreferences(prev => ({
                    ...prev,
                    push: e.target.checked
                  }))}
                  className="rounded border-gray-600 text-purple-600 focus:ring-purple-500 bg-gray-700"
                />
                <span className="ml-2 text-sm text-gray-300">Push Notifications</span>
              </label>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={handleGenerateProfile}
              disabled={generating || !fullName || !niche}
              className="flex-1 flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader className="animate-spin h-5 w-5 mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Generate Profile
                </>
              )}
            </button>

            <button
              type="submit"
              disabled={updating}
              className="flex-1 flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {updating ? (
                <>
                  <Loader className="animate-spin h-5 w-5 mr-2" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>

        {/* Social Accounts Section */}
        <div className="bg-gray-800 rounded-xl p-6">
          <SocialAccountsManager />
        </div>
      </div>
    </div>
  );
}