import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader } from 'lucide-react';
import { handleLinkedInCallback } from '../../lib/linkedin';

export function LinkedInCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');

        if (!code || !state) {
          throw new Error('Missing required parameters');
        }

        await handleLinkedInCallback(code, state);
        navigate('/settings', { 
          replace: true,
          state: { message: 'LinkedIn account connected successfully!' }
        });
      } catch (err: any) {
        setError(err.message);
      }
    }

    handleCallback();
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-red-900 text-white px-4 py-2 rounded-md">
          Error connecting LinkedIn account: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <Loader className="h-8 w-8 animate-spin text-purple-500 mx-auto" />
        <p className="mt-4 text-white">Connecting your LinkedIn account...</p>
      </div>
    </div>
  );
}