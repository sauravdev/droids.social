import schedule from "node-schedule";
import fetch from "node-fetch";
import { scheduledJobsMap } from "../index.js";
import { loadScheduledJobs, updateScheduledPost } from "../test.js";
import { DateTime } from "luxon";

const postContent = async (api_key, data, image = "" , postId = "") => {
  const bodyWithImage = {
    post: data || "Sample text",
    platforms: ["twitter"],
    mediaUrls: [image],
  };
  const bodyWithoutImage = {
    post: data || "Sample text",
    platforms: ["twitter"],
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
    if (
      data?.errors &&
      Array.isArray(data?.errors) &&
      data?.errors?.length > 0
    ) {
      const errorInfo = data?.errors?.[0];
      if (errorInfo?.code == 156) {
        return { status: 156, state: false, message: "" };
      } else if (errorInfo?.code == 132) {
        return { status: 132, state: false, message: "" };
      } else if (errorInfo?.code == 272) {
        return { status: 272, state: false, message: "" };
      } else if (errorInfo?.code == 106) {
        return { status: 106, state: false, message: "" };
      } else if (errorInfo?.code == 137) {
        return { status: 137, state: false, message: "" };
      } else if (errorInfo?.code == 169) {
        return { status: 169, state: false, message: "" };
      }
    }
   
    let postUrl = "";
    if (
      data?.postIds &&
      Array.isArray(data?.postIds) &&
      data?.postIds?.length > 0
    ) {
      if (postId) {
        console.log(`Updating post status to 'published' for postId: ${postId}`);
        await updateScheduledPost(postId, { status: "published" });
      }
      postUrl = data?.postIds?.[0]?.postUrl;
    }
    return {
      status: 201,
      state: true,
      message: "Tweet posted successfully. View it here: " + postUrl,
    };
  } catch (error) {
    console.error("Error occurred while posting tweet:", error);
    return {
      status: 500,
      state: false,
      message: "Internal Server Error - Could not post tweet.",
    };
  }
};
const postContentHandler = async (req, res) => {
  console.log("twitter post content => ", req.body);
  const { api_key, data, image, postId  } = req.body;
  if (!api_key) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (!data)
    return res
      .status(400)
      .json({ message: "Bad request : Empty body received" });

  if (image) {
    const { status, state, message } = await postContent(api_key, data, image , postId);

    console.log("status = ", status, " state = ", state);

    if (state) {
      return res
        .status(201)
        .json({ message: message || "Tweet posted successfully!" });
    } else if (!state && status == 156) {
      return res.status(400).json({ message: "Twitter is not linked" });
    } else if (!state && status == 106) {
      return res
        .status(429)
        .json({ message: "You have exceeded your API quota for the month." });
    } else if (!state && status == 132) {
      return res.status(400).json({
        message:
          "Your post is too long for X/Twitter. Please shorten to 280 characters. Overage: 506 characters.",
      });
    } else if (!state && status == 272) {
      return res.status(400).json({
        message:
          "here is an issue authorizing your X/Twitter account. Login to x.com to verify your account status and then try unlinking Twitter and relinking on the social accounts page.",
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
        .json({ message: "Content already posted on twitter !!" });
    }
    return res.status(500).json({ message: "Something went wrong" });
  } else {
    const { status, state, message } = await postContent(api_key, data , image  , postId);
    console.log("status = ", status, " state = ", state);
    if (state) {
      return res
        .status(201)
        .json({ message: message || "Tweet posted successfully!" });
    } else if (!state && status == 132) {
      return res.status(400).json({
        message:
          "Your post is too long for X/Twitter. Please shorten to 280 characters. Overage: 506 characters.",
      });
    } else if (!state && status == 106) {
      return res
        .status(429)
        .json({ message: "You have exceeded your API quota for the month." });
    } else if (!state && status == 169) {
      return res.status(400).json({
        message:
          "A Premium or Business Plan is required to access this feature.",
      });
    } else if (!state && status == 272) {
      return res.status(400).json({
        message:
          "here is an issue authorizing your X/Twitter account. Login to x.com to verify your account status and then try unlinking Twitter and relinking on the social accounts page.",
      });
    } else if (!state && status == 137) {
      return res.status(400).json({
        message:
          "Duplicate or similar content posted within the same two day period. The social networks prohibit duplicate content and ban accounts that do not comply.",
      });
    } else if (!state && status == 156) {
      return res.status(400).json({ message: "Twitter is not linked" });
    } else if (!state && status == 401) {
      return res.status(401).json({ message: "Unauthorized" });
    } else if (!state && status == 403) {
      return res
        .status(403)
        .json({ message: "Content already posted on twitter !!" });
    }
    return res.status(500).json({ message: "Something went wrong" });
  }
};

const schedulePostContent = async (
  api_key,
  data = "sample text",
  image = "",
  postId
) => {
  const bodyWithImage = {
    post: data || "Sample text",
    platforms: ["twitter"],
    mediaUrls: [image],
  };
  const bodyWithoutImage = {
    post: data || "Sample text",
    platforms: ["twitter"],
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

    console.log("response = ", response);
    const data = await response.json();
    console.log("response from (ayrshare) = ", data);
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
    if (
      data?.errors &&
      Array.isArray(data?.errors) &&
      data?.errors?.length > 0
    ) {
      const errorInfo = data?.errors?.[0];
      if (errorInfo?.code == 156) {
        await updateScheduledPost(postId, { error: "twitter is not linked" });
        return { status: 156, state: false, message: "" };
      } else if (errorInfo?.code == 272) {
        await updateScheduledPost(postId, {
          error:
            "here is an issue authorizing your X/Twitter account. Login to x.com to verify your account status and then try unlinking Twitter and relinking on the social accounts page.",
        });
        return { status: 272, state: false, message: "" };
      } else if (errorInfo?.code == 132) {
        await updateScheduledPost(postId, {
          error:
            "Your post is too long for twitter. Please shorten to 280 characters. Overage: 506 characters.",
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
      message: "twitter post posted successfully. View it here: " + postUrl,
    };
  } catch (error) {
    return {
      status: 500,
      state: false,
      message: "Internal Server Error - Could not post twitter post.",
    };
  }
};

const schedulePostHandler = async (req, res) => {
  console.log("twitter schedule content => ", req.body);
  const { api_key ,  data, date, jobId, image } = req.body;
  if (!jobId) {
    return res.status(400).json({ error: "Invalid body : Missing jobId" });
  }
  if (!api_key) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (!date || !data)
    return res
      .status(400)
      .json({ message: "Bad request :Invalid date and data fields" });
  try {
    const resposne = await loadScheduledJobs();
    const localTime = DateTime.fromISO(date, { zone: "Asia/Kolkata" });
    const utcTime = localTime.toUTC();

    console.log("Job scheduled for UTC:", utcTime.toJSDate());

    if (resposne) {
      if (scheduledJobsMap.has(jobId) && scheduledJobsMap.get(jobId)?.cancel) {
        let job = scheduledJobsMap.get(jobId);
        job.cancel();
        console.log(
          "cancelling already scheduled job and scheduling a new one"
        );
        scheduledJobsMap.delete(jobId);
        const newJob = schedule.scheduleJob(utcTime.toJSDate(), async () => {
          try{
            schedulePostContent(api_key , data, image, jobId  )
          }
          catch(err) 
          {
            console.error("❌ Error executing scheduled tweet:", err);
          }
        });
        scheduledJobsMap.set(jobId, newJob);
      } else {
        console.log("scheduling new job");
        const job = schedule.scheduleJob(utcTime.toJSDate(), async () => {
          try{
            schedulePostContent(api_key , data, image, jobId  )
          }
          catch(err) 
          {
            console.error("❌ Error executing scheduled tweet:", err);
          }
        });
        console.log("job = ", job);
        scheduledJobsMap.set(jobId, job);
      }
      return res.status(201).json({ message: "Scheduled Tweet for ", date });
    }
  } catch (error) {
    console.error("Error scheduling tweet:", error);
    return res.status(500).json({ message: "Failed to schedule tweet" });
  }
};

export { postContentHandler, schedulePostHandler };
