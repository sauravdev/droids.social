import React, { useEffect, useState } from "react";
import {
  TrendingUp,
  Users,
  MessageSquare,
  BarChart3,
  Calendar,
  ArrowUp,
  ArrowDown,
  Twitter,
  Linkedin,
  Instagram,
} from "lucide-react";
import { useSocialAccounts } from "../hooks/useSocialAccounts";
import { InstagramServices } from "../services/instagram";
import { getSocialAccounts, getSocialMediaAccountInfo } from "../lib/api";
import { BACKEND_APIPATH } from "../constants";
import { supabase } from "../lib/supabase";
interface IMetricData {
  totalFollowers: string;
  engagementRate: string;
  reach: number;
  totalPosts: number;
}

export function Analytics() {
  const [selectedTimeRange, setSelectedTimeRange] = useState("1week");
  const { accounts, loading: accountsLoading } = useSocialAccounts();
  const [idConnectedWithInsta, setIdConnectedWithInsta] = useState<number>();
  const [instaAccountId, setInstaAccountId] = useState<number>();
  const [instaUserName, setInstaUserName] = useState<any>();
  const [period, setPeriod] = useState<string>("days_28");
  const [cardToggle, setCardToggle] = useState<boolean>(false);
  const [cardType, setCardType] = useState<string>("Instagram");
  const [twitterinsights, setTwitterinsights] = useState<any>({});
  const [twitterInsights, setTwitterInsights] = useState({});
  const [timeRanges, setTimeRanges] = useState<any>([]);
  const [loader, setLoader] = useState(false);
  const [platforms, setPlatforms] = useState([
    {
      name: "Instagram",
      icon: <Instagram className="h-6 w-6 text-white" />,
      color: "bg-pink-600",
      followers: "0",
      engagement: "0.0",
      growth: 0,
      posts: 0,
      reach: "0.0%",
      engagementChange: "0.0",
    },

    {
      name: "LinkedIn",
      icon: <Linkedin className="h-6 w-6 text-white" />,
      color: "bg-blue-700",
      followers: "0",
      engagement: "0.0",
      growth: 0,
      posts: 0,
      reach: "0.0%",
      engagementChange: "0.0",
    },
    {
      name: "Twitter",
      icon: <Twitter className="h-6 w-6 text-white" />,
      color: "bg-blue-600",
      followers: `${twitterinsights?.followers || 0} `,
      engagement: `${twitterinsights?.engagement || 0}`,
      growth: 0,
      posts: `${twitterinsights?.post || 0}`,
      reach: `${twitterInsights?.reach || 0}%`,
      engagementChange: "0.00",
    },
  ]);
  const [metricCardData, setMetricCardData] = useState<IMetricData>({
    totalFollowers: "0",
    engagementRate: "0.00",
    reach: 0,
    totalPosts: 0,
  });
  const [instaFollowers, setInstaFollowers] = useState<string>();
  const [instaPost, setInstaPost] = useState<number>();
  const [instaEngagement, setInstaEngagement] = useState<string>();
  const [instaReach, setInstaReach] = useState<number>();
  const [pastAnalytics, setPastAnalytics] = useState<any>(null);

  const getTwitterInsights = async () => {
    const { access_token, refresh_token } = await getSocialMediaAccountInfo(
      "twitter"
    );
    try {
      const response = await fetch(
        `${BACKEND_APIPATH.BASEURL}/twitter/insights`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            accessToken: access_token,
            refreshToken: refresh_token,
          }),
        }
      );
      const data = await response.json();
      console.log("data === ", data);
      return data;
    } catch (err) {
      console.log("error = ", err);
    }
  };

  const checkIfAccountIsPresent = async (name: string) => {
    try {
      const data = await getSocialAccounts();
      console.log("social media accounts = ", data);

      const isPresent = data.some((account) => account?.platform == name);
      if (isPresent) return true;
    } catch (err: any) {
      console.error("Error loading social accounts:", err);
    }
    return false;
  };
  async function isThisMonthRecordPresentForTwitter(): Promise<boolean> {
    const now = new Date();
    const todayDate = now.toISOString().split("T")[0];
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];
    const { data, error } = await supabase
      .from("account_analytics")
      .select("date")
      .gte("date", startOfMonth)
      .lte("date", endOfMonth)
      .eq("platform", "twitter")
      .limit(1);
    if (error) {
      console.error("Error fetching data:", error);
      return false;
    }
    console.log("data from the is month record present (twitter) = ", data);
    if (data.length == 0) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user found");
      if (error) throw error;

      const response = await getTwitterInsights();
      console.log("data  = ", response);

      const { error: insertError } = await supabase
        .from("account_analytics")
        .insert([
          {
            reach:
              response?.metrics?.public_metrics?.followers_count /
                response?.metrics?.public_metrics?.tweet_count || 0,
            engagement:
              response?.metrics?.public_metrics?.like_count /
                response?.metrics?.public_metrics?.followers_count || 0,
            post: response?.metrics?.public_metrics?.tweet_count || 0,
            followers: response?.metrics?.public_metrics?.followers_count || 0,
            date: todayDate,
            platform: "twitter",
            profileid: user?.id,
          },
        ]);

      if (insertError) {
        console.error("Error inserting record:", insertError);
      } else {
        console.log("New record inserted for this month.");
      }
    }
    return data.length > 0;
  }

  useEffect(() => {
    (async () => {
      if (await checkIfAccountIsPresent("twitter")) {
        await isThisMonthRecordPresentForTwitter();
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const pastOneWeek = await fetchPastOneWeekData(
        "account_analytics",
        "instagram"
      );
      const past1Month = await fetchPastOneMonthData(
        "account_analytics",
        "instagram"
      );
      const past3Months = await fetchPastThreeMonthsData(
        "account_analytics",
        "instagram"
      );
      const past6Months = await fetchPast6monthsData(
        "account_analytics",
        "instagram"
      );
      const pasth12Months = await fetchPastTwelveMonthsData(
        "account_analytics",
        "instagram"
      );
      const newTimeRange = [];
      if (pastOneWeek?.length > 0) {
        newTimeRange.push({ label: "1W", value: "1week" });
      }
      if (past1Month?.length > 0) {
        newTimeRange.push({ label: "1M", value: "1month" });
      }
      if (past3Months?.length > 0) {
        newTimeRange.push({ label: "3M", value: "3months" });
      }

      if (past6Months?.length > 0) {
        newTimeRange.push({ label: "6M", value: "6months" });
      }
      if (pasth12Months?.length > 0) {
        newTimeRange.push({ label: "1Y", value: "1year" });
      }

      setTimeRanges(newTimeRange);
      setLoader(true);
    })();
    (async () => {
      try {
        const response = await getTwitterInsights();
        console.log("data  = ", response);
        setTwitterinsights(response?.metrics?.public_metrics);
        const platformDetails = {
          name: "Twitter",
          icon: <Twitter className="h-6 w-6 text-white" />,
          color: "bg-blue-600",
          followers: `${
            response?.metrics?.public_metrics?.followers_count || 0
          } `,
          engagement: `${
            response?.metrics?.public_metrics?.like_count /
              response?.metrics?.public_metrics?.followers_count || 0
          }`,

          growth: 0,
          posts: `${response?.metrics?.public_metrics?.tweet_count || 0}`,
          //  Followers Count / Tweet Count
          reach: `${
            response?.metrics?.public_metrics?.followers_count /
              response?.metrics?.public_metrics?.tweet_count || 0
          }%`,
          engagementChange: "0.00",
        };
        setPlatforms((prevPlatforms) =>
          prevPlatforms.map((platform) =>
            platform.name === "Twitter" ? { ...platformDetails } : platform
          )
        );
      } catch (err) {
        console.log(err);
      }
    })();
  }, []);
  useEffect(() => {
    if (instaAccountId) {
      getInstaInsights(instaAccountId, instaUserName);
      getInstaReach(instaAccountId);
    }
  }, [instaAccountId]);

  useEffect(() => {
    console.log("Log data from analystics", accounts);
    fetchLinkedAccount();
  }, [accountsLoading]);

  useEffect(() => {
    if (idConnectedWithInsta) {
      getInstaAccountId(idConnectedWithInsta);
    }
  }, [idConnectedWithInsta]);

  useEffect(() => {
    setPastAnalytics(null);
    showMetricData();
  }, [cardType]);

  const fetchLinkedAccount = async () => {
    const instaAccount = accounts.find((acc) => acc?.platform === "instagram");

    if (!instaAccount || !instaAccount.access_token) {
      console.error("Instagram account or token is missing");
      return;
    }
    const instaToken: string = instaAccount?.access_token; // Get the token
    setInstaUserName(instaAccount?.username);
    console.log("instatoken", instaToken);
    try {
      const res = await InstagramServices.fetchLinkedAccounts(instaToken);
      console.log("Response insta fetch accounts", res?.data);
      setIdConnectedWithInsta(res?.data[0]?.id);
    } catch (error) {
      console.error("Error fetching linked accounts", error);
    }
  };

  const getInstaAccountId = async (id: number) => {
    try {
      const res = await InstagramServices.fetchInstaAccountID(id);
      console.log("Response insta account id", res);
      setInstaAccountId(res?.instagram_business_account?.id);
    } catch (error) {
      console.error("Error fetching Instagram accounts", error);
    }
  };

  const getInstaInsights = async (instAccId: number, userName: string) => {
    try {
      const res = await InstagramServices.insights(instAccId, userName);
      console.log("Response insta insights", res);
      const followers: number = res?.business_discovery?.followers_count ?? 0;
      const totalLikes: number =
        res?.business_discovery?.media?.data.reduce(
          (sum: number, post: any) => sum + (post?.like_count ?? 0),
          0
        ) ?? 0;
      const totalComments =
        res?.business_discovery?.media?.data.reduce(
          (sum: any, post: any) => sum + (post?.comments_count ?? 0),
          0
        ) ?? 0;
      const engagement =
        followers > 0 ? ((totalLikes + totalComments) / followers) * 10 : 0;
      const posts = res?.business_discovery?.media_count ?? 0;
      console.log("Engagement Rate:", engagement.toFixed(2) + "%");
      setInstaFollowers(followers.toLocaleString());
      setInstaEngagement(engagement.toFixed(2));
      setInstaPost(posts);
      setPlatforms((prevPlatforms) =>
        prevPlatforms.map((platform) =>
          platform.name === "Instagram"
            ? {
                ...platform,
                followers: followers.toLocaleString(),
                engagement: engagement.toFixed(2),
                posts: posts,
              }
            : platform
        )
      );

      metricCardData.engagementRate = engagement.toFixed(2) || "0.00%";
      metricCardData.totalFollowers = followers.toLocaleString() || "0";
      metricCardData.totalPosts = posts || 0;
    } catch (error) {
      console.error("Error fetching Instagram insights", error);
    }
  };

  const getInstaReach = async (instAccId: number) => {
    try {
      const res = await InstagramServices.instaReach(instAccId, period);
      console.log("Response insta reach", res);
      const reachData = res?.data?.find((item: any) => item?.name === "reach");
      const reach = reachData
        ? reachData?.values.reduce(
            (total: number, value: { value: number }) => total + value?.value,
            0
          )
        : 0;
      console.log("reach value", reach);
      setInstaReach(reach);
      metricCardData.reach = reach.toFixed(2);
      setPlatforms((prevPlatforms) =>
        prevPlatforms.map((platform) =>
          platform.name === "Instagram"
            ? { ...platform, reach: reach }
            : platform
        )
      );
      await fetchPastOneWeekData("account_analytics", "instagram");
    } catch (error) {
      console.error("Error fetching Instagram reach", error);
    }
  };

  const showMetricData = () => {
    console.log("show type", cardType);
    if (cardType === "Instagram") {
      console.log("Inside insta", cardType);
      metricCardData.engagementRate = instaEngagement || "0.00";
      metricCardData.totalFollowers = instaFollowers || "0";
      metricCardData.totalPosts = instaPost || 0;
      metricCardData.reach = instaReach || 0;
    } else if (cardType == "Twitter") {
      metricCardData.engagementRate = `${
        twitterinsights?.like_count / twitterinsights?.followers_count || 0
      }`;
      metricCardData.totalFollowers = `${
        twitterinsights?.followers_count || 0
      }`;
      metricCardData.totalPosts = `${twitterinsights?.tweet_count || 0}`;
      // Followers Count / Tweet Count
      metricCardData.reach = `${
        twitterinsights?.followers_count / twitterinsights?.tweet_count || 0
      }`;
    } else if (cardType == "LinkedIn") {
      metricCardData.engagementRate = "0.00";
      metricCardData.totalFollowers = "0";
      metricCardData.totalPosts = 0;
      metricCardData.reach = 0;
    }
    setCardToggle(!cardToggle);
  };

  async function fetchPastOneWeekData(
    tableName: string,
    platformname: string
  ): Promise<any[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("No authenticated user found");

    const now = new Date();
    const startOfLastWeek = new Date();
    startOfLastWeek.setDate(now.getDate() - 7);
    startOfLastWeek.setHours(0, 0, 0, 0);

    const endOfLastWeek = new Date();
    endOfLastWeek.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .eq("profileid", user?.id)
      .eq("platform", platformname)
      .gte("date", startOfLastWeek.toISOString().split("T")[0])
      .lte("date", endOfLastWeek.toISOString().split("T")[0])
      .limit(1);

    if (data?.[0]) {
      setPastAnalytics(data?.[0]);
      setPlatforms((prevPlatforms) =>
        prevPlatforms.map((platform) =>
          platform.name.toLowerCase() === data?.[0]?.platform
            ? {
                ...platform,
                engagementChange: `${
                  ((Number(platform?.engagement) - data[0]?.engagement) /
                    data[0]?.engagement) *
                  100
                }`,
              }
            : platform
        )
      );
    }

    if (error) {
      console.error("Error fetching last week’s data:", error);
      return [];
    }

    console.log("past one week data =", data);
    return data;
  }

  async function fetchPastOneMonthData(
    tableName: string,
    platformname: string
  ): Promise<any[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("No authenticated user found");
    const now = new Date();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      .toISOString()
      .split("T")[0];
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
      .toISOString()
      .split("T")[0];
    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .eq("profileid", user?.id)
      .eq("platform", platformname)
      .gte("date", startOfLastMonth)
      .lte("date", endOfLastMonth);
    if (data?.[0]) {
      setPastAnalytics(data?.[0]);
      setPlatforms((prevPlatforms) =>
        prevPlatforms.map((platform) =>
          platform.name.toLowerCase() === data?.[0]?.platform
            ? {
                ...platform,
                engagementChange: ` ${
                  Number(platform?.engagement) !== 0
                    ? ((Number(platform?.engagement) - data[0]?.engagement) /
                        data[0]?.engagement) *
                      100
                    : 0
                }`,
              }
            : platform
        )
      );
    }

    if (error) {
      console.error("Error fetching last month’s data:", error);
      return [];
    }
    console.log("past one month data = ", data);

    return data;
  }
  async function fetchPastThreeMonthsData(
    tableName: string,
    platformname: string
  ): Promise<any | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("No authenticated user found");

    const now = new Date();
    const startOfThreeMonthsAgo = new Date(
      now.getFullYear(),
      now.getMonth() - 3,
      1
    )
      .toISOString()
      .split("T")[0];
    const endOfLastMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 3 + 1,
      0
    )
      .toISOString()
      .split("T")[0];
    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .eq("profileid", user?.id)
      .eq("platform", platformname)
      .gte("date", startOfThreeMonthsAgo)
      .lte("date", endOfLastMonth)
      .limit(1);
    if (data?.[0]) {
      setPastAnalytics(data?.[0]);
      setPlatforms((prevPlatforms) =>
        prevPlatforms.map((platform) =>
          platform.name.toLowerCase() === data?.[0]?.platform
            ? {
                ...platform,
                engagementChange: ` ${
                  Number(platform?.engagement) !== 0
                    ? ((Number(platform?.engagement) - data[0]?.engagement) /
                        data[0]?.engagement) *
                      100
                    : 0
                }`,
              }
            : platform
        )
      );
    }
    if (error) {
      console.error("Error fetching past three months’ data:", error);
      return [];
    }

    console.log("Past three months data =", data);
    return data;
  }

  async function fetchPast6monthsData(
    tableName: string,
    platformname: string
  ): Promise<any[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("No authenticated user found");

    const now = new Date();
    const startOfTwelveMonthsAgo = new Date(
      now.getFullYear(),
      now.getMonth() - 6,
      1
    )
      .toISOString()
      .split("T")[0];
    const endOfLastMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 6 + 1,
      0
    )
      .toISOString()
      .split("T")[0];

    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .eq("profileid", user?.id)
      .eq("platform", platformname)
      .gte("date", startOfTwelveMonthsAgo)
      .lte("date", endOfLastMonth)
      .limit(1);
    if (data?.[0]) {
      setPastAnalytics(data?.[0]);
      setPlatforms((prevPlatforms) =>
        prevPlatforms.map((platform) =>
          platform.name.toLowerCase() === data?.[0]?.platform
            ? {
                ...platform,
                engagementChange: ` ${
                  Number(platform?.engagement) !== 0
                    ? ((Number(platform?.engagement) - data[0]?.engagement) /
                        data[0]?.engagement) *
                      100
                    : 0
                }`,
              }
            : platform
        )
      );
    }
    if (error) {
      console.error("Error fetching past twelve months’ data:", error);
      return [];
    }

    console.log("Past 6 months data =", data);
    return data;
  }

  async function fetchPastTwelveMonthsData(
    tableName: string,
    platformname: string
  ): Promise<any[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("No authenticated user found");

    const now = new Date();
    const startOfTwelveMonthsAgo = new Date(
      now.getFullYear(),
      now.getMonth() - 12,
      1
    )
      .toISOString()
      .split("T")[0];
    const endOfLastMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 12 + 1,
      0
    )
      .toISOString()
      .split("T")[0];

    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .eq("profileid", user?.id)
      .eq("platform", platformname)
      .gte("date", startOfTwelveMonthsAgo)
      .lte("date", endOfLastMonth)
      .limit(1);
    if (data?.[0]) {
      setPastAnalytics(data?.[0]);
      setPlatforms((prevPlatforms) =>
        prevPlatforms.map((platform) =>
          platform.name.toLowerCase() === data?.[0]?.platform
            ? {
                ...platform,
                engagementChange: ` ${
                  Number(platform?.engagement) !== 0
                    ? ((Number(platform?.engagement) - data[0]?.engagement) /
                        data[0]?.engagement) *
                      100
                    : 0
                }`,
              }
            : platform
        )
      );
    }
    if (error) {
      console.error("Error fetching past twelve months’ data:", error);
      return [];
    }

    console.log("Past twelve months data =", data);
    return data;
  }

  const handleTimeRangeValue = async (value: any) => {
    console.log("time range = ", value);
    setSelectedTimeRange(value);
    if (cardType === "Instagram") {
      setPastAnalytics(null);

      if (value == "1week") {
        console.log("past 1 week data");
        await fetchPastOneWeekData("account_analytics", "instagram");
      } else if (value == "1month") {
        await fetchPastOneMonthData("account_analytics", "instagram");
      } else if (value == "3months") {
        await fetchPastThreeMonthsData("account_analytics", "instagram");
      } else if (value == "6months") {
        await fetchPast6monthsData("account_analytics", "instagram");
      } else if (value == "1year") {
        await fetchPastTwelveMonthsData("account_analytics", "instagram");
      }
    } else if (cardType == "Twitter") {
      setPastAnalytics(null);
      if (value == "1week") {
        await fetchPastOneWeekData("account_analytics", "twitter");
      } else if (value == "1month") {
        await fetchPastOneMonthData("account_analytics", "twitter");
      } else if (value == "3months") {
        await fetchPastThreeMonthsData("account_analytics", "twitter");
      } else if (value == "6months") {
        await fetchPast6monthsData("account_analytics", "twitter");
      } else if (value == "1year") {
        await fetchPastTwelveMonthsData("account_analytics", "twitter");
      }
    }
  };

  const handleOnClickPlatformCard = async (platform: any) => {
    console.log("platform name = ", platform.name);
    setCardType(platform.name);
    setPastAnalytics(null);
    if (platform?.name) {
      await fetchPastOneWeekData(
        "account_analytics",
        platform?.name?.toLowerCase()
      );
    }
  };

  if (!loader) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Analytics Overview</h1>

        {/* Time Range Selector */}
        <div className="flex space-x-2">
          {timeRanges.map((range: any, index) => (
            <button
              key={index}
              onClick={() => {
                handleTimeRangeValue(range.value);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                selectedTimeRange === range.value
                  ? "bg-purple-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Platform Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {platforms.map((platform) => (
          <PlatformCard
            analytics={pastAnalytics}
            cardType={cardType}
            key={platform.name}
            {...platform}
            click={() => {
              handleOnClickPlatformCard(platform);
            }}
          />
        ))}
      </div>

      {/* Growth Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          icon={<Users className="w-6 h-6 text-purple-500" />}
          title="Total Followers"
          value={metricCardData.totalFollowers}
          change={`${
            Number(metricCardData.totalFollowers) !== 0 &&
            pastAnalytics?.followers
              ? (
                  ((Number(metricCardData.totalFollowers) -
                    pastAnalytics?.followers) /
                    pastAnalytics?.followers) *
                  100
                ).toFixed(2)
              : 0
          }`}
          positive={true}
          timeRange={selectedTimeRange}
        />
        <MetricCard
          icon={<MessageSquare className="w-6 h-6 text-purple-500" />}
          title="Engagement Rate"
          value={metricCardData.engagementRate}
          change={`${
            Number(metricCardData.engagementRate) !== 0 &&
            pastAnalytics?.engagement
              ? (
                  ((Number(metricCardData.engagementRate) -
                    pastAnalytics?.engagement) /
                    pastAnalytics?.engagement) *
                  100
                ).toFixed(2)
              : 0
          }`}
          positive={true}
          timeRange={selectedTimeRange}
        />
        <MetricCard
          icon={<TrendingUp className="w-6 h-6 text-purple-500" />}
          title="Reach"
          value={metricCardData.reach.toString().slice(0,4)}
          change={`${
            Number(metricCardData.reach.toString()) !== 0 && 
            pastAnalytics?.reach
              ? (
                  ((Number( metricCardData.reach) - pastAnalytics?.reach) /
                    pastAnalytics?.reach) *
                  100
                ).toFixed(2)
              : 0
          } `}
          positive={true}
          timeRange={selectedTimeRange}
        />
        <MetricCard
          icon={<Calendar className="w-6 h-6 text-purple-500" />}
          title="Posts"
          value={metricCardData.totalPosts.toString()}
          change={`${
            pastAnalytics?.post
              ? (
                  ((metricCardData.totalPosts - pastAnalytics?.post) /
                    pastAnalytics?.post) *
                  100
                ).toFixed(2)
              : 0
          }`}
          positive={true}
          timeRange={selectedTimeRange}
        />
      </div>

      {/* Historical Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"></div>
    </div>
  );
}

function PlatformIcon({ platform }: { platform: string }) {
  switch (platform.toLowerCase()) {
    case "twitter":
      return <Twitter className="h-5 w-5 text-blue-400" />;
    case "linkedin":
      return <Linkedin className="h-5 w-5 text-blue-600" />;
    case "instagram":
      return <Instagram className="h-5 w-5 text-pink-500" />;
    default:
      return null;
  }
}

interface PlatformCardProps {
  cardType?: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  followers: string;
  engagement: string;
  engagementChange: string;
  growth: number;
  posts: number;
  analytics: any;
  click: () => void;
}

function PlatformCard({
  cardType,
  name,
  icon,
  color,
  followers,
  engagement,
  engagementChange,
  growth,
  posts,
  analytics,
  click,
}: PlatformCardProps) {
  return (
    <div
      className={`bg-gray-800 rounded-xl p-6 ${
        cardType?.toLowerCase() == name.toLowerCase()
          ? "border-2 border-purple-500"
          : ""
      } `}
      onClick={click}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
        <span
          className={`flex items-center ${
            Number(engagementChange) >= 0 ? "text-green-400" : "text-red-400"
          }`}
        >
          {Number(engagementChange) >= 0 ? (
            <ArrowUp className="h-4 w-4 mr-1" />
          ) : (
            <ArrowDown className="h-4 w-4 mr-1" />
          )}
          {Math.abs(Number(engagementChange)).toFixed(2)}%
        </span>
      </div>
      <h3 className="text-lg font-semibold text-white mb-4">{name}</h3>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-400">Followers</span>
          <span className="text-white">{followers}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Engagement</span>
          <span className="text-white">{engagement}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Posts</span>
          <span className="text-white">{posts}</span>
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  change: string;
  positive: boolean;
  timeRange: string;
}

function MetricCard({
  icon,
  title,
  value,
  change,
  positive,
  timeRange,
}: MetricCardProps) {
  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-gray-700 rounded-lg">{icon}</div>
        <span
          className={`flex items-center ${
            Number(change) >= 0 ? "text-green-400" : "text-red-400"
          }`}
        >
          {Number(change) >= 0 ? (
            <ArrowUp className="h-4 w-4 mr-1" />
          ) : (
            <ArrowDown className="h-4 w-4 mr-1" />
          )}
          {change}%
        </span>
      </div>
      <h3 className="text-gray-400 text-sm mb-1">{title}</h3>
      <p className="text-2xl font-bold text-white">
        {title.toLowerCase() === "engagement rate" ? `${value}%` : value}
      </p>
      <p className="text-sm text-gray-400 mt-2">
        LifeTime
        {/* Last{" "}
        {timeRange === "1week"
          ? "week"
          : timeRange === "1month"
          ? "month"
          : timeRange === "3months"
          ? "3 months"
          : timeRange === "6months"
          ? "6 months"
          : "year"} */}
      </p>
    </div>
  );
}
