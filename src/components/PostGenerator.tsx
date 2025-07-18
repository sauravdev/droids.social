import React, { useEffect, useState } from "react";
import {
  Loader,
  Calendar,
  Save,
  Twitter,
  Linkedin,
  Instagram,
  Download,
  X,
  Image,
} from "lucide-react";
import {
  generateImage,
  generatePostGeneric,
  generateTopics,
  generateTopicsUsingGrok,
  generateVideoDescription,
  generateVideoDescriptionUsingGrok,
  generateVideoPrompt,
  generateVideoPromptUsingGrok,
} from "../lib/openai";
import type { ContentPlan } from "../lib/types";
import Editor from "./Editor";
import { getSocialMediaAccountInfo, updateContentPlan } from "../lib/api";
import { BACKEND_APIPATH } from "../constants";
import { initializeTwitterAuth } from "../lib/twitter";
import aiMagic from "../assets/ai.png";
import { useContentPlan } from "../hooks/useContentPlan";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { useProfile } from "../hooks/useProfile";
import { useNavigate } from "react-router-dom";
interface PostGeneratorProps {
  plan: ContentPlan;
  onSave: (updates: Partial<ContentPlan>) => Promise<void>;
  onSchedule: () => void;
  setSelectedPlan: (action: any) => void;
  selectedPlan: any;
}
interface Success {
  state: boolean;
  message: string;
}

export function PostGenerator({
  plan,
  onSave,
  onSchedule,
  setSelectedPlan,
}: PostGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  // const [deleting , setDeleting] = useState(false) ;
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState(plan.suggestion || "");
  const [tone, setTone] = useState<string>("");
  const [posting, setPosting] = useState<boolean>(false);
  const [success, setSuccess] = useState<Success>({
    state: false,
    message: "",
  });

  const { setRefreshHeader } = useAuth();

  const navigateTo = useNavigate();
  const { profile, updateProfile } = useProfile();
  const [generatedImage, setGeneratedImage] = useState(plan?.media || "");
  const { updatePlan } = useContentPlan();
  const [showVideoPopup, setShowVideoPopup] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [isVideoGenerated, setIsVideoGenerated] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState(null);

  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [loadingTopics , setLoadingTopics] = useState<boolean>(false) ; 

  const { selectedModel } = useAuth();
  const [generatedTopics, setGeneratedTopics] = useState([]);
  

  useEffect(() => {
    console.log("current plan = ", plan);
    setGeneratedImage(plan?.media || "");
    setGeneratedTopics(plan?.generatedTopics || []);
    if(Array.isArray(plan?.generatedTopics) && plan?.generatedTopics?.length > 0  ) 
    {
      setSelectedTopic(plan?.topic); 
    }
    console.log("--------------------------- > ", plan?.generatedTopics);
  }, []);

  useEffect(() => {
    console.log(
      "-----------------------change in plan detected ---------------------"
    );
  }, [plan]);

  useEffect(() => {
    console.log("change detected in edtior data = ", content);
  }, [content]);

  const generateVideoUsingKling = async (planId: any, prompt: string) => {
    setGeneratedVideo(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");
      const response = await fetch(
        `${BACKEND_APIPATH.BASEURL}/generate-video`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt,
            planId,
            userId: user?.id,
          }),
        }
      );

      if (response?.status === 429) {
        setError("Account balance too low to generate video");
        removeErrorToast();
        return;
      }

      console.log("video generation response status = ", response);
      const data = await response.json();

      console.log("video generation response = ", data);
      if (response?.status && response?.status >= 400) {
        setError("Something went wrong while generating video");
        removeErrorToast();
        return;
      }
      console.log("generated video url = ", data?.video_url);
      setGeneratedVideo(data?.video_url);
      setIsVideoGenerated(true);
    } catch (err: any) {
      console.log("Something went wrong while generating video ", err);
      setError("Something went wrong while generating video");
      removeErrorToast();
    }
  };

  async function handlePostTweet() {
    console.log("plan suggestion = ", plan?.suggestion);
    console.log("content  = ", content);

    setPosting(true);
    setSuccess({ state: false, message: "" });
    try {
      const accountInfo = await getSocialMediaAccountInfo("twitter");
      const { access_token, refresh_token } = accountInfo;
      const response = await fetch(
        `${BACKEND_APIPATH.BASEURL}/post/tweet/twitter`,
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({ access_token, refresh_token, data: content }),
        }
      );
      const data = await response.json();
      console.log("twitter api response = ", data);
      if (response?.status >= 400) {
        if (response?.status == 401) {
          // redirect to login
          initializeTwitterAuth();
          return;
        } else if (response?.status == 403) {
          setError("Your daily limit is exceeded please try again later !");
          setTimeout(() => {
            setError("");
          }, 1500);
          removeErrorToast();
          setPosting(false);
          return;
        }
        setError("Something went wrong while posting on twitter");
        setTimeout(() => {
          setError("");
        }, 1500);
        setPosting(false);
        removeErrorToast();
        return;
      }
      setSuccess({ state: true, message: "Content posted successfully !!" });
      removeToast();
    } catch (err: any) {
      setError(err.message);
      removeErrorToast();
    }

    setPosting(false);
  }
  const handlePostInstagram = async () => {
    console.log("plan suggestion = ", plan?.suggestion);
    console.log("content  = ", content);
    console.log("plan media = ", plan.media);
    if (plan?.format === "video") {
      setError("Video posting on instagram is currently not supported !");
      setTimeout(() => {
        setError("");
      }, 1500);
      removeErrorToast();
      return;
    }
    if (plan?.format == "image" && (!plan?.media || plan?.media == "NULL")) {
      setError("Please generate an image first !");
      removeErrorToast();
      return;
    }

    try {
      const accountInfo = await getSocialMediaAccountInfo("instagram");
      const { access_token, userId } = accountInfo;
      if (!userId || !access_token) {
        setError("Something went wrong while fetching user information");
        removeErrorToast();
        return;
      }

      setPosting(true);
      setSuccess({ state: false, message: "" });

      const response = await fetch(
        `${BACKEND_APIPATH.BASEURL}/upload/post/instagram`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            IG_USER_ID: userId,
            caption: content,
            imageUrl: plan?.media,
          }),
        }
      );
      const data = await response.json();
      console.log("post instagram api ", data);
      setSuccess({ state: true, message: "Content posted successfully !!" });
      removeToast();
    } catch (err: any) {
      setError(err?.message);
      removeErrorToast();
      console.log(err);
    } finally {
      setPosting(false);
    }
  };
  const handlePostLinkedin = async () => {
    console.log("plan suggestion = ", plan?.suggestion);
    console.log("content  = ", content);

    setPosting(true);
    setSuccess({ state: false, message: "" });

    try {
      const accountInfo = await getSocialMediaAccountInfo("linkedin");
      const { access_token, userId } = accountInfo;
      const response = await fetch(
        `${BACKEND_APIPATH.BASEURL}/upload/post/linkedin`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: userId, text: content }),
        }
      );
      const data = await response.json();
      console.log("post linkedin api ", data);
      setSuccess({ state: true, message: "Content posted successfully !!" });
      removeToast();
    } catch (err: any) {
      setError(err?.message);
      removeErrorToast();
      console.log(err);
    } finally {
      setPosting(false);
    }
  };

  const postContentHandler = (): any => {
    if (plan?.platform === "twitter") {
      handlePostTweet();
    } else if (plan?.platform === "instagram") {
      handlePostInstagram();
    } else {
      handlePostLinkedin();
    }
  };

  const handleGenerateTopics = async (topic: string, platform: string) => {
    
    if (!topic) {
      setError("Please enter a topic");
      removeErrorToast();
      return;
    }

    if (profile?.tokens - 10 < 0) {
      setError("You do not have enough tokens for post generation ..");
      navigateTo("/pricing");
      return;
    }

    setSuccess({ state: false, message: "" });
    
    setError(null);
    setLoadingTopics(true) ; 

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("No user found");

    let suggestion = "";
    try {
      if (selectedModel == "grok") {
        suggestion = await generateTopicsUsingGrok(topic, platform);

        const newPlan = {
          ...plan,
          suggestion,
        };
        const topics = JSON.parse(suggestion) || [];
        setGeneratedTopics(topics || []);
        await updatePlan(newPlan.id, {
          
          is_keyword: true,
          generatedTopics: topics,
        });
        setSelectedPlan((prev) => {
          return {
            ...prev,
            generatedTopics: topics,
          };
        });

        console.log("response from topic generation api = ", suggestion);
      } else if (selectedModel == "openai") {
        suggestion = await generateTopics(topic, platform);

        const newPlan = {
          ...plan,
          
        };

        const topics = JSON.parse(suggestion) || [];
        setGeneratedTopics(topics || []);
        await updatePlan(newPlan.id, {
          
          is_keyword: true,
          generatedTopics: topics,
        });
        setSelectedPlan((prev) => {
          return {
            ...prev,
            
            generatedTopics: topics,
          };
        });
        console.log("response from topic generation api = ", suggestion);
      }

     
      if (profile?.tokens - 10 >= 0) {
        await updateProfile({ tokens: profile?.tokens - 10 });
        setRefreshHeader((prev) => !prev);
      }
    } catch (err) {
      setError("Something went wrong !. Please try again");
      removeErrorToast();
    } finally {
      
      setSelectedTopic("");
      setLoadingTopics(false) ; 
      // setGeneratingSuggestion(false);
    }
  };

  const handleImageClick = () => {
    console.log("plan media  = ", plan?.media);
    console.log("generated image = ", generatedImage);
    setShowPopup(true);
  };
  const handleCancel = () => {
    setShowPopup(false);
  };

  const handleVideoPrevieClick = () => {
    console.log("plan media  = ", plan?.media);
    console.log("generated video = ", generatedVideo);
    setShowVideoPopup(true);
  };
  const handleCloseVideoPopUp = () => {
    setShowVideoPopup(false);
  };

  const handleImageGeneration = async (prompt: string) => {
    try {
      const imageURI = await generateImage(prompt);
      const response = await fetch(
        `${BACKEND_APIPATH.BASEURL}/fetch-image?url=${encodeURIComponent(
          imageURI
        )}`
      );
      const imageBlob = await response.blob();
      const fileName = `uploads/generations-${Date.now()}.jpeg`;
      const { data, error } = await supabase.storage
        .from("profile-images")
        .upload(fileName, imageBlob, { contentType: "image/jpeg" });
      if (error) throw error;
      // Get the public URL of the uploaded image
      const { data: urlData } = supabase.storage
        .from("profile-images")
        .getPublicUrl(fileName);
      setGeneratedImage(urlData?.publicUrl);
      return urlData?.publicUrl;
    } catch (error: any) {
      console.log("Something went wrong while handling the image ", error);
      setError(error?.message);
      removeErrorToast();
      return null;
    }
  };

  const handleDownload = async () => {
    try {
      // Fetch the image
      const response = await fetch(generatedImage);
      const blob = await response.blob();

      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);

      // Create a temporary anchor element and trigger download
      const link = document.createElement("a");
      link.href = url;
      link.download = `generated-image-${Date.now()}.jpg`; // You can customize the filename
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setShowPopup(false);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Download failed. Please try again.");
    }
  };

  const videoGenPipeline = async (currentPlanId: string, topic: string) => {
    // generate video generation prompt using model

    if (selectedModel == "grok") {
      const videoGenPrompt = await generateVideoPromptUsingGrok(topic);
      if (videoGenPrompt) {
        const content = await generateVideoDescriptionUsingGrok(topic);
        setContent(content);
        await updateContentPlan(currentPlanId, {
          suggestion: content,
          topic,
          is_keyword: false,
        });
        setSelectedPlan((prev: any) => {
          return {
            ...prev,
            suggestion: content,
            is_keyword: false,
          };
        });
        await generateVideoUsingKling(plan?.id, videoGenPrompt);
        // await handleVideoGeneration(userid, currentPlanId, videoGenPrompt);
        // if (profile?.tokens - 10 >= 0) {
        //   await updateProfile({ tokens: profile?.tokens - 10 });
        //   setRefreshHeader((prev) => !prev);
        // }
      }
    } else if (selectedModel == "openai") {
      const videoGenPrompt = await generateVideoPrompt(topic);
      if (videoGenPrompt) {
        const content = await generateVideoDescription(topic);
        setContent(content);
        await updateContentPlan(currentPlanId, {
          suggestion: content,
          topic,
          is_keyword: false,
        });
        setSelectedPlan((prev: any) => {
          return {
            ...prev,
            suggestion: content,
            is_keyword: false,
          };
        });
        await generateVideoUsingKling(plan?.id, videoGenPrompt);
        if (profile?.tokens - 10 >= 0) {
          await updateProfile({ tokens: profile?.tokens - 10 });
          setRefreshHeader((prev) => !prev);
        }
      }
    }
  };

  const handleGenerate = async () => {
    if (profile?.tokens - 10 < 0) {
      setError("You do not have enough tokens for post generation ..");
      navigateTo("/pricing");
      return;
    }

    if (!selectedTopic && generatedTopics?.length === 0 ) {
      setError("Please generate a topic !");
      removeErrorToast();
      return;
    }
    if (!selectedTopic && generatedTopics?.length >= 0 ) {
      setError("Please select a topic !");
      removeErrorToast();
      return;
    }
    setLoading(true);
    setError(null);
    let publicUrl: string = "";
    if (plan?.format === "video") {
      await videoGenPipeline(plan?.id, selectedTopic);
      setLoading(false);
      return;
    }
    if (plan?.format === "image") {
      console.log("image ..... ");
      const response = await handleImageGeneration(
        plan?.topic || selectedTopic
      );
      if (response) {
        publicUrl = response;
      }
    }

    try {
      const generated = await generatePostGeneric(
        selectedTopic,
        plan?.platform,
        selectedModel
      );
      const newPlan = {
        ...plan,
        suggestion: generated,
        topic : selectedTopic
      };
      console.log("generated content = ", generated);

      if (publicUrl) {
        await updatePlan(newPlan.id, {
          suggestion: generated,
          media: publicUrl,
          is_keyword: false,
          topic : selectedTopic
        });
        console.log("media = ", publicUrl);
        setSelectedPlan((prev: any) => {
          return {
            ...prev,
            suggestion: generated,
            media: publicUrl,
            topic : selectedTopic
          };
        });
      } else {
        await updatePlan(newPlan.id, {
          suggestion: generated,
          is_keyword: false,
          topic : selectedTopic
        });
        setSelectedPlan((prev: any) => {
          return {
            ...prev,
            suggestion: generated,
            topic : selectedTopic
          };
        });
      }
      setContent(generated);
      if (profile?.tokens - 10 >= 0) {
        await updateProfile({ tokens: profile?.tokens - 10 });
        setRefreshHeader((prev) => !prev);
      }
    } catch (err: any) {
      setError(err.message);
      removeErrorToast();
    } finally {
      setLoading(false);
    }
  };
  const handleSave = async () => {
    setSaving(true);
    setSuccess({ state: false, message: "" });

    try {
      await onSave({ suggestion: content });
      setSuccess({ state: true, message: "Content saved successfully !!" });
      removeToast();
    } catch (err: any) {
      setError(err.message);
      removeErrorToast();
    } finally {
      setSaving(false);
    }
  };
  const removeToast = () => {
    setTimeout(() => {
      setSuccess({ state: false, message: "" });
    }, 1500);
  };

  const removeErrorToast = () => {
    setTimeout(() => {
      setError(null);
    }, 1500);
  };

  return (
    <div className="bg-gray-800 shadhow-xl first-letter h-full rounded-lg px-3 py-4 sm:px-4 md:px-6 space-y-3 sm:space-y-4 flex flex-col justify-between ">
      {/* Header Section */}

      <div className="flex items-center justify-between gap-2">
        <span className="text-purple-400 text-xs sm:text-sm font-medium truncate">
          {plan.platform} • {plan.format}
        </span>

        <div className="flex items-center space-x-2 flex-shrink-0">
          <button
            onClick={onSchedule}
            className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1.5 sm:px-3 sm:py-2 rounded-md flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-sm font-medium transition-colors"
            title="Schedule post"
          >
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="hidden xs:inline">Schedule</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-950 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-white text-xs sm:text-sm">
          {error}
        </div>
      )}

      {/* Success Message */}
      {success.state && (
        <div className="bg-green-600 text-white px-2 py-1.5 sm:px-3 sm:py-2 rounded-md text-xs sm:text-sm">
          {success.message}
        </div>
      )}

      {/* Tone Selection */}
      <div className="space-y-1 sm:space-y-2">
        <label
          className={`block text-xs sm:text-sm font-medium text-gray-300 ${
            loading ? "cursor-not-allowed" : "cursor-pointer"
          }`}
        >
          Tone
        </label>
        <select
          disabled={loading}
          value={tone}
          onChange={(e) => setTone(e.target.value)}
          className="w-full bg-gray-600 border border-gray-500 rounded-md shadow-sm py-1.5 px-2 sm:py-2 sm:px-3 text-white text-xs sm:text-sm focus:ring-purple-500 focus:border-purple-500 focus:outline-none"
        >
          <option value="">Default</option>
          <option value="professional">Professional</option>
          <option value="casual">Casual</option>
          <option value="humorous">Humorous</option>
          <option value="educational">Educational</option>
        </select>
      </div>
      {Array.isArray(generatedTopics) && generatedTopics?.length > 0 && (
        <div className="flex flex-col gap-2  ">
          <h1 className="text-sm font-medium text-gray-300">
            Select a topic below based on your above niche
          </h1>
          <div className="flex gap-2 items-start flex-wrap">
            {generatedTopics.map((item: string, index: number) => {
              return (
                <button
                  title={item}
                  className={`${
                    selectedTopic === item
                      ? "bg-purple-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  } px-3 py-1 rounded-full text-xs sm:text-sm transition-colors`}
                  onClick={() => {
                    setSelectedTopic(item);
                  }}
                  key={index}
                >
                  {item?.length > 10 ? item.substring(0, 10) + "..." : item}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <button
        // onClick={handleGenerate}
        onClick={() => {
          handleGenerateTopics(plan?.suggestion, plan?.platform);
        }}
        disabled={loadingTopics}
        className=" w-full  px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:hover:bg-purple-600 text-white text-xs sm:text-sm font-medium rounded-lg flex items-center justify-center gap-1.5 sm:gap-2 transition-colors duration-200"
        title="Generate new content"
      >
        {loadingTopics ? (
          <>
            <Loader className="h-3 w-3 sm:h-4 sm:w-4 animate-spin flex-shrink-0" />
            <span className="hidden xs:inline">Generating...</span>
            <span className="xs:hidden">Gen...</span>
          </>
        ) : (
          <>
            <img
              className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0"
              src={aiMagic}
              alt=""
            />
            <span>Generate Topics</span>
          </>
        )}
      </button>

      {/* Generated Content Section */}
      <div className=" min-h-0">
        <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
          Generated Content
        </label>

        {/* Image Preview Button */}
        {plan?.format === "image" &&
          plan?.media !== "NULL" &&
          generatedImage && (
            <button
              onClick={handleImageClick}
              className="w-full sm:w-auto px-2 py-1.5 sm:px-3 sm:py-2 mb-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center sm:justify-start gap-1 sm:gap-2 text-xs sm:text-sm"
            >
              <Image size={16} className="sm:w-5 sm:h-5 flex-shrink-0" />
              <span>Preview Image</span>
            </button>
          )}

        {/* Video Preview Button */}
        {plan?.format === "video" &&
          (generatedVideo || plan?.media !== "NULL") && (
            <button
              onClick={handleVideoPrevieClick}
              className="w-full sm:w-auto px-2 py-1.5 sm:px-3 sm:py-2 mb-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center sm:justify-start gap-1 sm:gap-2 text-xs sm:text-sm"
            >
              <Image size={16} className="sm:w-5 sm:h-5 flex-shrink-0" />
              <span>Preview Video</span>
            </button>
          )}
        {/* Video Popup */}
        {showVideoPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-3 sm:p-4 border-b">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                  Video Preview
                </h2>
                <button
                  onClick={handleCloseVideoPopUp}
                  className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={18} className="sm:w-5 sm:h-5" />
                </button>
              </div>

              {/* Video Container */}
              <div className="p-3 sm:p-4">
                <video
                  controls
                  className="w-full h-auto rounded-lg shadow-md max-h-[60vh] sm:max-h-[70vh]"
                  preload="metadata"
                  autoPlay
                >
                  <source
                    src={plan?.media || generatedVideo}
                    type="video/mp4"
                  />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>
        )}

        {/* Image Popup */}
        {showPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="relative w-full max-w-lg mx-auto">
              {/* Image Display */}
              <div className="relative mb-4">
                <img
                  className="w-full h-auto max-h-[50vh] sm:max-h-[60vh] rounded-md object-contain mx-auto"
                  src={generatedImage}
                  alt="Generated content"
                />
              </div>

              {/* Download Dialog */}
              <div className="bg-white rounded-lg p-4 sm:p-6 shadow-xl">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                    Download Image
                  </h3>
                  <button
                    onClick={handleCancel}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                  >
                    <X size={18} className="sm:w-5 sm:h-5" />
                  </button>
                </div>

                <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
                  Would you like to download this image to your device?
                </p>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-end">
                  <button
                    onClick={handleCancel}
                    className="w-full sm:w-auto px-3 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm sm:text-base order-2 sm:order-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDownload}
                    className="w-full sm:w-auto px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base order-1 sm:order-2"
                  >
                    <Download size={16} />
                    Download
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Editor Component */}
        {
          <div className="self-end  ">
            <Editor
              initialContent={content}
              setGeneratedContent={setContent}
              keywordGenerated={plan?.is_keyword}
            />
          </div>
        }
      </div>

      {/* Action Buttons */}
      <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 pt-2 sm:pt-0">
        <button
          // onClick={handleGenerate}
          onClick={() => {
            // if (plan?.is_keyword) {
            //   handleGenerate();
            // } else {
            //   handleGenerateTopics(plan?.suggestion, plan?.platform);
            // }
            handleGenerate();
          }}
          disabled={loading}
          className="w-full sm:w-auto sm:flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:hover:bg-purple-600 text-white text-xs sm:text-sm font-medium rounded-lg flex items-center justify-center gap-1.5 sm:gap-2 transition-colors duration-200"
          title="Generate new content"
        >
          {loading ? (
            <>
              <Loader className="h-3 w-3 sm:h-4 sm:w-4 animate-spin flex-shrink-0" />
              <span className="hidden xs:inline">Generating...</span>
              <span className="xs:hidden">Gen...</span>
            </>
          ) : (
            <>
              <img
                className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0"
                src={aiMagic}
                alt=""
              />
              <span>Generate</span>
            </>
          )}
        </button>

        

        <button
          onClick={postContentHandler}
          className="w-full sm:w-auto sm:flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:hover:bg-purple-600 text-white text-xs sm:text-sm font-medium rounded-lg flex items-center justify-center gap-1.5 sm:gap-2 transition-colors duration-200"
          disabled={posting}
        >
          {posting ? (
            <>
              <Loader className="h-3 w-3 sm:h-4 sm:w-4 animate-spin flex-shrink-0" />
              <span className="hidden xs:inline">Posting...</span>
              <span className="xs:hidden">Post...</span>
            </>
          ) : (
            <>
              {plan.platform === "twitter" ? (
                <Twitter className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              ) : plan.platform === "instagram" ? (
                <Instagram className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              ) : (
                <Linkedin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              )}
              <span className="capitalize">Post</span>
            </>
          )}
        </button>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto sm:flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:hover:bg-purple-600 text-white text-xs sm:text-sm font-medium rounded-lg flex items-center justify-center gap-1.5 sm:gap-2 transition-colors duration-200"
        >
          {saving ? (
            <>
              <Loader className="h-3 w-3 sm:h-4 sm:w-4 animate-spin flex-shrink-0" />
              <span className="hidden xs:inline">Saving...</span>
              <span className="xs:hidden">Save...</span>
            </>
          ) : (
            <>
              <Save className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span>Save</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
