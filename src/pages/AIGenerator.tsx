import React, { useState, useEffect } from "react";
import {
  Twitter,
  Linkedin,
  Instagram,
  Sparkles,
  Loader,
  Save,
  Edit2,
  History,
  RefreshCw,
  X,
  Calendar,
  Download,
  Image,
  Plus,
} from "lucide-react";
import {
  generateImage,
  generatePost,
  generatePostFromCustomModel,
  generatePostUsingGrok,
  generateTopics,
  generateTopicsUsingGrok,
  generateVideoDescription,
  generateVideoDescriptionUsingGrok,
  generateVideoPrompt,
  generateVideoPromptUsingGrok,
} from "../lib/openai";
import { useContentPlan } from "../hooks/useContentPlan";
import { supabase } from "../lib/supabase";
import { ScheduleModal } from "../components/ScheduleModal";
import Editor from "../components/Editor.js";
import { useSocialAccounts } from "../hooks/useSocialAccounts.js";
import { useScheduledPosts } from "../hooks/useScheduledPosts.js";
import {
  deletePlan,
  getContentPlansHistory,
  getSocialMediaAccountInfo,
  updateContentPlan,
} from "../lib/api.js";
import { BACKEND_APIPATH } from "../constants/";
import { useAuth } from "../context/AuthContext";
import { useProfile } from "../hooks/useProfile.js";
import { useNavigate } from "react-router-dom";
import { initializeTwitterAuth } from "../lib/twitter.js";
import { useCustomModel } from "../hooks/useCustomModel.js";
interface HistoryItem {
  id: string;
  topic: string;
  content: string;
  createdAt: string;
  media: string | null;
  platform: string;
  is_keyword: boolean;
}

interface Success {
  state: boolean;
  message: string;
}

const formatOptions = ["text", "image", "video"];

export function AIGenerator() {
  const [topic, setTopic] = useState("");
  const [platforms, setPlatforms] = useState<any>([
    "twitter",
    "instagram",
    "linkedin",
  ]);
  const [formats, setFormats] = useState<string[]>(["text"]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<any>([]);
  const [storedTopic  , setStoredTopic] = useState("") ; 
  const [sources, setSources] = useState<string[]>([]);
  const [generatedContent, setGeneratedContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [posting, setPosting] = useState(false);
  const [generatedImage, setGeneratedImage] = useState("");
  const { updateProfile, profile } = useProfile();
  const [keywordGenerated, setKeywordGenerated] = useState<boolean>(false);
  const [success, setSuccess] = useState<Success>({
    state: false,
    message: "",
  });
  const [isGeneratingNewPlan,setIsGeneratingNewPlan] = useState<boolean>(false) ; 
  const [loadingTopics , setLoadingTopics] = useState<boolean>(false) ; 
  const [isLoading, setIsLoading] = useState(false);

  const [generatedMedia, setGeneratedMedia] = useState(null);

  const [showPopup, setShowPopup] = useState(false);
  const handleImageClick = () => {
    setShowPopup(true);
  };
  const [generatedTopics , setGeneratedTopics] = useState([]) ; 

  

  const [currentPlanId, setCurrentPlanId] = useState<string>("");

  const [generatedVideo, setGeneratedVideo] = useState(null);
  const [showVideoPopup, setShowVideoPopup] = useState(false);

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

  useEffect(() => {
    console.log("current plan id = ", currentPlanId);
  }, [currentPlanId]);

  const handleCancel = () => {
    setShowPopup(false);
  };

  const navigateTo = useNavigate();
  const removeToast = () => {
    setTimeout(() => {
      setSuccess({ state: false, message: "" });
      setError("");
    }, 1500);
  };

  const [model, setModel] = useState(["openai", "grok"]);
  const [selectedModel, setSelectedModel] = useState<string>("grok");
  const [customModels, setCustomModels] = useState<any>([]);
  const { loadCustomModels } = useCustomModel();



  const handleFileByExtension = (url: string) => {
    console.log("handle file by extension called ...");

    const cleanUrl = url.split("?")[0]; // Remove query string
    const extension = cleanUrl.split(".").pop()?.toLowerCase();

    if (!extension) return;

    if (extension === "mp4") {
      setGeneratedImage("");
      setGeneratedVideo(url);
      setGeneratedMedia(url);
      setFormats(() => ["text", "video"]);
    } else if (["jpeg", "jpg", "png", "webp"].includes(extension)) {
      console.log("setting image url =", url);
      setGeneratedVideo(null);
      setGeneratedImage(url);
      setGeneratedMedia(url);
      setFormats(() => ["text", "image"]);
    } else {
      setGeneratedMedia(null);
      setGeneratedImage("");
      setGeneratedVideo("");
      setFormats(() => ["text"]);
    }
  };

  const [refreshPage, setRefreshPage] = useState(false);

  const handleCustomModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const modelId = e.target.value;
    const selectedModel = customModels.find((cm: any) => cm?.id == modelId);
    console.log("selected model =", selectedModel);
    setSelectedModel(selectedModel);
  };

  const { setRefreshHeader } = useAuth();

  const { createPlan } = useContentPlan();
  const { accounts } = useSocialAccounts();

  const { createPost } = useScheduledPosts();
  const [generatingSuggestion, setGeneratingSuggestion] =
    useState<boolean>(false);

  const getHistory = async () => {
    try {
      const response = await getContentPlansHistory();
      console.log("history = ", response);

      if (Array.isArray(response) && response?.length > 0) {
        console.log("response = ", response);
        setGeneratingSuggestion((prev) => {
          if (response?.[0]?.suggestion === "") return true;
          return false;
        });

        loadHistoryItem({
          id: response?.[0]?.id || "",
          topic: response?.[0]?.topic || "",
          content: response?.[0]?.suggestion || "",
          media: response?.[0]?.media,
          platform: response?.[0]?.platform,
          is_keyword: response?.[0]?.is_keyword,
          generatedTopics : response?.[0]?.generatedTopics 
        });
        setHistory((prev) => {
          return response.map((item) => {
            return {
              id: item?.id,
              content: item?.suggestion,
              topic: item?.topic,
              createdAt: item?.created_at,
              media: item?.media,
              platform: item?.platform,
              is_keyword: item?.is_keyword,
              generatedTopics : item?.generatedTopics 
            };
          });
        });
      }
    } catch (err: any) {
      setError("Error loading history");
    }
  };

  useEffect(() => {
    (async () => {
      const models = await loadCustomModels();
      console.log("models = ", models);
      setCustomModels(models);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const response = await getContentPlansHistory();
        console.log("history = ", response);

        if (Array.isArray(response) && response?.length > 0) {
          console.log("response = ", response);
          setGeneratingSuggestion((prev) => {
            if (response?.[0]?.suggestion === "") return true;
            return false;
          });

          loadHistoryItem({
            id: response?.[0]?.id || "",
            topic: response?.[0]?.topic || "",
            content: response?.[0]?.suggestion || "",
            media: response?.[0]?.media,
            platform: response?.[0]?.platform,
            is_keyword: response?.[0]?.is_keyword,
            generatedTopics : response?.[0]?.generatedTopics
          });
          setHistory((prev) => {
            return response.map((item) => {
              return {
                id: item?.id,
                content: item?.suggestion,
                topic: item?.topic,
                createdAt: item?.created_at,
                media: item?.media,
                platform: item?.platform,
                is_keyword: item?.is_keyword,
                generatedTopics : item?.generatedTopics
              };
            });
          });
        }
      } catch (err: any) {
        setError("Error loading history");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    getHistory();
  }, [refreshPage]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshPage((prev) => !prev);
    }, 120000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const handleVideoGeneration = async (
    userId = "",
    planId = "",
    prompt: string
  ) => {
    setGeneratedVideo(null);
    try {
      const response = await fetch(
        `${BACKEND_APIPATH.BASEURL}/generate-video`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            planId,
            prompt,
          }),
        }
      );
      console.log("response = ", response);
      if (response?.status === 429) {
        setError("Account balance too low to generate video");
        return;
      }
      console.log("video generation response status = ", response);
      const data = await response.json();

      console.log("video generation response = ", data);
      if (response?.status && response?.status >= 400) {
        setError("Something went wrong while generating video");
        return;
      }
      console.log("generated video url = ", data?.video_url);
      setGeneratedVideo(data?.video_url);
    } catch (err: any) {
      console.log("Something went wrong while generating video ", err);
      setError("Something went wrong while generating video");
      removeToast();
    }
  };

  async function handlePostTweet() {
    setSuccess({ state: false, message: "" });
    const accountInfo = await getSocialMediaAccountInfo("twitter");
    const { access_token, refresh_token } = accountInfo;
    setPosting(true);
    try {
      const response = await fetch(
        `${BACKEND_APIPATH.BASEURL}/post/tweet/twitter`,
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({
            access_token,
            refresh_token,
            data: generatedContent,
          }),
        }
      );
      const data = await response.json();
      console.log(data);
      if (response?.status >= 400) {
        if (response?.status == 403) {
          setError("Your daily limit is exceeded please try again later !");
          setTopic("");
          setGeneratedContent("");
          setGeneratedImage("");
          return;
        } else if (response?.status == 401) {
          // redirect to login
          initializeTwitterAuth();
          return;
        }
        setError("Something went wrong while posting on twitter");
        setTopic("");
        setGeneratedContent("");
        setGeneratedImage("");
        return;
      }
      setSuccess({ state: true, message: "Content posted !!" });
      removeToast();
    } catch (err: any) {
      setError(err?.message);
    } finally {
      setTopic("");
      setGeneratedContent("");
      setGeneratedImage("");
      setPosting(false);
    }
  }
  const handlePostInstagram = async () => {
    setSuccess({ state: false, message: "" });
    setPosting(true);
    if (!generatedImage) {
      setError("Please Provide Image For Uploading On Instagram");
      return;
    }
    if (!generatedContent) {
      setError("Please Provide Caption For Uploading On Instagram ");
    }

    try {
      const accountInfo = await getSocialMediaAccountInfo("instagram");
      const { access_token, userId } = accountInfo;

      if (!userId || !access_token) {
        setError("Something went wrong while fetching user information");
        return;
      }

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
            caption: generatedContent,
            imageUrl: generatedImage,
          }),
        }
      );
      const data = await response.json();
      console.log("post instagram api ", data);
      setSuccess({ state: true, message: "Content posted !!" });
      removeToast();
    } catch (err: any) {
      console.log(err);
      setError(err.message);
    } finally {
      setPosting(false);
      setTopic("");
      setGeneratedContent("");
      setGeneratedImage("");
    }
  };

  const handlePostLinkedin = async () => {
    setPosting(true);
    setSuccess({ state: false, message: "" });
    if (!generatedContent) {
      setError("Please Provide Caption For Uploading On Linkedin ");
    }
    try {
      const accountInfo = await getSocialMediaAccountInfo("linkedin");
      const { access_token, userId } = accountInfo;
      if (!userId || !access_token) {
        setError("Something went wrong while fetching user information");
        return;
      }
      const response = await fetch(
        `${BACKEND_APIPATH.BASEURL}/upload/post/linkedin`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: userId, text: generatedContent }),
        }
      );
      const data = await response.json();
      console.log("post linkedin api ", data);
      setSuccess({ state: true, message: "Content posted !!" });
      removeToast();
    } catch (err: any) {
      console.log(err);
      setError(err?.message);
    } finally {
      setPosting(false);
      setGeneratedContent("");
      setTopic("");
      setGeneratedImage("");
    }
  };

  const postButtons = [
    { value: "twitter", method: handlePostTweet, icon: <Twitter /> },
    { value: "instagram", method: handlePostInstagram, icon: <Instagram /> },
    { value: "linkedin", method: handlePostLinkedin, icon: <Linkedin /> },
  ];

  const handleFormatToggle = (format: string) => {
    setFormats((prev) =>
      prev.includes(format) && format !== "text"
        ? prev.filter((f) => f !== format)
        : [...prev, format]
    );
  };

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
          contentType: imageData.type || "image/jpeg",
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

  const videoGenPipeline = async (topic: string, userid: string) => {
    // generate video generation prompt using model
    if (selectedModel == "grok") {
      const videoGenPrompt = await generateVideoPromptUsingGrok(topic);
      if (videoGenPrompt) {
        const content = await generateVideoDescriptionUsingGrok(topic);
        setGeneratedContent(content);
        await updateContentPlan(currentPlanId, {
          suggestion: content,
          topic,
          is_keyword: false,
        });

        await handleVideoGeneration(userid, currentPlanId, videoGenPrompt);
        if (profile?.tokens - 10 >= 0) {
          await updateProfile({ tokens: profile?.tokens - 10 });
          setRefreshHeader((prev) => !prev);
        }
        setRefreshPage((prev) => !prev);
      }
    } else if (selectedModel == "openai") {
      const videoGenPrompt = await generateVideoPrompt(topic);
      if (videoGenPrompt) {
        const content = await generateVideoDescription(topic);
        setGeneratedContent(content);
        await updateContentPlan(currentPlanId, {
          suggestion: content,
          topic,
          is_keyword: false,
        });

        await handleVideoGeneration(userid, currentPlanId, videoGenPrompt);
        if (profile?.tokens - 10 >= 0) {
          await updateProfile({ tokens: profile?.tokens - 10 });
          setRefreshHeader((prev) => !prev);
        }
        setRefreshPage((prev) => !prev);
      }
    }
  };

  const handleImageGeneration = async () => {
    try {
      const imageURI = await generateImage(topic);
      const response = await fetch(
        `${BACKEND_APIPATH.BASEURL}/fetch-image?url=${encodeURIComponent(
          imageURI
        )}`
      );
      const imageBlob = await response.blob();
      const fileName = `uploads/generations-${Date.now()}.jpeg`;
      const { data, error } = await supabase.storage
        .from("profile-images")
        .upload(fileName, imageBlob, { contentType: "image/jepg" });
      if (error) throw error;
      // Get the public URL of the uploaded image
      const { data: urlData } = supabase.storage
        .from("profile-images")
        .getPublicUrl(fileName);
      setGeneratedImage(urlData?.publicUrl);
      await updateContentPlan(currentPlanId, { media: urlData?.publicUrl });
    } catch (error: any) {
      console.log("Something went wrong while handling the image ", error);
      setError(error?.message);
    }
  };

  const handleSourceToggle = (source: string) => {
    setSources((prev) =>
      prev.includes(source)
        ? prev.filter((s) => s !== source)
        : [...prev, source]
    );
  };

  const handleGenerateTopics = async (topic: string, platform: string) => {
    console.log("topic generation called ... ")  ; 
    console.log("current plan id = " , currentPlanId) ; 
    setSuccess({ state: false, message: "" });
    if (profile?.tokens - 10 < 0) {
      setError("You do not have enough tokens for post generation ..");
      navigateTo("/pricing");
      return;
    }

    if (selectedPlatforms.length == 0) {
      setError("please select platform");
      return;
    }

    if (!topic) {
      setError("Please enter a topic");
      return;
    }

    setLoadingTopics(true);
    setError(null);
    setGeneratedContent("");

    if(currentPlanId) 
    {
      let suggestion = "";
      try {
        if (selectedModel == "grok") {
          suggestion = await generateTopicsUsingGrok(topic, platform);
          // setGeneratedContent(suggestion);
        } else if (selectedModel == "openai") {
          suggestion = await generateTopics(topic, platform);
          // setGeneratedContent(suggestion);
        }
        const topics = JSON.parse(suggestion) || [] ; 
        setGeneratedTopics(topics || [] )
        if (currentPlanId) {
          await updateContentPlan(currentPlanId, {
            is_keyword: true,
            suggestion,
            generatedTopics : topics
          });
        }
        if (profile?.tokens - 10 >= 0) {
          await updateProfile({ tokens: profile?.tokens - 10 });
          setRefreshHeader((prev) => !prev);
        }
        setRefreshPage((prev) => !prev);
      } catch (err: any) {
        setError("Something went wrong !. Please try again");
      } finally {
        setLoadingTopics(false);
        setGeneratingSuggestion(false);
      }

    }
    else {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");
      const createdPlan = await createPlan({
        profile_id: user.id,
        strategy_id: null,
        platform: selectedPlatforms[0],
        format: formats[0],
        topic,
        suggestion: "",
        status: "pending",
        scheduled_for: null,
        is_keyword: false,
        generatedTopics : [] 
      });
      setRefreshPage((prev) => !prev);
  
      let suggestion = "";
      try {
        if (selectedModel == "grok") {
          suggestion = await generateTopicsUsingGrok(topic, platform);
          // setGeneratedContent(suggestion);
        } else if (selectedModel == "openai") {
          suggestion = await generateTopics(topic, platform);
          // setGeneratedContent(suggestion);
        }
        const topics = JSON.parse(suggestion) || [] ; 
        setGeneratedTopics(topics || [] )
        if (createdPlan?.id) {
          await updateContentPlan(createdPlan?.id, {
            is_keyword: true,
            suggestion,
            generatedTopics : topics
          });
        }
        if (profile?.tokens - 10 >= 0) {
          await updateProfile({ tokens: profile?.tokens - 10 });
          setRefreshHeader((prev) => !prev);
        }
        setRefreshPage((prev) => !prev);
      } catch (err: any) {
        setError("Something went wrong !. Please try again");
      } finally {
        setLoadingTopics(false);
        setGeneratingSuggestion(false);
      }
    }
  };

  const handleGenerate = async () => {
    console.log("selected model = ", selectedModel);

    setSuccess({ state: false, message: "" });
    if (profile?.tokens - 10 < 0) {
      setError("You do not have enough tokens for post generation ..");
      navigateTo("/pricing");
      return;
    }

    if (selectedPlatforms.length == 0) {
      setError("please select platform");
      return;
    }

    if (!topic) {
      setError("Please enter a topic");
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedImage("");
    setGeneratedContent("");
    setKeywordGenerated(false);
    setGeneratingSuggestion(true);

    console.log("current plan id =  --> ", currentPlanId);

    if (currentPlanId) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("No user found");

        console.log("created plan in ai = ", currentPlanId);
        console.log("format = ", formats);

        if (formats.find((format) => format === "image")) {
          await handleImageGeneration();
        }

        if (formats.find((format) => format === "video")) {
          setLoading(true);
          await videoGenPipeline(topic, user?.id);
          setLoading(false);
          return;
        }
        let content = "";
        if (selectedModel == "grok") {
          const response = await generatePostUsingGrok(
            topic,
            selectedPlatforms[0],
            user?.id,
            currentPlanId
          );

          console.log("content = ", response);
          content = response;
        } else if (selectedModel == "openai") {
          content = await generatePost(topic, selectedPlatforms[0]);
        } else {
          content = await generatePostFromCustomModel(
            topic,
            selectedPlatforms[0],
            selectedModel
          );
        }
        await updateContentPlan(currentPlanId, {
          suggestion: content,
          topic,
          is_keyword: false,
        });
        // content = await generatePostUsingGrok(topic, selectedPlatforms[0]);
        setGeneratedContent(content);
        if (profile?.tokens - 10 >= 0) {
          await updateProfile({ tokens: profile?.tokens - 10 });
          setRefreshHeader((prev) => !prev);
        }
        setRefreshPage((prev) => !prev);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
        setGeneratingSuggestion(false);
      }
    }
    else {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");
      const createdPlan = await createPlan({
        profile_id: user.id,
        strategy_id: null,
        platform: selectedPlatforms[0],
        format: formats[0],
        topic,
        suggestion: "",
        status: "pending",
        scheduled_for: null,
        is_keyword: false,
        generatedTopics : [] 
      });
      setRefreshPage((prev) => !prev);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("No user found");

        console.log("created plan in ai = ", currentPlanId);
        console.log("format = ", formats);

        if (formats.find((format) => format === "image")) {
          await handleImageGeneration();
        }

        if (formats.find((format) => format === "video")) {
          setLoading(true);
          await videoGenPipeline(topic, user?.id);
          setLoading(false);
          return;
        }
        let content = "";
        if (selectedModel == "grok") {
          const response = await generatePostUsingGrok(
            topic,
            selectedPlatforms[0],
            user?.id,
            createdPlan?.id
          );

          console.log("content = ", response);
          content = response;
        } else if (selectedModel == "openai") {
          content = await generatePost(topic, selectedPlatforms[0]);
        } else {
          content = await generatePostFromCustomModel(
            topic,
            selectedPlatforms[0],
            selectedModel
          );
        }
        await updateContentPlan(createdPlan?.id, {
          suggestion: content,
          topic,
          is_keyword: false,
        });
        setGeneratedContent(content);
        if (profile?.tokens - 10 >= 0) {
          await updateProfile({ tokens: profile?.tokens - 10 });
          setRefreshHeader((prev) => !prev);
        }
        setRefreshPage((prev) => !prev);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
        setGeneratingSuggestion(false);
      }
      

    }
  
  };

  const handleSave = async (platform: string) => {
    setSuccess({ state: false, message: "" });
    if (!generatedContent) {
      setError("Please generate content first");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user found");
      console.log(user);
      const createdPlan = await createPlan({
        profile_id: user.id,
        strategy_id: null,
        platform,
        format: formats[0],
        topic,
        suggestion: generatedContent,
        status: "pending",
        scheduled_for: null,
      });
      console.log("created plan = ", createdPlan);
      setSuccess({ state: true, message: "Content Saved !" });
      removeToast();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };
  const handleScheduleTweet = async (
    date: string,
    postId: null | string = null
  ) => {
    if (!generatedContent) {
      setError("Please generate content first");
      return;
    }
    setSuccess({ state: false, message: "" });
    try {
      // protected route
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user found");

      console.log(date.toString());
      const post = {
        platform: "twitter",
        content: generatedContent,
        media_urls: [],
        scheduled_for: date,
        status: "pending",
      };
      const accountInfo = await getSocialMediaAccountInfo("twitter");
      const { access_token, refresh_token } = accountInfo;
      if (!postId) {
        const createdPost = await createPost(post);
        console.log("createdPost (in tweet) = ", createdPost);
        const scheduledResponse = await fetch(
          `${BACKEND_APIPATH.BASEURL}/schedule/post/api`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              access_token,
              refresh_token,
              data: generatedContent,
              date: date.toString(),
              jobId: createdPost?.id,
            }),
          }
        );
        console.log(
          "scheduled response from API  =  ",
          await scheduledResponse.json()
        );
      } else {
        const scheduledResponse = await fetch(
          `${BACKEND_APIPATH.BASEURL}/schedule/post/api`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              access_token,
              refresh_token,
              data: generatedContent,
              date: date.toString(),
              jobId: postId,
            }),
          }
        );
        console.log(
          "scheduled response from API  =  ",
          await scheduledResponse.json()
        );
      }
      setSuccess({ state: true, message: "Content Scheduled Successfully !!" });
      removeToast();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setShowScheduleModal(false);
      setTopic("");
      setGeneratedContent("");
    }
  };
  const handleScheduleInstaPost = async (
    date: string,
    postId: null | string = null
  ) => {
    setSuccess({ state: false, message: "" });
    if (!generatedImage) {
      setError("Please Provide Image For Uploading On Instagram");
      return;
    }
    if (!generatedContent) {
      setError("Please generate content first");
      return;
    }
    try {
      const accountInfo = await getSocialMediaAccountInfo("instagram");
      const { access_token, userId } = accountInfo;
      if (!access_token || !userId) {
        setError("Something went wrong while fetching user information");
        return;
      }
      if (!postId) {
        const post = {
          platform: "instagram",
          content: generatedContent,
          media_urls: [generatedImage],
          scheduled_for: date,
          status: "pending",
        };
        const createdPost = await createPost(post);
        console.log("createdPost (in instagram) = ", createdPost);
        const response = await fetch(
          `${BACKEND_APIPATH.BASEURL}/schedule/post/instagram`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              IG_USER_ID: userId,
              date: date,
              caption: generatedContent,
              imageUrl: generatedImage,
              jobId: createdPost?.id,
            }),
          }
        );
        const data = await response.json();
        console.log("scheduled insta post api ", data);
        setSuccess({
          state: true,
          message: "Content Scheduled Successfully !!",
        });
        removeToast();
      } else {
        const response = await fetch(
          `${BACKEND_APIPATH.BASEURL}/schedule/post/instagram`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              IG_USER_ID: userId,
              date: date,
              caption: generatedContent,
              jobId: postId,
            }),
          }
        );
        const data = await response.json();
        console.log("scheduled insta post api ", data);
      }
      setShowScheduleModal(false);
      // create scheduled post
    } catch (err) {
      console.log(err);
    }
  };
  const handleScheduleLinkedinPost = async (
    date: string,
    postId: null | string = null
  ) => {
    setSuccess({ state: false, message: "" });
    try {
      const accountInfo = await getSocialMediaAccountInfo("linkedin");
      const { access_token, userId } = accountInfo;
      if (!postId) {
        const post = {
          platform: "linkedin",
          content: generatedContent,
          media_urls: [],
          scheduled_for: date,
          status: "pending",
        };
        const createdPost = await createPost(post);
        const response = await fetch(
          `${BACKEND_APIPATH.BASEURL}/schedule/post/linkedin`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: userId,
              text: generatedContent,
              date,
              jobId: createdPost?.id,
            }),
          }
        );
        const data = await response.json();
        console.log("data = ", data);
      } else {
        const response = await fetch(
          `${BACKEND_APIPATH.BASEURL}/schedule/post/linkedin`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: userId,
              text: generatedContent,
              date,
              jobId: postId,
            }),
          }
        );
        const data = await response.json();
        console.log("data = ", data);
      }

      setSuccess({ state: true, message: "Content Scheduled Successfully" });
      removeToast();
    } catch (err) {
      console.log(err);
    } finally {
      setShowScheduleModal(false);
    }
  };
  const loadHistoryItem = (item: any) => {
    console.log("loaded history item = " , item ) ; 
    console.log("current plan id = ", item?.id);
    setCurrentPlanId(item?.id);
    setTopic(item?.topic || "");
    setGeneratedContent(item?.content || "");
    setSelectedPlatforms([item?.platform]);
    setGeneratedTopics(item?.generatedTopics || [] ) ; 
    setStoredTopic(item?.topic) ;
    console.log("media inside history =- ", typeof item?.media);
    console.log("item media = ", item?.media);
    

    if (item?.media) {
      handleFileByExtension(item?.media);
    }

    console.log("boolean flag keyword generated = ", keywordGenerated);
    setKeywordGenerated(item?.is_keyword);
  };

  const deleteHistoryItem = async (id: string) => {
    await deletePlan(id);
    setHistory((prev) => prev.filter((item) => item.id !== id));
    setRefreshPage((prev) => !prev);
  };

  const handleVideoPrevieClick = () => {
    setShowVideoPopup(true);
  };
  const handleCloseVideoPopUp = () => {
    setShowVideoPopup(false);
  };

  const handleMultiPlatformPost = async () => {
    setSuccess({ state: false, message: "" });
    setPosting(true);
    console.log("selected platforms  = ", selectedPlatforms);
    const apiCalls = selectedPlatforms.map((selectedPlatform: string) =>
      selectedPlatform == "twitter"
        ? handlePostTweet
        : selectedPlatform == "instagram"
        ? handlePostInstagram
        : handlePostLinkedin
    );
    console.log("api calls = ", apiCalls);
    try {
      if (
        selectedPlatforms?.find(
          (selectedPlatform: string) => selectedPlatform == "instagram"
        )
      ) {
        await handlePostInstagram();
      }
      if (
        selectedPlatforms?.find(
          (selectedPlatform: string) => selectedPlatform == "linkedin"
        )
      ) {
        await handlePostLinkedin();
      }
      if (
        selectedPlatforms?.find(
          (selectedPlatform: string) => selectedPlatform == "twitter"
        )
      ) {
        await handlePostTweet();
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Something went wrong");
    } finally {
      setPosting(false);
      setTopic("");
      setGeneratedContent("");
      setGeneratedImage("");
    }
  };

  const handleNewPlanCreation = async () => {
    setIsGeneratingNewPlan(true) ;
    try{
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("No user found");
    const createdPlan = await createPlan({
      profile_id: user.id,
      strategy_id: null,
      platform: selectedPlatforms[0],
      format: formats[0],
      topic : "",
      suggestion: "New Plan",
      status: "pending",
      scheduled_for: null,
      is_keyword: false,
      generatedTopics : [] 
    });
    setCurrentPlanId(createdPlan?.id) ; 
    setRefreshPage(prev=>!prev) ; 
    }
    catch(err) 
    {
      console.log(err) ;
      setError('Something went wrong') ;
    }
    finally{
      setIsGeneratingNewPlan(false) ;
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }
  return (
    <div className="max-w-4xl mx-auto ">
      <h1 className="text-xl flex items-center gap-4  sm:text-2xl md:text-3xl font-bold text-white mb-6 sm:mb-8">
        Custom Post generator <button disabled={isGeneratingNewPlan} onClick={handleNewPlanCreation} title="Create new empty plan" className={`${isGeneratingNewPlan ? 'cursor-not-allowed' : "cursor-pointer"}`}><Plus className="h-6 w-6 font-bold" /></button> 
      </h1>

      {showVideoPopup && generatedVideo && generatedMedia && (
        <div className="fixed inset-0 bg-gray-700 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            {
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-xl font-bold">Video Preview</h2>
                <button
                  onClick={handleCloseVideoPopUp}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            }

            {/* Video Container */}
            <div className="p-4">
              <video
                controls
                className="w-full h-auto rounded-lg shadow-md max-h-[70vh]"
                preload="metadata"
                autoPlay
              >
                <source src={generatedVideo} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Form Section */}
        <div className="lg:col-span-2">
          <div className="bg-gray-800 rounded-xl p-4 sm:p-6 space-y-4 sm:space-y-6">
            {error && (
              <div className="bg-red-900 text-white p-3 sm:p-4 rounded-md text-sm">
                {error}
              </div>
            )}
            {success.state && (
              <div className="bg-green-600 text-white p-3 sm:p-4 rounded-md text-sm">
                {success.message}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="topic"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Enter Your niche topic
                </label>
                <input
                  
                  type="text"
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:ring-purple-500 focus:border-purple-500 text-sm sm:text-base"
                  placeholder="Niches like statistics, motivational quotes, and educational,etc content remain popular"
                />
              </div>
              {Array.isArray(generatedTopics) && 
                  generatedTopics?.length > 0  && <div className="flex gap-2 items-start flex-wrap ">
                    <h1 className="text-sm font-medium text-gray-300">Select a topic below based on your above niche</h1>
                    <div className="flex gap-2 items-start flex-wrap">{
                  generatedTopics.map(
                    (item: string, index: number) => {
                      return (
                        <button
                          title={item}
                          className={`${
                            topic === item
                              ? "bg-purple-600 text-white"
                              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          } px-3 py-1 rounded-full text-xs sm:text-sm transition-colors`}
                          onClick={() => {
                            setTopic(item);
                          }}
                          key={index}
                        >
                          {item?.length > 10
                            ? item.substring(0, 20) + "..."
                            : item}
                        </button>
                      );
                    }
                  )}</div>
              </div>}

              <div className="grid grid-cols-1 gap-4 w-full">
                {accounts.length > 0 && (
                  <div>
                    <label
                      htmlFor="platform"
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      Platform
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {platforms.map((platform: string, index: number) => {
                        return (
                          accounts.find(
                            (account) => account?.platform == platform
                          ) && (
                            <button
                              className={`${
                                selectedPlatforms.some(
                                  (selectedPlatform: string) =>
                                    selectedPlatform === platform
                                )
                                  ? "bg-purple-600 text-white"
                                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                              } px-3 py-1 rounded-full text-xs sm:text-sm transition-colors`}
                              onClick={() => {
                                setSelectedPlatforms((prev: any) => {
                                  return [platform];
                                });
                              }}
                              key={index}
                            >
                              {platform}
                            </button>
                          )
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Format
                </label>
                <div className="flex flex-wrap gap-2">
                  {formatOptions.map((format) => (
                    <button
                      disabled={
                        (formats.includes("video") && format === "image") ||
                        (formats.includes("image") && format === "video")
                      }
                      key={format}
                      onClick={() => {
                        handleFormatToggle(format);
                      }}
                      className={`${
                        (formats.includes("video") && format === "image") ||
                        (formats.includes("image") && format === "video")
                          ? "cursor-not-allowed"
                          : "cursor-pointer"
                      } px-3 py-1 rounded-full text-xs sm:text-sm transition-colors ${
                        formats.includes(format)
                          ? "bg-purple-600 text-white"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      {format}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Model
                </label>
                <div className="flex flex-wrap gap-2 items-center">
                  {model.map((mod, index) => (
                    <button
                      key={index}
                      disabled={generatingSuggestion}
                      onClick={() => {
                        setSelectedModel(mod);
                      }}
                      className={`${
                        generatingSuggestion
                          ? "cursor-not-allowed"
                          : "cursor-pointer"
                      } px-3 py-1 rounded-full text-xs sm:text-sm transition-colors ${
                        selectedModel === mod
                          ? "bg-purple-600 text-white"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      {mod}
                    </button>
                  ))}

                  {formats.includes("video") && (
                    <button className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs sm:text-sm transition-colors">
                      Kling AI
                    </button>
                  )}

                  {customModels?.length > 0 && (
                    <select
                      value="custom-models"
                      onChange={(e) => {
                        handleCustomModelChange(e);
                      }}
                      className="bg-gray-700 text-gray-300 border border-gray-600 rounded-md shadow-sm py-1 px-2 w-full sm:w-auto sm:max-w-44 text-sm"
                    >
                      <option value="custom-models" disabled>
                        Custom Models
                      </option>
                      {customModels.map((cm: any, index: number) => {
                        return (
                          <option key={index} value={cm?.id}>
                            {cm?.model_name}
                          </option>
                        );
                      })}
                    </select>
                  )}
                </div>
              </div>

              <div className="flex flex-col md:flex md:flex-row gap-2 ">
              <div className="flex-1 mt-4">
                <button
                  onClick={() => {
                    handleGenerateTopics(topic, selectedPlatforms[0]);
                  }}
                  disabled={loading || generatingSuggestion}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md flex items-center justify-center space-x-2 disabled:opacity-50 text-sm sm:text-base transition-colors"
                >
                  {loadingTopics ? (
                    <>
                      <Loader className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span>{"Generate Topics"}</span>
                    </>
                  )}
                </button>
              </div>
              <div className="flex-1 mt-4">
                <button
                  onClick={() => {
                    handleGenerate();
                  }}
                  disabled={loadingTopics }
                  className={`w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md flex items-center justify-center space-x-2 disabled:opacity-50 text-sm sm:text-base transition-colors `}
                >
                  {loading ? (
                    <>
                      <Loader className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span>{"Generate Content"}</span>
                    </>
                  )}
                </button>
              </div>
              </div>
              {
                <div className="relative space-y-4">
                  {generatedMedia && generatedImage && (
                    <div
                      className="w-full cursor-pointer"
                      onClick={handleImageClick}
                    >
                      <img
                        className="w-full max-h-64 sm:max-h-96 object-cover rounded-xl hover:opacity-90 transition-opacity"
                        src={generatedImage}
                        alt="Generated content"
                      />
                    </div>
                  )}

                  {showPopup && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                      <div className="bg-white rounded-lg p-4 sm:p-6 max-w-sm w-full mx-4 shadow-xl">
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

                        <p className="text-gray-600 mb-6 text-sm sm:text-base">
                          Would you like to download this image to your device?
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 justify-end">
                          <button
                            onClick={handleCancel}
                            className="w-full sm:w-auto px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm sm:text-base"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleDownload}
                            className="w-full sm:w-auto px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                          >
                            <Download size={16} />
                            Download
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  {storedTopic && !keywordGenerated && generatedContent && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Generated Content
                      </label>
                      <Editor initialContent={generatedContent} setGeneratedContent = {setGeneratedContent }  keywordGenerated={keywordGenerated} />
                    </div>
                  )}

                  {storedTopic && !keywordGenerated && generatedContent && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                      <button
                        onClick={() => {
                          handleGenerate()
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md flex items-center justify-center space-x-2 text-sm sm:text-base transition-colors"
                      >
                        <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span>Regenerate</span>
                      </button>

                      {generatedContent && generatedVideo && generatedMedia && (
                        <button
                          onClick={handleVideoPrevieClick}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2  rounded-md flex items-center justify-center space-x-2  text-sm sm:text-base transition-colors"
                        >
                          <Image className="" size={20} /> Preview Video
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (selectedPlatforms?.length > 0) {
                            selectedPlatforms.map(
                              (selectedPlatform: string) => {
                                handleSave(selectedPlatform);
                              }
                            );
                          } else {
                            handleSave("");
                          }
                          setTopic("");
                          setGeneratedContent("");
                          setGeneratedImage("");
                        }}
                        disabled={saving}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center justify-center space-x-2 disabled:opacity-50 text-sm sm:text-base transition-colors"
                      >
                        {saving ? (
                          <>
                            <Loader className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 sm:h-5 sm:w-5" />
                            <span>Save</span>
                          </>
                        )}
                      </button>

                      {generatedContent &&
                        selectedPlatforms?.length == 1 &&
                        postButtons.map((postButton) => {
                          return (
                            selectedPlatforms.find(
                              (selectedPlatform: string) =>
                                selectedPlatform === postButton?.value
                            ) && (
                              <button
                                key={postButton.value}
                                onClick={postButton?.method}
                                disabled={posting}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center justify-center space-x-2 disabled:opacity-50 text-sm sm:text-base transition-colors"
                              >
                                {posting ? (
                                  <>
                                    <Loader className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                                    <span>Posting...</span>
                                  </>
                                ) : (
                                  <>
                                    {postButton?.icon}
                                    <span>Post</span>
                                  </>
                                )}
                              </button>
                            )
                          );
                        })}

                      {generatedContent && selectedPlatforms?.length > 1 && (
                        <button
                          disabled={posting}
                          onClick={handleMultiPlatformPost}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center justify-center space-x-2 disabled:opacity-50 text-sm sm:text-base transition-colors"
                        >
                          {posting ? (
                            <>
                              <Loader className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                              <span>Posting...</span>
                            </>
                          ) : (
                            <>
                              <span>Post All</span>
                            </>
                          )}
                        </button>
                      )}

                      {selectedPlatforms?.length == 1 && (
                        <button
                          onClick={() => setShowScheduleModal(true)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center justify-center space-x-2 text-sm sm:text-base transition-colors"
                        >
                          <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                          <span>Schedule</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              }
            </div>
          </div>
        </div>

        {/* History Section */}
        <div className="bg-gray-800 rounded-xl p-4 sm:p-6  max-h-96 overflow-y-auto scrollbar-hide">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4 flex items-center">
            <History className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            History
          </h2>
          <div className="space-y-4">
            {history.map((item) => (
              <div key={item.id} className="bg-gray-700 p-3 sm:p-4 rounded-lg">
                <h3 className="text-white font-medium mb-2 text-sm sm:text-base truncate">
                  {item.topic}
                </h3>
                <p className="text-gray-400 text-xs sm:text-sm mb-3 line-clamp-3">
                  {item?.content === ""
                    ? "processing ..."
                    : item.content.substring(0, 100)}
                  ...
                </p>
                <div className="flex flex-col gap-2">
                  <div className="flex space-x-2">
                    {item?.content !== "" && (
                      <button
                        onClick={() => loadHistoryItem(item)}
                        className="text-purple-400 hover:text-purple-300 text-xs sm:text-sm flex items-center transition-colors"
                      >
                        <Edit2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span>Edit</span>
                      </button>
                    )}
                    {
                      <button
                        onClick={() => deleteHistoryItem(item.id)}
                        className="text-red-400 hover:text-red-300 text-xs sm:text-sm flex items-center transition-colors"
                      >
                        <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        <span>Delete</span>
                      </button>
                    }
                  </div>
                  <span className="text-gray-500 text-xs">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
            {history.length === 0 && (
              <p className="text-gray-400 text-xs sm:text-sm text-center">
                No generated content yet
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <ScheduleModal
          plan={{
            id: "",
            profile_id: "",
            platform: selectedPlatforms[0],
            format: formats[0],
            topic,
            suggestion: generatedContent,
            status: "pending",
            scheduled_for: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }}
          onSchedule={
            selectedPlatforms[0] == "twitter"
              ? handleScheduleTweet
              : selectedPlatforms[0] == "instagram"
              ? handleScheduleInstaPost
              : handleScheduleLinkedinPost
          }
          onClose={() => setShowScheduleModal(false)}
        />
      )}
    </div>
  );
}

export default AIGenerator;
