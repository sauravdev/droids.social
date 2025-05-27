import React, { useEffect, useState } from "react";
import {
  Loader,
  RefreshCw,
  Calendar,
  Save,
  Twitter,
  Linkedin,
  Instagram,
} from "lucide-react";
import { generatePost, generatePostGeneric } from "../lib/openai";
import type { ContentPlan } from "../lib/types";
import Editor from "./Editor";
import { getSocialMediaAccountInfo } from "../lib/api";
import { BACKEND_APIPATH } from "../constants";
import { initializeTwitterAuth } from "../lib/twitter";
import aiMagic from "../assets/ai.png";
import { useContentPlan } from "../hooks/useContentPlan";
import { useAuth } from "../context/AuthContext";
interface PostGeneratorProps {
  plan: ContentPlan;
  onSave: (updates: Partial<ContentPlan>) => Promise<void>;
  onSchedule: () => void;
  setSelectedPlan: (action: any) => void;
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
  const [content, setContent] = useState(plan.suggestion);
  const [tone, setTone] = useState<string>("");
  const [posting, setPosting] = useState<boolean | null>(false);
  const [success, setSuccess] = useState<Success>({
    state: false,
    message: "",
  });
  const { updatePlan } = useContentPlan();

  const { selectedModel } = useAuth();

  // useEffect(() => {
  //   console.log("----------------------selected plan =--------------------------- " , plan) ;
  // } , [plan ] )

  async function handlePostTweet() {
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
          setError("Content already posted");
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
    setPosting(true);
    setSuccess({ state: false, message: "" });
    try {
      const accountInfo = await getSocialMediaAccountInfo("instagram");
      const { access_token, userId } = accountInfo;

      const response = await fetch(
        `${BACKEND_APIPATH.BASEURL}/upload/post/instagram`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ IG_USER_ID: userId, caption: content }),
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
  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const generated = await generatePostGeneric(
        plan?.suggestion,
        plan?.platform,
        selectedModel
      );
      console.log("generated content = ", generated);
      const newPlan = {
        ...plan,
        suggestion: generated,
      };
      await updatePlan(newPlan.id, { suggestion: generated });
      setSelectedPlan(newPlan);
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
    <div className="bg-gray-700  rounded-lg px-2 py-4 space-y-4 flex flex-col justify-between">
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

      {error && <div className="text-red-500 text-sm">{error}</div>}
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

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Generated Cotent
        </label>
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
              <span>Generate</span>
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
