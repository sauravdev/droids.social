import React, { useState, useEffect } from "react";
import {
  format,
  startOfWeek,
  addDays,
  parseISO,
  startOfMonth,
  addMonths,
  subMonths,
  eachDayOfInterval,
  endOfMonth,
  isSameMonth,
  getDay,
} from "date-fns";
import { useScheduledPosts } from "../hooks/useScheduledPosts";
import { useContentPlan } from "../hooks/useContentPlan";
import {
  Edit2,
  Clock,
  Send,
  MoreVertical,
  X,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Delete,
  RefreshCcw,
  Loader,
  Save,
} from "lucide-react";
import type { ScheduledPost } from "../lib/types";
import { getSocialMediaAccountInfo } from "../lib/api";
import { BACKEND_APIPATH } from "../constants";
import Editor from "../components/Editor";
import { initializeTwitterAuth } from "../lib/twitter";

interface Post {
  id: string;
  content: string;
  platform: string;
  scheduled_for: string;
  status?: string;
  type: "scheduled" | "planned";
  media_urls: any;
}

interface PostModalProps {
  refreshCalendar: boolean;
  setRefreshCalendar: (refreshCalendar: boolean) => void;
  post: Post;
  onClose: () => void;
  onSave?: (content: string) => Promise<void>;
  onReschedule?: (date: string) => Promise<void>;
  onPostNow?: () => Promise<void>;
}

function PostModal({
  refreshCalendar,
  setRefreshCalendar,
  post,
  onClose,
}: PostModalProps) {
  console.log("post modal posts = ", post);
  const [content, setContent] = useState(post.content);

  useEffect(() => {
    setContent(post?.content);
  }, []);

  const [scheduledFor, setScheduledFor] = useState(() => {
    const dateUTC = parseISO(post.scheduled_for);
    const dateLocal = new Date(
      dateUTC.getTime() + dateUTC.getTimezoneOffset() * 60000
    );
    return format(dateLocal, "yyyy-MM-dd'T'HH:mm");
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [posting, setPosting] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const { updatePost, deletePost } = useScheduledPosts();
  const removeToast = () => {
    setTimeout(() => {
      setError("");
    }, 3000);
  };

  const hasContentChanged = content !== post.content;
  const hasScheduleChanged =
    scheduledFor !==
    format(
      new Date(
        parseISO(post.scheduled_for).getTime() +
          parseISO(post.scheduled_for).getTimezoneOffset() * 60000
      ),
      "yyyy-MM-dd'T'HH:mm"
    );

  const validatekey = async (apiKey: string) => {
    console.log("api key = ", apiKey);
    if (!apiKey) {
      return false;
    }
    try {
      const response = await fetch(`${BACKEND_APIPATH.BASEURL}/user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          API_KEY: apiKey,
        }),
      });
      const data = await response.json();
      if (data.status == 401) {
        setError("Invalid api key!");
        return false;
      }
      return true;
    } catch (err) {
      console.log("err = ", err);
      return false;
    }
  };

  const handleReschedule = async () => {
    if (!hasScheduleChanged) return;
    setSaving(true);
    setError(null);
    try {
      console.log(scheduledFor);
      await updatePost(post?.id, { scheduled_for: scheduledFor });
      
      let generatedImage = "";
      if (
        post?.media_urls &&
        post?.media_urls?.[0] &&
        (post?.media_urls?.[0] != "NULL" || post?.media_urls?.[0] != "")
      ) {
        generatedImage = post?.media_urls?.[0];
      }
      if (post?.platform == "instagram") {
        if (!generatedImage) {
          setError("Please generate image first");
          return;
        }
        const accountInfo = await getSocialMediaAccountInfo("instagram");
        const { api_key } = accountInfo;
        const isApiKeyValid = await validatekey(api_key);
        if (!isApiKeyValid) {
          setError(
            "Invalid API key! If you haven't generated one yet, please follow the instructions on the dashboard after clicking 'Connect Social Accounts' to create your API key."
          );
          return;
        }
        if (generatedImage) {
          const response = await fetch(
            `${BACKEND_APIPATH.BASEURL}/schedule/post/instagram`,
            {
              method: "POST",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                api_key,
                date: scheduledFor,
                imageUrl: generatedImage,
                caption: content,
                jobId: post?.id,
              }),
            }
          );
          const data = await response.json();
          console.log("scheduled insta post api ", data);
        } else if (post?.media_urls?.length > 1) {
          const response = await fetch(
            `${BACKEND_APIPATH.BASEURL}/schedule/carousel/instagram`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${access_token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                userId: userId,
                date: scheduledFor,
                imageUrls: post?.media_urls,
                caption: content,
                jobId: post?.id,
              }),
            }
          );
          const data = await response.json();
          console.log("scheduled insta post api ", data);
        }
      } else if (post?.platform == "linkedin") {
        console.log("generated image = " , generatedImage) ; 
        const accountInfo = await getSocialMediaAccountInfo("linkedin");
      const { api_key } = accountInfo;
      const isApiKeyValid = await validatekey(api_key);
      if (!isApiKeyValid) {
        setError(
          "Invalid API key! If you haven't generated one yet, please follow the instructions on the dashboard after clicking 'Connect Social Accounts' to create your API key."
        );
        return;
      }
        const response = await fetch(
          `${BACKEND_APIPATH.BASEURL}/schedule/post/linkedin`,
          {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify(generatedImage ? 
              {
                api_key,
                text: content,
                date: scheduledFor,
                jobId: post?.id,
                image : generatedImage
              } : {
                api_key,
                text: content,
                date: scheduledFor,
                jobId: post?.id,
                
              }
            ),
          }
        );

        const data = await response.json();
        console.log(data);
      } else if (post?.platform == "twitter") {
        console.log("generated image = " , generatedImage) ; 
        const accountInfo = await getSocialMediaAccountInfo("twitter");
        const { api_key } = accountInfo;
        const isApiKeyValid = await validatekey(api_key);
        if (!isApiKeyValid) {
          setError(
            "Invalid API key! If you haven't generated one yet, please follow the instructions on the dashboard after clicking 'Connect Social Accounts' to create your API key."
          );
          return;
        }
        const scheduledResponse = await fetch(
          `${BACKEND_APIPATH.BASEURL}/schedule/post/api`,
          {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify(generatedImage ? {
              api_key,
              data: content,
              date: scheduledFor,
              jobId: post?.id,
              image : generatedImage
            } : {
              api_key,
              data: content,
              date: scheduledFor,
              jobId: post?.id,
            }),
          }
        );
        const data = await scheduledResponse.json();
        console.log("scheduled response from API  =  ", data);
      } else {
        console.warn("Invalid platform selected");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRefreshCalendar(!refreshCalendar);
      onClose();
      setSaving(false);
    }
  };
  const handleDeletePost = async (): Promise<void> => {
    setError(null);
    setDeleting(true);
    try {
      await deletePost(post?.id);
      setRefreshCalendar(!refreshCalendar);
      onClose();
    } catch (err: any) {
      setError(err?.message);
    } finally {
      setDeleting(false);
    }
  };

  const handlePostNow = async () => {
    setSaving(true);
    setError(null);

    try {
      if (post?.platform == "instagram") {
        let generatedImage = "";
        if (
          post?.media_urls &&
          post?.media_urls?.[0] &&
          (post?.media_urls?.[0] != "NULL" || post?.media_urls?.[0] != "")
        ) {
          generatedImage = post?.media_urls?.[0];
        }
        if (!generatedImage) {
          setError("Please generate image first");
          return;
        }
        try {
          const accountInfo = await getSocialMediaAccountInfo("instagram");
          const { api_key } = accountInfo;

          const isApiKeyValid = await validatekey(api_key);

          if (!isApiKeyValid) {
            setError(
              "Invalid API key! If you haven't generated one yet, please follow the instructions on the dashboard after clicking 'Connect Social Accounts' to create your API key."
            );
            return;
          }
          setPosting(true);
          const response = await fetch(
            `${BACKEND_APIPATH.BASEURL}/upload/post/instagram`,
            {
              method: "POST",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                api_key,
                caption: content,
                imageUrl: generatedImage,
                postId: post?.id,
              }),
            }
          );
          const data = await response.json();
          console.log("post instagram api ", data);
          if (response?.status >= 400) {
            if (response?.status == 400) {
              setError(data?.message || "Something went wrong");
              removeToast();
              return;
            }
            if (response?.status == 403) {
              setError("You dont have enough permissions.");
              removeToast();
              return;
            }
            if (response?.status == 429) {
              setError(
                "You have exceeded your API quota for the month. Please upgrade your plan."
              );
              removeToast();
              return;
            } else if (response?.status == 401) {
              setError("Invalid api key");
              removeToast();
              return;
            }
            setError("Something went wrong while posting on twitter");
            removeToast();
            return;
          }
          setRefreshCalendar(!refreshCalendar);
        } catch (err) {
          setError(err?.message || "Something went wrong");
          removeToast();
        } finally {
          setPosting(false);
        }
      } else if (post?.platform == "linkedin") {
        console.log("linked in post handler");

        try {
          const accountInfo = await getSocialMediaAccountInfo("linkedin");
          const { api_key } = accountInfo;
          const isApiKeyValid = await validatekey(api_key);
          if (!isApiKeyValid) {
            setError(
              "Invalid API key! If you haven't generated one yet, please follow the instructions on the dashboard after clicking 'Connect Social Accounts' to create your API key."
            );
            return;
          }

          let generatedImage = "";
          if (
            post?.media_urls &&
            post?.media_urls?.[0] &&
            (post?.media_urls?.[0] != "NULL" || post?.media_urls?.[0] != "")
          ) {
            generatedImage = post?.media_urls?.[0];
          }

          setPosting(true);
          const response = await fetch(
            `${BACKEND_APIPATH.BASEURL}/upload/post/linkedin`,
            {
              method: "POST",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
              },
              body: JSON.stringify(
                generatedImage
                  ? {
                      api_key,
                      text: content,
                      postId: post?.id,
                      image: generatedImage,
                    }
                  : {
                      api_key,
                      text: content,
                      postId: post?.id,
                    }
              ),
            }
          );
          const data = await response.json();
          console.log("post linkedin api ", data);
          if (response?.status >= 400) {
            if (response?.status == 400) {
              setError(data?.message || "Something went wrong");
              removeToast();
              return;
            }
            if (response?.status == 403) {
              setError("You dont have enough permissions");
              removeToast();
              return;
            }
            if (response?.status == 429) {
              setError(
                "You have exceeded your API quota for the month. Please upgrade your plan."
              );
              removeToast();
              return;
            } else if (response?.status == 401) {
              setError("Invalid api key");
              removeToast();
              return;
            }
            setError("Something went wrong while posting on linkedin");
            removeToast();
            return;
          }
          setRefreshCalendar(!refreshCalendar);
        } catch (err) {
          console.log(err);
        } finally {
          setPosting(false);
        }
      } else if (post?.platform == "twitter") {
        try {
          console.log("posting from twitter ... ");
          const accountInfo = await getSocialMediaAccountInfo("twitter");
          const { api_key } = accountInfo;
          const isApiKeyValid = await validatekey(api_key);
          if (!isApiKeyValid) {
            setError(
              "Invalid API key! If you haven't generated one yet, please follow the instructions on the dashboard after clicking 'Connect Social Accounts' to create your API key."
            );
            return;
          }

          setPosting(true);

          let generatedImage = "";
          if (
            post?.media_urls &&
            post?.media_urls?.[0] &&
            (post?.media_urls?.[0] != "NULL" || post?.media_urls?.[0] != "")
          ) {
            generatedImage = post?.media_urls?.[0];
          }

          const response = await fetch(
            `${BACKEND_APIPATH.BASEURL}/post/tweet/twitter`,
            {
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
              },
              method: "POST",
              body: JSON.stringify(
                generatedImage
                  ? {
                      api_key,
                      data: content,
                      image: generatedImage,
                      postId: post?.id,
                    }
                  : {
                      api_key,
                      data: content,

                      postId: post?.id,
                    }
              ),
            }
          );
          const data = await response.json();
          console.log(data);

          if (response?.status >= 400) {
            if (response?.status == 400) {
              setError(data?.message || "Something went wrong");
              removeToast();
              return;
            }
            if (response?.status == 403) {
              setError("You dont have enough permissions.");
              removeToast();
              return;
            }
            if (response?.status == 429) {
              setError(
                "You have exceeded your API quota for the month. Please upgrade your plan."
              );
              removeToast();
              return;
            } else if (response?.status == 401) {
              setError("Invalid api key");
              removeToast();
              return;
            }
            setError("Something went wrong while posting on twitter");
            removeToast();
            return;
          }

          setRefreshCalendar(!refreshCalendar);
        } catch (err) {
          console.log(err);
        } finally {
          setPosting(false);
        }
      } else {
        console.log("Invalid platform");
      }
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
      setPosting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl p-4 sm:p-6 w-full max-w-xs sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-white truncate pr-2">
            <span className="hidden xs:inline">
              Edit Post for {post?.platform}
            </span>
            <span className="xs:hidden">Edit {post?.platform}</span>
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white flex-shrink-0"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-900 text-white px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm mb-4 flex items-center space-x-2">
            <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="break-words">{error}</span>
          </div>
        )}

        {post?.error && (
          <div className="bg-red-900 text-white px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm mb-4 flex items-center space-x-2">
            <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="break-words">Unable to post : {post?.error}</span>
          </div>
        )}

        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
              Content
            </label>
            <div className="text-sm sm:text-base">
              <Editor
                initialContent={content}
                setGeneratedContent={setContent}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-2">
              Scheduled For
            </label>
            <input
              type="datetime-local"
              value={scheduledFor}
              onChange={(e) => {
                setScheduledFor(e.target.value);
              }}
              className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:ring-purple-500 focus:border-purple-500 text-sm sm:text-base"
            />
          </div>

          <div className="flex flex-col xs:flex-row gap-2 xs:gap-2 sm:gap-3 justify-start">
            <button
              onClick={handleDeletePost}
              disabled={deleting}
              className="flex-1 xs:flex-none px-3 sm:px-4 py-2 text-white rounded-md flex items-center justify-center space-x-1 sm:space-x-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-xs sm:text-sm transition-colors min-h-[40px]"
            >
              {deleting ? (
                <>
                  <Loader className="h-3 w-3 sm:h-4 sm:w-4 animate-spin flex-shrink-0" />
                  <span className="hidden xs:inline">Deleting...</span>
                  <span className="xs:hidden">Del...</span>
                </>
              ) : (
                <>
                  <Delete className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="hidden xs:inline">Delete Post</span>
                  <span className="xs:hidden">Delete</span>
                </>
              )}
            </button>

            <button
              onClick={handleReschedule}
              disabled={saving || !hasScheduleChanged}
              className={`flex-1 xs:flex-none px-3 sm:px-4 py-2 text-white rounded-md flex items-center justify-center space-x-1 sm:space-x-2 text-xs sm:text-sm transition-colors min-h-[40px] ${
                hasScheduleChanged
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-gray-600 cursor-not-allowed"
              } disabled:opacity-50`}
            >
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden xs:inline">Reschedule</span>
              <span className="xs:hidden">Reschedule</span>
            </button>

            <button
              onClick={handlePostNow}
              disabled={posting}
              className="flex-1 xs:flex-none px-3 sm:px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center justify-center space-x-1 sm:space-x-2 disabled:opacity-50 text-xs sm:text-sm transition-colors min-h-[40px]"
            >
              {posting ? (
                <>
                  <Loader className="h-3 w-3 sm:h-4 sm:w-4 animate-spin flex-shrink-0" />
                  <span className="hidden xs:inline">Posting...</span>
                  <span className="xs:hidden">Post...</span>
                </>
              ) : (
                <>
                  <Send className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="hidden xs:inline">Post Now</span>
                  <span className="xs:hidden">Post</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Calendar() {
  const {
    loading: scheduledLoading,
    error: scheduledError,
    updatePost,
    createPost,
    loadPosts,
  } = useScheduledPosts();
  const {
    plans: contentPlans,
    loading: plansLoading,
    updatePlan,
    refreshPlans,
  } = useContentPlan();
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [refreshCalendar, setRefreshCalender] = useState<boolean>(false);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [refreshingState, setRefreshingState] = useState<boolean>(false);

  const refresh = async (): any => {
    const data = await loadPosts();
    console.log("refresh posts = ", data);
    const newPosts = [...data];
    const newAllPosts = [
      ...newPosts.map((post) => ({
        ...post,
        content: post.content,
        type: "scheduled" as const,
      })),
    ];
    setAllPosts(newAllPosts);
  };

  useEffect(() => {
    setInterval(() => {
      setRefreshCalender((prev) => !prev);
    }, 5000);
  }, []);

  useEffect(() => {
    setRefreshingState(true);
    (async () => {
      await refresh();
    })();
    setRefreshingState(false);
  }, [refreshCalendar]);

  // Calculate date range for the visible calendar
  const startDate = startOfMonth(currentDate);
  const endDate = endOfMonth(currentDate);

  const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });

  const firstDayOfMonth = getDay(startDate);

  const generateCalendarGrid = () => {
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weekdaysShort = ["S", "M", "T", "W", "T", "F", "S"];
    const grid = [];

    weekdays.forEach((day, index) => {
      grid.push(
        <div
          key={`header-${day}`}
          className="text-center text-gray-400 text-xs sm:text-sm font-medium py-2"
        >
          <span className="hidden xs:inline">{day}</span>
          <span className="xs:hidden">{weekdaysShort[index]}</span>
        </div>
      );
    });

    for (let i = 0; i < firstDayOfMonth; i++) {
      grid.push(
        <div
          key={`empty-${i}`}
          className="min-h-[60px] xs:min-h-[80px] sm:min-h-[100px] p-1 sm:p-2 rounded-lg bg-gray-800 opacity-50"
        >
          <p className="text-gray-500 text-xs sm:text-sm mb-1 sm:mb-2"></p>
        </div>
      );
    }

    daysInMonth.forEach((date) => {
      const dayPosts = getPostsForDay(date);
      grid.push(
        <div
          key={`day-${format(date, "d")}`}
          className="min-h-[60px] xs:min-h-[80px] sm:min-h-[100px] p-1 sm:p-2 rounded-lg bg-gray-700"
        >
          <p className="text-white text-xs sm:text-sm mb-1 sm:mb-2 font-medium">
            {format(date, "d")}
          </p>
          <div className="space-y-1 sm:space-y-2">
            {dayPosts.slice(0, 100).map(
              (
                post: Post // Limit posts shown on mobile
              ) =>
                post?.status !== "published" && (
                  <div
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    className={`${
                      post.type === "planned"
                        ? "bg-blue-600 bg-opacity-20 border-blue-500"
                        : "bg-purple-600 bg-opacity-20 border-purple-500"
                    } border rounded-md p-1 sm:p-2 cursor-pointer hover:bg-opacity-30 transition`}
                  >
                    <p className="text-white text-xs line-clamp-2">
                      <span className="hidden xs:inline">
                        {post.content.slice(0, 30)}...
                      </span>
                      <span className="xs:hidden">
                        {post.content.slice(0, 15)}...
                      </span>
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      {`${parseISO(post?.scheduled_for)
                        .getUTCHours()
                        .toString()
                        .padStart(2, "0")}:${parseISO(post?.scheduled_for)
                        .getUTCMinutes()
                        .toString()
                        .padStart(2, "0")}`}
                    </p>
                  </div>
                )
            )}
            {dayPosts.length > 100 && (
              <div className="text-xs text-gray-400 text-center">
                +{dayPosts.length - 100} more
              </div>
            )}
          </div>
        </div>
      );
    });

    // Fill remaining cells to complete the grid (if needed)
    const totalCells =
      7 * Math.ceil((firstDayOfMonth + daysInMonth.length) / 7);
    const remainingCells = totalCells - (firstDayOfMonth + daysInMonth.length);

    for (let i = 0; i < remainingCells; i++) {
      grid.push(
        <div
          key={`remaining-${i}`}
          className="min-h-[60px] xs:min-h-[80px] sm:min-h-[100px] p-1 sm:p-2 rounded-lg bg-gray-800 opacity-50"
        >
          <p className="text-gray-500 text-xs sm:text-sm mb-1 sm:mb-2"></p>
        </div>
      );
    }

    return grid;
  };

  const getPostsForDay = (date: Date) => {
    return allPosts.filter((post: Post) => {
      const postDateUTC = parseISO(post.scheduled_for); // Parse stored UTC date
      const postDateLocal = new Date(
        postDateUTC.getTime() + postDateUTC.getTimezoneOffset() * 60000
      ); // Convert to local time

      return (
        postDateLocal.getFullYear() === date.getFullYear() &&
        postDateLocal.getMonth() === date.getMonth() &&
        postDateLocal.getDate() === date.getDate()
      );
    });
  };

  if (scheduledLoading || plansLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 ">
      <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-4 xs:gap-0">
        <div className="flex gap-2 sm:gap-4 items-center min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white truncate">
            <span className="hidden sm:inline">Content Calendar</span>
            <span className="sm:hidden">Calendar</span>
          </h1>
          <button
            className={`${refreshingState ? "animate-spin" : ""} flex-shrink-0`}
            onClick={() => {
              setRefreshingState(true);
              setRefreshCalender(!refreshCalendar);
            }}
          >
            <RefreshCcw
              className={`h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-gray-400 ${
                refreshingState ? "animate-spin" : ""
              }`}
            />
          </button>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
          <button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="text-white p-1 hover:bg-gray-700 rounded transition-colors"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
          </button>
          <span className="text-white font-medium text-sm sm:text-base lg:text-lg min-w-0">
            <span className="hidden sm:inline">
              {format(currentDate, "MMMM yyyy")}
            </span>
            <span className="sm:hidden">{format(currentDate, "MMM yyyy")}</span>
          </span>
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="text-white p-1 hover:bg-gray-700 rounded transition-colors"
          >
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
          </button>
        </div>
      </div>

      <div
        onClick={() => {
          setRefreshCalender(!refreshCalendar);
        }}
        className="space-y-4 sm:space-y-6 lg:space-y-8"
      >
        <div className="bg-gray-800 rounded-xl p-3 sm:p-4 lg:p-6">
          <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-white mb-3 sm:mb-4">
            <span className="hidden sm:inline">
              {format(currentDate, "MMMM yyyy")}
            </span>
            <span className="sm:hidden">{format(currentDate, "MMM yyyy")}</span>
          </h2>
          <div className="grid grid-cols-7 gap-1 xs:gap-2 sm:gap-3 lg:gap-4">
            {generateCalendarGrid()}
          </div>
        </div>
      </div>

      {selectedPost && (
        <PostModal
          refreshCalendar={refreshCalendar}
          setRefreshCalendar={setRefreshCalender}
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </div>
  );
}

export default Calendar;
