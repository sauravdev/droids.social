import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader, Sparkles, Twitter, X } from "lucide-react";
import { useProfile } from "../hooks/useProfile";
import { useProfileSettings } from "../hooks/useProfileSettings";
import { useAuth } from "../context/AuthContext";
import { generateProfileContent, generateImage } from "../lib/openai";
import { SocialAccountsManager } from "../components/SocialAccountsManager";
import { ProfileImageUpload } from "../components/ProfileImageUpload";
import { BACKEND_APIPATH } from "../constants";
import { supabase } from "../lib/supabase";
import { getSocialMediaAccountInfo } from "../lib/api";

export function ProfileSettings() {
  const navigate = useNavigate();
  const { isFirstLogin } = useAuth();
  const {
    profile,
    loading: profileLoading,
    error: profileError,
    updateProfile,
  } = useProfile();
  const {
    settings,
    loading: settingsLoading,
    error: settingsError,
    updateSettings,
  } = useProfileSettings();
  const [showPopup, setShowPopup] = useState(false);
  const [showCreateProfilePopup, setShowCreateProfilePopup] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [bio, setBio] = useState(settings?.bio || "");
  const [niche, setNiche] = useState("");
  const [popupNiche, setPopupNiche] = useState(""); // Separate niche state for popup
  const [timezone, setTimezone] = useState(settings?.timezone || "UTC");
  const [notificationPreferences, setNotificationPreferences] = useState(
    settings?.notification_preferences || { email: true, push: true }
  );
  const [updating, setUpdating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updateTwitterProfile, setUpdateTwitterProfile] =
    useState<boolean>(false);
  const [publicAvatarTwitterUrl, setPublicAvatarTwitterUrl] = useState<
    string | null
  >(null);
  const [publicBannarTwitterUrl, setPublicBannarTwitterUrl] = useState<
    string | null
  >(null);
  const [content, setContent] = useState<any>({});
  const navigateTo = useNavigate();
  const { setRefreshHeader } = useAuth();

  useEffect(() => {
    console.log("settings = " , settings ) ; 
    console.log("settings bio = " , settings?.bio) ; 
    setFullName(profile?.full_name);
    setBio(settings?.bio);
    console.log(!settings?.bio)
    
    // Show create profile popup if user doesn't have bio and it's first login or bio is empty
    // if ((!settings?.bio) && !showCreateProfilePopup) {
      
    //   setShowCreateProfilePopup(true);
    // }
  }, [profile, settings]);

  async function uploadToSupabase(
    imageData: File | Blob,
    fileName: string
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase.storage
        .from("profile-images")
        .upload(fileName, imageData, {
          cacheControl: "3600",
          upsert: true,
          contentType: imageData.type || "image/png",
        });

      if (error) {
        console.error("Error uploading to Supabase:", error);
        return null;
      }
      const { data: urlData } = supabase.storage
        .from("profile-images")
        .getPublicUrl(fileName);

      return urlData?.publicUrl ?? null;
    } catch (err) {
      console.log("error  = ", err);
    }
  }

  const handleGenerateProfile = async (usePopupNiche = false) => {
    const nicheToUse = usePopupNiche ? popupNiche : niche;
    const nameToUse = fullName || profile?.full_name || "";

    if (profile?.tokens - 10 < 0) {
      setError(
        "You do not have enough tokens for profile content generation .."
      );
      navigateTo("/pricing");
      return;
    }
    if (!nameToUse || !nicheToUse) {
      setError(
        "Please provide your name and niche before generating profile content"
      );
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      // Generate profile content
      const newContent = await generateProfileContent(nameToUse, nicheToUse);
      setContent(newContent);

      // Generate images using the generated prompts
      const [avatarUrl, bannerUrl] = await Promise.all([
        generateImage(newContent.profileImagePrompt),
        generateImage(newContent.bannerImagePrompt),
      ]);
      console.log("avatarUrl , bannerUrl = ", avatarUrl, " ", bannerUrl);
      const proxyAvatarUrl = `${
        BACKEND_APIPATH.BASEURL
      }/fetch-image?url=${encodeURIComponent(avatarUrl)}`;
      const response = await fetch(proxyAvatarUrl);
      const avatarImgBLOB = await response.blob();
      const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "");
      const fileName = `uploads/Dalle-avatar-${timestamp}.png`;
      const publicAvatarUrl = await uploadToSupabase(avatarImgBLOB, fileName);
      if (publicAvatarUrl) {
        console.log(
          "public url after uploading to supabase = ",
          publicAvatarUrl
        );
        setPublicAvatarTwitterUrl(publicAvatarUrl);
      }
      const proxyBannerUrl = `${
        BACKEND_APIPATH.BASEURL
      }/fetch-image?url=${encodeURIComponent(bannerUrl)}`;
      const bannar = await fetch(proxyBannerUrl);
      const bannarImgBlob = await bannar.blob();
      const newtimestamp = new Date().toISOString().replace(/[-:.TZ]/g, "");
      const bannarFilename = `uploads/Dalle-avatar-${newtimestamp}.png`;
      const publicBannarUrl = await uploadToSupabase(
        bannarImgBlob,
        bannarFilename
      );

      if (publicBannarUrl) {
        console.log(
          "bannar url after uploading to supabase = ",
          publicBannarUrl
        );
        setPublicBannarTwitterUrl(publicBannarUrl);
      }

      await Promise.all([
        updateProfile({
          full_name: nameToUse,
          avatar_url: publicAvatarUrl,
        }),
        updateSettings({
          bio: newContent.longBio,
          banner_image_url: publicBannarUrl,
        }),
      ]);
      setBio(newContent.longBio);
      if (usePopupNiche) {
        setNiche(popupNiche);
        setShowCreateProfilePopup(false);
      }
      if (profile?.tokens - 10 >= 0) {
        await updateProfile({ tokens: profile?.tokens - 10 });
        setRefreshHeader((prev) => !prev);
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
        notification_preferences: notificationPreferences,
      });

      if (isFirstLogin) {
        navigate("/dashboard");
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
    setUpdateTwitterProfile(true);

    try {
      const response = await fetch(
        `${BACKEND_APIPATH.BASEURL}/twitter/update/profile`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: fullName,
            bio: content?.longBio?.slice(0, 50),
            avatar: publicAvatarTwitterUrl,
          }),
        }
      );
      const data = await response.json();
      console.log("response = ", data);
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000);
    } catch (error: any) {
      setError(error?.message);
      console.log(
        "Something went wrong while updating profile information = ",
        error || error?.message
      );
    } finally {
      setUpdateTwitterProfile(false);
    }
  };

  const handleFetchProfileInfo = async (platform: string) => {
    console.log(platform);
    if (platform == "twitter") {
      const { access_token } = await getSocialMediaAccountInfo(platform);
      try {
        const userResponse = await fetch(
          `${BACKEND_APIPATH.BASEURL}/twitter/users/me`,
          {
            method: "GET",
            headers: {
              access_token,
            },
          }
        );
        const userData = await userResponse.json();
        console.log("user data  = ", userData);
        setFullName(userData?.data?.name);
      } catch (err: any) {
        console.log("Something went wrong ", err?.message || err);
      }
    } else if (platform == "instagram") {
      try {
        const { access_token } = await getSocialMediaAccountInfo(platform);
        const response = await fetch(
          `${BACKEND_APIPATH.BASEURL}/auth/instagram/user/${access_token}`
        );
        const data = await response.json();
        console.log("user data  = ", data);
        setFullName(data?.username);
      } catch (err: any) {
        console.log("Something went wrong ", err?.message || err);
      }
    } else if (platform == "linkedin") {
      try {
        const { access_token } = await getSocialMediaAccountInfo(platform);
        const response = await fetch(
          `${BACKEND_APIPATH.BASEURL}/auth/linkedIn/user/${access_token}`
        );
        const data = await response.json();
        console.log("user data = ", data);
        setFullName(data?.name);
      } catch (err: any) {
        console.log("Something went wrong ", err?.message || err);
      }
    }
  };

  // Create Profile Popup Component
  const CreateProfilePopup = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl p-4 sm:p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-white">Create Your Profile</h2>
          <button
            onClick={() => setShowCreateProfilePopup(false)}
            className="text-gray-400 hover:text-white p-1"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
        
        <p className="text-gray-300 mb-4 text-sm sm:text-base">
          Let's create your professional profile! Please enter your niche to get started.
        </p>

        {error && (
          <div className="bg-red-900 text-white px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label
              htmlFor="popupNiche"
              className="block text-xs sm:text-sm font-medium text-gray-300 mb-2"
            >
              Professional Niche *
            </label>
            <input
              type="text"
              id="popupNiche"
              value={popupNiche}
              onChange={(e) => setPopupNiche(e.target.value)}
              placeholder="e.g., Tech Entrepreneur, Digital Marketing Expert"
              className="block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:ring-purple-500 focus:border-purple-500 text-sm sm:text-base"
              required
              autoFocus
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowCreateProfilePopup(false)}
              className="flex-1 px-4 py-2 border border-gray-600 rounded-md text-gray-300 hover:bg-gray-700 text-sm sm:text-base transition-colors"
            >
              Skip for now
            </button>
            <button
              onClick={() => handleGenerateProfile(true)}
              disabled={generating || !popupNiche.trim() || !fullName}
              className="flex-1 flex justify-center items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md disabled:opacity-50 text-sm sm:text-base transition-colors"
            >
              {generating ? (
                <>
                  <Loader className="animate-spin h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                  <span className="hidden xs:inline">Creating...</span>
                  <span className="xs:hidden">...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                  <span className="hidden xs:inline">Create Profile</span>
                  <span className="xs:hidden">Create</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto ">
      {/* Create Profile Popup */}
      {showCreateProfilePopup && !settings?.bio && <CreateProfilePopup />}

      {/* Success Popup */}
      {showPopup && (
        <div className="fixed top-4 right-4 sm:top-10 sm:right-5 p-3 bg-green-500 text-white rounded-lg shadow-lg z-50 text-sm sm:text-base max-w-xs sm:max-w-none">
          ✅ Twitter Profile Updated Successfully!
        </div>
      )}

      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          {isFirstLogin ? "Complete Your Profile" : "Profile Settings"}
        </h1>
        {isFirstLogin && (
          <p className="mt-2 text-gray-400 text-sm sm:text-base">
            Let's set up your profile to get started. You can always update
            these details later.
          </p>
        )}
      </div>

      {(error || profileError || settingsError) && (
        <div className="bg-red-900 text-white px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm mb-4 sm:mb-6">
          {error || profileError || settingsError}
        </div>
      )}

      {/* Only show the main form if user has bio or has dismissed the popup */}
      {(bio && bio.trim() !== "") || !showCreateProfilePopup ? (
        <div className="space-y-4 sm:space-y-6">
          {/* Profile Images */}

          <div className="relative">
              <label
                htmlFor="niche"
                className="block text-xs sm:text-sm font-medium text-gray-300 flex items-center gap-2 mb-1 sm:mb-2"
              >
                Professional Niche
                <div className="relative group">
                  <svg
                    className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 hover:text-gray-300 cursor-help"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 sm:px-3 py-1 sm:py-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 max-w-xs sm:max-w-none">
                    <span className="hidden sm:inline">This field is editable - manually enter your professional specialty</span>
                    <span className="sm:hidden">Manually enter your specialty</span>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                  </div>
                </div>
              </label>
              <input
                type="text"
                id="niche"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder="e.g., Tech Entrepreneur, Digital Marketing Expert"
                className="block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:ring-purple-500 focus:border-purple-500 text-sm sm:text-base"
              />
            </div>


           <button
                type="button"
                onClick={() => handleGenerateProfile(false)}
                disabled={generating || !fullName || !niche}
                className="w-full flex justify-center items-center px-3 sm:px-4 py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 transition-colors min-h-[44px]"
              >
                {generating ? (
                  <>
                    <Loader className="animate-spin h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
                    <span className="hidden xs:inline">Generating...</span>
                    <span className="xs:hidden">Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
                    <span className="hidden xs:inline">Generate Profile</span>
                    <span className="xs:hidden">Generate</span>
                  </>
                )}
              </button>

               

          <div className="bg-gray-800 rounded-xl overflow-hidden">
            <ProfileImageUpload
              type="banner"
              currentUrl={settings?.banner_image_url || null}
              onUpload={(url) => updateSettings({ banner_image_url: url })}
            />
            <div className="p-4 sm:p-6">
              <div className="flex items-end -mt-12 sm:-mt-16 mb-4">
                <div className="w-24 h-24 sm:w-32 sm:h-32 relative">
                  <ProfileImageUpload
                    type="avatar"
                    currentUrl={profile?.avatar_url || null}
                    onUpload={(url) => updateProfile({ avatar_url: url })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <form
            onSubmit={handleSubmit}
            className="bg-gray-800 rounded-xl p-4 sm:p-6 space-y-4 sm:space-y-6"
          >
            <div>
              <label
                htmlFor="fullName"
                className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2"
              >
                Full Name
              </label>
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:ring-purple-500 focus:border-purple-500 text-sm sm:text-base"
                required
              />
            </div>

           
            <div>
              <label
                htmlFor="bio"
                className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2"
              >
                Bio
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:ring-purple-500 focus:border-purple-500 text-sm sm:text-base resize-vertical"
              />
            </div>

            {/* <div>
              <label
                htmlFor="timezone"
                className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2"
              >
                Timezone
              </label>
              <select
                id="timezone"
                value={settings?.timezone || timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:ring-purple-500 focus:border-purple-500 text-sm sm:text-base"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
              </select>
            </div> */}

            {/* <div>
              <h3 className="text-xs sm:text-sm font-medium text-gray-300 mb-2 sm:mb-3">
                Notification Preferences
              </h3>
              <div className="space-y-2 sm:space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={notificationPreferences.email}
                    onChange={(e) =>
                      setNotificationPreferences((prev) => ({
                        ...prev,
                        email: e.target.checked,
                      }))
                    }
                    className="rounded border-gray-600 text-purple-600 focus:ring-purple-500 bg-gray-700 w-4 h-4 sm:w-5 sm:h-5"
                  />
                  <span className="ml-2 text-xs sm:text-sm text-gray-300">
                    Email Notifications
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={notificationPreferences.push}
                    onChange={(e) =>
                      setNotificationPreferences((prev) => ({
                        ...prev,
                        push: e.target.checked,
                      }))
                    }
                    className="rounded border-gray-600 text-purple-600 focus:ring-purple-500 bg-gray-700 w-4 h-4 sm:w-5 sm:h-5"
                  />
                  <span className="ml-2 text-xs sm:text-sm text-gray-300">
                    Push Notifications
                  </span>
                </label>
              </div>
            </div> */}

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              

              <button
                type="submit"
                disabled={updating}
                className="flex-1 flex justify-center items-center px-3 sm:px-4 py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors min-h-[44px]"
              >
                {updating ? (
                  <>
                    <Loader className="animate-spin h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
                    <span className="hidden xs:inline">Saving...</span>
                    <span className="xs:hidden">Save...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
              
              {selectedPlatform == "twitter" && !generating && bio !== "" && (
                <button
                  onClick={() => {
                    handleTwitterProfileUpdate();
                  }}
                  type="button"
                  disabled={updateTwitterProfile}
                  className="flex-1 flex justify-center items-center px-3 sm:px-4 py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors min-h-[44px]"
                >
                  {updateTwitterProfile ? (
                    <>
                      <Loader className="animate-spin h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
                      <span className="hidden xs:inline">Updating...</span>
                      <span className="xs:hidden">Update...</span>
                    </>
                  ) : (
                    <>
                      <Twitter className="mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="hidden xs:inline">Update Profile</span>
                      <span className="xs:hidden">Update</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </form>

          {/* Social Accounts Section */}
          {/* <div className="bg-gray-800 rounded-xl p-4 sm:p-6">
            <SocialAccountsManager selectedPlatform = {selectedPlatform}  setSelectedPlatform = {setSelectedPlatform} handleFetchProfileInfo = {handleFetchProfileInfo} />
          </div> */}
        </div>
      ) : (
        // Show a simple message when popup is dismissed but no bio exists
        <div className="bg-gray-800 rounded-xl p-4 sm:p-6 text-center">
          <p className="text-gray-300 mb-4 text-sm sm:text-base">
            Create your profile to get started with personalized content generation.
          </p>
          <button
            onClick={() => setShowCreateProfilePopup(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm sm:text-base transition-colors"
          >
            Create Profile
          </button>
        </div>
      )}
    </div>
  );
}