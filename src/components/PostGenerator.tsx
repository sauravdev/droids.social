import React, { useEffect, useState } from "react";
import {
  Loader,
  RefreshCw,
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
  generatePost,
  generatePostGeneric,
} from "../lib/openai";
import type { ContentPlan } from "../lib/types";
import Editor from "./Editor";
import { getSocialMediaAccountInfo } from "../lib/api";
import { BACKEND_APIPATH } from "../constants";
import { initializeTwitterAuth } from "../lib/twitter";
import aiMagic from "../assets/ai.png";
import { useContentPlan } from "../hooks/useContentPlan";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
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
  selectedPlan,
}: PostGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  // const [deleting , setDeleting] = useState(false) ;
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState(plan.suggestion || "");
  const [tone, setTone] = useState<string>("");
  const [posting, setPosting] = useState<boolean | null>(false);
  const [videoUrl , setVideoUrl] = useState(''); 
  const [success, setSuccess] = useState<Success>({
    state: false,
    message: "",
  });
  const [generatedImage, setGeneratedImage] = useState(plan?.media || "");
  const { updatePlan } = useContentPlan();
  const [showVideoPopup, setShowVideoPopup] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [isVideoGenerated , setIsVideoGenerated ] = useState(false) ;

  const { selectedModel } = useAuth();

  const videos = ['https://zkzdqldpzvjeftxbzgvh.supabase.co/storage/v1/object/public/generated-videos//2aeb4f6f-75fc-48a1-b4aa-9e21c75aa5b3_raw_video.mp4' , 
    'https://zkzdqldpzvjeftxbzgvh.supabase.co/storage/v1/object/public/generated-videos//8ac022e5-fcc8-4d5b-b3f3-61928f723fc0_raw_video.mp4',
    "https://zkzdqldpzvjeftxbzgvh.supabase.co/storage/v1/object/public/generated-videos//2568d3a0-6fbc-41f4-b007-0fdefca8c12b_raw_video.mp4",
    "https://zkzdqldpzvjeftxbzgvh.supabase.co/storage/v1/object/public/generated-videos//8ac022e5-fcc8-4d5b-b3f3-61928f723fc0_raw_video.mp4"
  ]

  useEffect(() => {
    console.log("current plan = ", plan);
    setGeneratedImage(plan?.media || "");
  }, []);

  useEffect(() => {
    console.log(
      "-----------------------change in plan detected ---------------------"
    );
  }, [plan]);

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
          setPosting(false);
          return;
        }
        setError("Something went wrong while posting on twitter");
        setTimeout(() => {
          setError("");
        }, 1500);
        setPosting(false);
        return;
      }
      setSuccess({ state: true, message: "Content posted successfully !!" });
      removeToast();
    } catch (err: any) {
      setError(err.message);
    }

    setPosting(false);
  }
  const handlePostInstagram = async () => {
    console.log("plan suggestion = ", plan?.suggestion);
    console.log("content  = ", content);
    console.log("plan media = " , plan.media) ;
    if(plan?.format === "video" ) 
    {
      setError("Video posting on instagram is currently not supported !");
        setTimeout(() => {
            setError("");
          }, 1500);
      return;
    }
    if ((plan?.format == "image") && (!plan?.media || plan?.media == 'NULL')) {
      setError("Please generate an image first !");
      return;
    }

    try {
      const accountInfo = await getSocialMediaAccountInfo("instagram");
      const { access_token, userId } = accountInfo;
      if (!userId || !access_token) {
        setError("Something went wrong while fetching user information");
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

  const handleImageClick = () => {
    console.log("plan media  = ", plan?.media);
    console.log("generated image = ", generatedImage);
    setShowPopup(true);
  };
  const handleCancel = () => {
    setShowPopup(false);
  };

  const handleVideoPrevieClick = () => {
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

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    let publicUrl = "";
    if(plan?.format === "video")
    {
      await new Promise((resolve , reject) => {
        setTimeout(() => {
        console.log("video generated !")
        setIsVideoGenerated(true) ;
        setLoading(false);
        const url = videos[Math.floor(Math.random() * videos.length)]
        setVideoUrl(url)
      } , 300000); // 300000
      })
    }
    if (plan?.format === "image") {
      console.log("image ..... ");
      publicUrl = await handleImageGeneration(plan?.topic);
    }
    // console.log("image ..... ");
    // await handleImageGeneration(plan?.topic);
    try {
      const generated = await generatePostGeneric(
        plan?.suggestion,
        plan?.platform,
        selectedModel
      );
      const newPlan = {
        ...plan,
        suggestion: generated,
      };
      console.log("generated content = ", generated);

      if (publicUrl) {
        await updatePlan(newPlan.id, {
          suggestion: generated,
          media: publicUrl,
        });
        console.log("media = ", publicUrl);
        setSelectedPlan((prev) => {
          return {
            ...prev,
            suggestion: generated,
            media: publicUrl,
          };
        });
      } else {
        await updatePlan(newPlan.id, { suggestion: generated });
        setSelectedPlan((prev) => {
          return {
            ...prev,
            suggestion: generated,
          };
        });
      }

      setContent(generated);
    } catch (err: any) {
      setError(err.message);
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
    } finally {
      setSaving(false);
    }
  };
  const removeToast = () => {
    setTimeout(() => {
      setSuccess({ state: false, message: "" });
    }, 1500);
  };
  

  return (
    <div className="bg-gray-700 h-full  rounded-lg px-2 py-4 space-y-4 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-purple-400 text-sm">
          {plan.platform} • {plan.format}
        </span>
        <div className="flex items-center space-x-2">
          {/* <button
            onClick={onSchedule}
            className="text-gray-400 hover:text-white"
            title="Schedule post"
          >
            <Calendar className="h-4 w-4" />
          </button> */}

          <button
            onClick={onSchedule}
            className="bg-blue-600 hover:bg-blue-700 text-white  px-2 py-2 rounded-md flex items-center justify-center space-x-2 text-sm sm:text-sm"
            title="Schedule post"
          >
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Schedule</span>
          </button>
        </div>
      </div>

      {error && <div className="bg-red-950 px-3 py-2 rounded-lg text-white text-sm">{error}</div>}
      {success.state && (
        <div className="bg-green-600 text-white px-3 py-2 sm:px-4 rounded-md text-sm">
          {success.message}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Tone
        </label>
        <select
          value={tone}
          onChange={(e) => setTone(e.target.value)}
          className="w-full bg-gray-600 border border-gray-500 rounded-md shadow-sm py-1 px-2 text-white text-sm focus:ring-purple-500 focus:border-purple-500"
        >
          <option value="">Default</option>
          <option value="professional">Professional</option>
          <option value="casual">Casual</option>
          <option value="humorous">Humorous</option>
          <option value="educational">Educational</option>
        </select>
      </div>

      <div className="relative">
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Generated Cotent
        </label>
        {plan?.format === "image" &&
          plan?.media !== "NULL" &&
          generatedImage && (
            <button
              onClick={handleImageClick}
              className="px-3 py-1 my-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2"
            >
              <Image size={20} /> Preview Image
            </button>
          )}

        {plan?.format === "video" && isVideoGenerated &&  (
          <button
            onClick={handleVideoPrevieClick}
            className="px-3 py-1 my-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2"
          >
            <Image size={20} /> Preview Video
          </button>
        )}

        {showVideoPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-xl font-bold">Video Preview</h2>
                <button
                  onClick={handleCloseVideoPopUp}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Video Container */}
              <div className="p-4">
                <video
                  controls
                  className="w-full h-auto rounded-lg shadow-md max-h-[70vh]"
                  preload="metadata"
                  autoPlay
                >
                  <source
                    src={videoUrl}
                    type="video/mp4"
                  />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>
        )}
        {showPopup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <img
              className="h-[400px] w-[400px] rounded-md object-center"
              src={generatedImage}
            />
            <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  Download Image
                </h3>
                <button
                  onClick={handleCancel}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <p className="text-gray-600 mb-6">
                Would you like to download this image to your device?
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2"
                >
                  <Download size={16} />
                  Download
                </button>
              </div>
            </div>
          </div>
        )}
        {/* <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full bg-gray-600 border border-gray-500 rounded-md shadow-sm py-2 px-3 text-white text-sm focus:ring-purple-500 focus:border-purple-500"
          rows={4}
        /> */}
        <Editor data={content} />
      </div>

      <div className="w-full  flex flex-col sm:flex-row items-stretch sm:items-center gap-1 sm:gap-4">
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full sm:w-auto px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:hover:bg-purple-600 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors duration-200"
          title="Generate new content"
        >
          {loading ? (
            <>
              <Loader className="h-4 w-4 animate-spin flex-shrink-0" />
              <span className="hidden xs:inline">Generating...</span>
              <span className="xs:hidden">Gen...</span>
            </>
          ) : (
            <>
              <img className="h-4 w-4 flex-shrink-0" src={aiMagic} alt="" />
              <span>Generate Post</span>
            </>
          )}
        </button>

        <button
          onClick={postContentHandler}
          className="w-full sm:w-auto px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:hover:bg-purple-600 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors duration-200"
          disabled={posting}
        >
          {posting ? (
            <>
              <Loader className="h-4 w-4 animate-spin flex-shrink-0" />
              <span className="hidden xs:inline">Posting...</span>
              <span className="xs:hidden">Post...</span>
            </>
          ) : (
            <>
              {plan.platform === "twitter" ? (
                <Twitter className="h-4 w-4 flex-shrink-0" />
              ) : plan.platform === "instagram" ? (
                <Instagram className="h-4 w-4 flex-shrink-0" />
              ) : (
                <Linkedin className="h-4 w-4 flex-shrink-0" />
              )}
              <span className="capitalize">Post</span>
            </>
          )}
        </button>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:hover:bg-purple-600 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors duration-200"
        >
          {saving ? (
            <>
              <Loader className="h-4 w-4 animate-spin flex-shrink-0" />
              <span className="hidden xs:inline">Saving...</span>
              <span className="xs:hidden">Save...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4 flex-shrink-0" />
              <span>Save</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
