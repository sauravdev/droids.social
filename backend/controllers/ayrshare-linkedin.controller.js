// import {scheudleJobMap} from ''
import { scheduledJobsMap } from "../index.js";
import { loadScheduledJobs, updateScheduledPost } from "../test.js";
import schedule from "node-schedule";
import { DateTime } from "luxon";

const scheduleContent = async (api_key, text, postId = null, image = "") => {
  const bodyWithImage = {
    post: text || "Sample text",
    platforms: ["linkedin"],
    mediaUrls: [image],
  };
  const bodyWithoutImage = {
    post: text || "Sample text",
    platforms: ["linkedin"],
  };

  try {
    const response = await fetch("https://api.ayrshare.com/api/post", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${api_key}`,
      },
      body: JSON.stringify(image ? bodyWithImage : bodyWithoutImage),
    });
    const data = await response.json();

    console.log("response from (ayrshare) = ", data);
    if (data?.code == 106) {
      await updateScheduledPost(postId, {
        error: "You have exceeded your API quota for the month.",
      });
      return {
        status: 106,
        state: false,
        message: "You have exceeded your API quota for the month.",
      };
    }
    if (data?.code == 102) {
      await updateScheduledPost(postId, {
        error: "Invalid api key recieved",
      });
      return { status: 102, state: false, message: "" };
    }

    if (data?.code == 136) {
      await updateScheduledPost(postId, {
        error:
          "Something went wrong while posting image please generate again and then post",
      });
      return { status: 136, status: false, message: "" };
    }

    if (
      data?.errors &&
      Array.isArray(data?.errors) &&
      data?.errors?.length > 0
    ) {
      const errorInfo = data?.errors?.[0];
      if (errorInfo?.code == 156) {
        await updateScheduledPost(postId, { error: "Linkedin is not linked" });
        return { status: 156, state: false, message: "" };
      } else if (errorInfo?.code == 272) {
        await updateScheduledPost(postId, {
          error:
            "here is an issue authorizing your Linkedin account. Login to x.com to verify your account status and then try unlinking Linkedin and relinking on the social accounts page.",
        });
        return { status: 272, state: false, message: "" };
      } else if (errorInfo?.code == 132) {
        await updateScheduledPost(postId, {
          error:
            "Your post is too long for Linkedin. Please shorten to 280 characters. Overage: 506 characters.",
        });

        return { status: 132, state: false, message: "" };
      } else if (errorInfo?.code == 137) {
        await updateScheduledPost(postId, {
          error:
            "Duplicate or similar content posted within the same two day period. The social networks prohibit duplicate content and ban accounts that do not comply.",
        });

        return { status: 137, state: false, message: "" };
      } else if (errorInfo?.code == 169) {
        await updateScheduledPost(postId, {
          error:
            "A Premium or Business Plan is required to access this feature.",
        });
        return { status: 169, state: false, message: "" };
      }
    }
    let postUrl = "";
    if (
      data?.postIds &&
      Array.isArray(data?.postIds) &&
      data?.postIds?.length > 0
    ) {
      postUrl = data?.postIds?.[0]?.postUrl;
      if (postId) {
        console.log(
          `Updating post status to 'published' for postId: ${postId}`
        );
        await updateScheduledPost(postId, { status: "published", error: "" });
      }
    }
    return {
      status: 201,
      state: true,
      message: "linkedin post posted successfully. View it here: " + postUrl,
    };
  } catch (error) {
    console.error("Error occurred while posting linkedin post:", error);
    return {
      status: 500,
      state: false,
      message: "Internal Server Error - Could not post linkedin post.",
    };
  }
};

const uploadContent = async (api_key, text, postId = null, image = "") => {
  const bodyWithImage = {
    post: text || "Sample text",
    platforms: ["linkedin"],
    mediaUrls: [image],
  };
  const bodyWithoutImage = {
    post: text || "Sample text",
    platforms: ["linkedin"],
  };

  try {
    const response = await fetch("https://api.ayrshare.com/api/post", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${api_key}`,
      },
      body: JSON.stringify(image ? bodyWithImage : bodyWithoutImage),
    });
    const data = await response.json();

    console.log("response from (ayrshare) = ", data);
    if (data?.code == 106) {
      return { status: 106, state: false, message: "" };
    }
    if (data?.code == 102) {
      return { status: 102, state: false, message: "" };
    }
    if (data?.code == 136) {
      return { status: 136, status: false, message: "" };
    }
    if (
      data?.errors &&
      Array.isArray(data?.errors) &&
      data?.errors?.length > 0
    ) {
      const errorInfo = data?.errors?.[0];
      if (errorInfo?.code == 156) {
        return { status: 156, state: false, message: "" };
      } else if (errorInfo?.code == 272) {
        return { status: 272, state: false, message: "" };
      } else if (errorInfo?.code == 132) {
        return { status: 132, state: false, message: "" };
      } else if (errorInfo?.code == 137) {
        return { status: 137, state: false, message: "" };
      } else if (errorInfo?.code == 169) {
        return { status: 169, state: false, message: "" };
      }
    }
    if (postId) {
      console.log(`Updating post status to 'published' for postId: ${postId}`);
      await updateScheduledPost(postId, { status: "published" });
    }
    let postUrl = "";
    if (
      data?.postIds &&
      Array.isArray(data?.postIds) &&
      data?.postIds?.length > 0
    ) {
      postUrl = data?.postIds?.[0]?.postUrl;
    }
    return {
      status: 201,
      state: true,
      message: "linkedin post posted successfully. View it here: " + postUrl,
    };
  } catch (error) {
    console.error("Error occurred while posting linkedin post:", error);
    return {
      status: 500,
      state: false,
      message: "Internal Server Error - Could not post linkedin post.",
    };
  }
};

const uploadContentHandler = async (req, res) => {
  const { api_key, text, postId, image } = req.body;
  console.log(req.body);
  if (!api_key) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (!text) {
    return res.status(400).json({ message: "Invalid body " });
  }
  try {
    if (image) {
      const { status, state, message } = await uploadContent(
        api_key,
        text,
        postId,
        image
      );
      console.log("status = ", status, " state = ", state);
      if (state) {
        return res
          .status(201)
          .json({ message: message || "Linkedin  post posted  successfully!" });
      } else if (!state && status == 156) {
        return res.status(400).json({ message: "Linkedin is not linked" });
      } else if (!state && status == 106) {
        return res
          .status(429)
          .json({ message: "You have exceeded your API quota for the month." });
      } else if (!state && status == 272) {
        return res.status(400).json({
          message:
            "here is an issue authorizing your Linkedin account. Login to x.com to verify your account status and then try unlinking linkedin and relinking on the social accounts page.",
        });
      } else if (!state && status == 102) {
        return res.status(400).json({
          message: "Invalid api key",
        });
      } else if (!state && status == 136) {
        return res
          .status(429)
          .json({
            message:
              "Something went wrong while posting image please generate again and then post",
          });
      } else if (!state && status == 132) {
        return res.status(400).json({
          message:
            "Your post is too long for Linkedin. Please shorten to 280 characters. Overage: 506 characters.",
        });
      } else if (!state && status == 169) {
        return res.status(400).json({
          message:
            "A Premium or Business Plan is required to access this feature.",
        });
      } else if (!state && status == 137) {
        return res.status(400).json({
          message:
            "Duplicate or similar content posted within the same two day period. The social networks prohibit duplicate content and ban accounts that do not comply.",
        });
      } else if (!state && status == 401) {
        return res.status(401).json({ message: "Unauthorized" });
      } else if (!state && status == 403) {
        return res
          .status(403)
          .json({ message: "Content already posted on linkedin !!" });
      }
      return res.status(500).json({ message: "Something went wrong" });
    } else {
      const { status, state, message } = await uploadContent(
        api_key,
        text,
        postId
      );
      console.log("status = ", status, " state = ", state);
      if (state) {
        return res
          .status(201)
          .json({ message: message || "Linkedin post posted successfully!" });
      } else if (!state && status == 132) {
        return res.status(400).json({
          message:
            "Your post is too long for linkedin. Please shorten to 280 characters. Overage: 506 characters.",
        });
      } else if (!state && status == 102) {
        return res.status(400).json({
          message: "Invalid api key",
        });
      } else if (!state && status == 136) {
        return res
          .status(429)
          .json({
            message:
              "Something went wrong while posting image please generate again and then post",
          });
      } else if (!state && status == 106) {
        return res
          .status(429)
          .json({ message: "You have exceeded your API quota for the month." });
      } else if (!state && status == 272) {
        return res.status(400).json({
          message:
            "here is an issue authorizing your X/Linkedin account. Login to x.com to verify your account status and then try unlinking Linkedin and relinking on the social accounts page.",
        });
      } else if (!state && status == 169) {
        return res.status(400).json({
          message:
            "A Premium or Business Plan is required to access this feature.",
        });
      } else if (!state && status == 137) {
        return res.status(400).json({
          message:
            "Duplicate or similar content posted within the same two day period. The social networks prohibit duplicate content and ban accounts that do not comply.",
        });
      } else if (!state && status == 156) {
        return res.status(400).json({ message: "Linkedin is not linked" });
      } else if (!state && status == 401) {
        return res.status(401).json({ message: "Unauthorized" });
      } else if (!state && status == 403) {
        return res
          .status(403)
          .json({ message: "Content already posted on linkedin !!" });
      }
      return res.status(500).json({ message: "Something went wrong" });
    }
  } catch (err) {
    console.error("API ERROR:", err);
    return res
      .status(500)
      .json({ message: err.message || "Something went wrong" });
  }
};

const scheduleContentHandler = async (req, res) => {
  const { api_key, text, date, jobId, image } = req.body;
  console.log("schedule api body = ", req.body);
  if (!jobId) {
    return res.status(400).json({ error: "Invalid body : Missing jobId" });
  }

  if (!api_key) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (!date || !text) {
    return res
      .status(400)
      .json({ message: "Invalid body : Incomplete data recieved" });
  }
  try {
    const response = await loadScheduledJobs();
    const localTime = DateTime.fromISO(date, { zone: "Asia/Kolkata" });
    const utcTime = localTime.toUTC();
    console.log(
      "linkedin post scheduled successfully to be posted at " + utcTime.toISO()
    );
    if (response) {
      if (scheduledJobsMap.has(jobId) && scheduledJobsMap.get(jobId)?.cancel) {
        const job = scheduledJobsMap.get(jobId);
        job.cancel();
        console.log(
          "cancelling already scheduled job and scheduling a new one"
        );
        scheduledJobsMap.delete(jobId);
        const newJob = schedule.scheduleJob(utcTime.toISO(), () => {
          scheduleContent(api_key, text, jobId, image);
        });
        scheduledJobsMap.set(jobId, newJob);
      } else {
        console.log("scheduling new job");
        const job = schedule.scheduleJob(utcTime.toISO(), () => {
          scheduleContent(api_key, text, jobId, image);
        });
        console.log("job = ", job);
        scheduledJobsMap.set(jobId, job);
      }
      return res
        .status(201)
        .json({ message: "Scheduled linkedin post for ", date });
    }
  } catch (err) {
    console.log(err?.message || "Something went wrong");
    res.status(500).json({ message: err?.code || "Something went wrong" });
  }
};

export { uploadContentHandler, scheduleContentHandler };
