import React, { useState } from 'react';
import { Twitter, Linkedin, Instagram, Link2, Unlink, Loader } from 'lucide-react';
import { useSocialAccounts } from '../hooks/useSocialAccounts';
import { initializeTwitterAuth } from '../lib/twitter';
import { initializeLinkedInAuth } from '../lib/linkedin';
import { getSocialAccounts, getSocialMediaAccountInfo } from '../lib/api';
import { BACKEND_APIPATH } from '../constants';
interface PlatformConfig {
  name: string;
  icon: React.ReactNode;
  color: string;
}
interface SocialAccountsManagerProps {
  handleFetchProfileInfo : any 
}

const platforms: Record<string, PlatformConfig> = {
  twitter: {
    name: 'Twitter',
    icon: <Twitter className="h-5 w-5" />,
    color: 'text-blue-400'
  },
  linkedin: {
    name: 'LinkedIn',
    icon: <Linkedin className="h-5 w-5" />,
    color: 'text-blue-600'
  },
  instagram: {
    name: 'Instagram',
    icon: <Instagram className="h-5 w-5" />,
    color: 'text-pink-500'
  }
};

export function SocialAccountsManager({handleFetchProfileInfo} : SocialAccountsManagerProps) {
  const { accounts, loading, error, unlinkAccount } = useSocialAccounts();
  const [connecting, setConnecting] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [selectedPlatform , setSelectedPlatform] = useState<string>("") ; 

  const handleConnect = async (platform: string) => {
    setConnecting(platform);
    setUpdateError(null);
    try {
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
    } catch (err: any) {
      setUpdateError(err.message);
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (platform: string) => {
    setDisconnecting(platform);
    setUpdateError(null);
    try {
      await unlinkAccount(platform);
    } catch (err: any) {
      setUpdateError(err.message);
    } finally {
      setDisconnecting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader className="h-6 w-6 animate-spin text-purple-500" />
      </div>
    );
  }

  

  return (
    <div>
      <h2 className="text-lg font-medium text-white mb-4">Connected Accounts</h2>

      {(error || updateError) && (
        <div className="bg-red-900 text-white px-4 py-2 rounded-md text-sm mb-4">
          {error || updateError}
        </div>
      )}

      <div className="space-y-4">
        {Object.entries(platforms).map(([platform, config]) => {
          const isConnected = accounts.some(acc => acc.platform === platform);
          const account = accounts.find(acc => acc.platform === platform);
          const isLoading = connecting === platform || disconnecting === platform;

          return (
            <div key={platform} onClick={() => {setSelectedPlatform(platform) ; handleFetchProfileInfo(platform) }} className={`flex items-center justify-between bg-gray-700 p-4 rounded-lg ${selectedPlatform  == platform ? "border-2 border-purple-500 " : ""} ` }>
              <div className="flex items-center space-x-3">
                <div className={`${config.color}`}>
                  {config.icon}
                </div>
                <div>
                  <p className="text-white font-medium">{config.name}</p>
                  {account && (
                    <p className="text-gray-400 text-sm">@{account.username}</p>
                  )}
                </div>
              </div>

              <button
                onClick={() => isConnected ? handleDisconnect(platform) : handleConnect(platform)}
                disabled={isLoading}
                className={`flex items-center space-x-2 px-3 py-1 rounded-md text-sm ${
                  isConnected
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                } disabled:opacity-50`}
              >
                {isLoading ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    <span>{isConnected ? 'Disconnecting...' : 'Connecting...'}</span>
                  </>
                ) : (
                  <>
                    {isConnected ? (
                      <>
                        <Unlink className="h-4 w-4" />
                        <span>Disconnect</span>
                      </>
                    ) : (
                      <>
                        <Link2 className="h-4 w-4" />
                        <span>Connect</span>
                      </>
                    )}
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}