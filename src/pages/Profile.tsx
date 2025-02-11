import React, { useState } from 'react';
import { useProfile } from '../hooks/useProfile';
import { SocialAccountsManager } from '../components/SocialAccountsManager';

export function Profile() {
  const { profile, loading, error, updateProfile } = useProfile();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setUpdateError(null);
    try {
      await updateProfile({ full_name: fullName });
    } catch (err: any) {
      setUpdateError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Profile Settings</h1>

      {(error || updateError) && (
        <div className="bg-red-900 text-white px-4 py-2 rounded-md text-sm mb-4">
          {error || updateError}
        </div>
      )}

      {/* Profile Information */}
      <div className="bg-gray-800 rounded-xl p-6 mb-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={profile?.email || ''}
              disabled
              className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white opacity-50"
            />
          </div>

          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-300">
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={updating}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
            >
              {updating ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Social Accounts Section */}
      <div className="bg-gray-800 rounded-xl p-6">
        <SocialAccountsManager />
      </div>
    </div>
  );
}