import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader, Sparkles  ,Twitter } from 'lucide-react';
import { useProfile } from '../hooks/useProfile';
import { useProfileSettings } from '../hooks/useProfileSettings';
import { useAuth } from '../context/AuthContext';
import { generateProfileContent, generateImage } from '../lib/openai';
import { SocialAccountsManager } from '../components/SocialAccountsManager';
import { ProfileImageUpload } from '../components/ProfileImageUpload';
import { BACKEND_APIPATH } from '../constants';
import { supabase } from '../lib/supabase';
import { getSocialMediaAccountInfo } from '../lib/api';

export function ProfileSettings() {
  const navigate = useNavigate();
  const { isFirstLogin } = useAuth();
  const { profile, loading: profileLoading, error: profileError, updateProfile } = useProfile();
  const { settings, loading: settingsLoading, error: settingsError, updateSettings } = useProfileSettings();
  const [showPopup , setShowPopup] = useState(false) ;
  const [selectedPlatform , setSelectedPlatform] = useState<string>("") ; 
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [bio, setBio] = useState( settings?.bio || '');
  const [niche, setNiche] = useState('');
  const [timezone, setTimezone] = useState(settings?.timezone || 'UTC');
  const [notificationPreferences, setNotificationPreferences] = useState(
    settings?.notification_preferences || { email: true, push: true }
  );
  const [updating, setUpdating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updateTwitterProfile , setUpdateTwitterProfile] = useState<boolean>(false) ; 
  const [publicAvatarTwitterUrl , setPublicAvatarTwitterUrl] = useState<string | null > (null) ; 
  const [publicBannarTwitterUrl  , setPublicBannarTwitterUrl] = useState<string | null> (null) ; 
  const [content , setContent ] = useState<any>({}) ;
  const navigateTo = useNavigate(); 
  const {setRefreshHeader} = useAuth() ; 

  useEffect(() => {
    setFullName(profile?.full_name) ; 
    setBio(settings?.bio) ;
  } , [profile , settings] ) 
   async function uploadToSupabase(imageData: File | Blob, fileName: string): Promise<string | null> {
        try{
          const { data, error } = await supabase.storage
          .from('profile-images')  
          .upload(fileName, imageData, {
            cacheControl: '3600', 
            upsert: true , 
            contentType: imageData.type || 'image/png',
          });
      
        if (error) {
          console.error('Error uploading to Supabase:', error);
          return null;
        }
        const { data: urlData } = supabase.storage
          .from('profile-images')
          .getPublicUrl(fileName);
      
        return urlData?.publicUrl ?? null;
        }
        catch(err) 
        {
          console.log("error  = " , err ) 
        } 
    }
  

  const handleGenerateProfile = async () => {
    if((profile?.tokens - 10 ) < 0 ) 
      {
      setError("You do not have enough tokens for profile content generation ..") ; 
      navigateTo("/pricing"); 
       return ; 
    } 
    if (!fullName || !niche) {
      setError('Please provide your name and niche before generating profile content');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      // Generate profile content
      const newContent = await generateProfileContent(fullName, niche);
      setContent(newContent) ; 
      
      // Generate images using the generated prompts
      const [avatarUrl, bannerUrl] = await Promise.all([
        generateImage(newContent.profileImagePrompt),
        generateImage(newContent.bannerImagePrompt)
      ]);
      console.log("avatarUrl , bannerUrl = " , avatarUrl , " ",  bannerUrl) ; 
      const proxyAvatarUrl = `${BACKEND_APIPATH.BASEURL}/fetch-image?url=${encodeURIComponent(avatarUrl)}`;
      const response = await fetch(proxyAvatarUrl);
      const avatarImgBLOB = await response.blob();
      const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "");
      const fileName = `uploads/Dalle-avatar-${timestamp}.png`;
      const publicAvatarUrl = await uploadToSupabase(avatarImgBLOB, fileName);
      if (publicAvatarUrl) {
        console.log("public url after uploading to supabase = " , publicAvatarUrl) ; 
        setPublicAvatarTwitterUrl(publicAvatarUrl)
      }
      const proxyBannerUrl = `${BACKEND_APIPATH.BASEURL}/fetch-image?url=${encodeURIComponent(bannerUrl)}`;
      const bannar = await fetch(proxyBannerUrl);
      const bannarImgBlob = await bannar.blob();
      const newtimestamp = new Date().toISOString().replace(/[-:.TZ]/g, "");
      const bannarFilename = `uploads/Dalle-avatar-${newtimestamp}.png`;
      const publicBannarUrl = await uploadToSupabase(bannarImgBlob, bannarFilename);
      
      if(publicBannarUrl) 
      {
        console.log("public url after uploading to supabase = " , publicBannarUrl) ; 
        setPublicBannarTwitterUrl(publicBannarUrl)
      }
    

      await Promise.all([
        updateProfile({
          full_name: fullName,
          avatar_url: publicAvatarUrl
        }),
        updateSettings({
          bio: newContent.longBio,
          banner_image_url: publicBannarUrl
        })
      ]);
      setBio(newContent.longBio);
      if((profile?.tokens - 10 ) >= 0 ) 
        {
          await updateProfile({tokens : profile?.tokens - 10 })
          setRefreshHeader((prev) => !prev) ; 
        } 
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
      await updateProfile({ full_name: fullName });
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

  const handleTwitterProfileUpdate = async () => {
    setUpdateTwitterProfile(true ) ;  

      try{
        const response = await fetch(`${BACKEND_APIPATH.BASEURL}/twitter/update/profile` ,{
          method  :"POST" , 
          headers : {
            "Content-Type": "application/json",
          } ,
          body  : JSON.stringify({name : fullName , bio : content?.longBio?.slice(0,50) , avatar : publicAvatarTwitterUrl   })
        })
        const data = await response.json() ; 
        console.log("response = "  , data  ) ;  
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 3000);
     
      }
      catch(error : any ) 
      {
        setError(error?.message);
        console.log("Something went wrong while updating profile information = " , error || error?.message )
      }
      finally{
        setUpdateTwitterProfile(false) ; 
      }

    




   
  }
  const handleFetchProfileInfo  = async (platform : string ) => {
    console.log(platform) ; 
    if(platform == "twitter") 
    {
     const {access_token } = await getSocialMediaAccountInfo(platform)  ;
     try{
 
       const userResponse = await fetch(`${BACKEND_APIPATH.BASEURL}/twitter/users/me`, {
         method: 'GET',
         headers: {
           access_token 
         },
       });
       const userData = await userResponse.json()  ;
       console.log("user data  = " , userData) ; 
       setFullName(userData?.data?.name) 
     }
     catch(err : any ) 
     {
       console.log("Something went wrong " , err?.message || err ) 
       
     } 
    }
    else if(platform == "instagram") 
    {
      try{
        const {access_token  }  = await getSocialMediaAccountInfo(platform) ; 
        const response = await fetch(
              `${BACKEND_APIPATH.BASEURL}/auth/instagram/user/${access_token}` ,
            ) 
        const data = await response.json();
        console.log("user data  = " , data)  ; 
        setFullName(data?.username)
      }
      catch(err : any ) 
      {
        console.log("Something went wrong " , err?.message || err ) 
        
      } 
    }
  
    else if(platform == "linkedin") 
    {
 
      try{
        const {access_token } = await getSocialMediaAccountInfo(platform ) ;
        const response  =  await fetch(`${BACKEND_APIPATH.BASEURL}/auth/linkedIn/user/${access_token}`) ;
        const data = await response.json() ; 
        console.log("user data = " , data) ;
        setFullName(data?.name) 
        
      }
      catch(err : any ) 
      {
        console.log("Something went wrong " , err?.message || err ) 
        
      } 
    }
      
    }
 
   
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {showPopup && (
        <div className="absolute top-10 right-5 p-3 bg-green-500 text-white rounded-lg shadow-lg">
          ✅ Twitter Profile Updated Successfully!
        </div>
      )}
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
        <div className="bg-gray-800 rounded-xl ">
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
              value={ fullName}
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
              value={ bio}
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
              value={settings?.timezone || timezone}
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
            {selectedPlatform == "twitter" && !generating && bio !== "" &&   <button
              onClick={() => {handleTwitterProfileUpdate() }}
              type="submit"
              disabled={updateTwitterProfile}
              className="flex-1 flex justify-center capitazlize  items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {updateTwitterProfile ? (
                <>
                  <Loader className="animate-spin h-5 w-5 mr-2" />
                  updating...
                </>
              ) : (
               <>         <Twitter className='mr-2 h-4 w-4'/> <span className='capitalize '>Update profile</span>
                          
                </>
              )}
            </button>}
          </div>
        </form>

        {/* Social Accounts Section */}
        {/* <div className="bg-gray-800 rounded-xl p-6">
          <SocialAccountsManager selectedPlatform = {selectedPlatform}  setSelectedPlatform = {setSelectedPlatform} handleFetchProfileInfo = {handleFetchProfileInfo} />
        </div> */}
      </div>
    </div>
    
  );
}