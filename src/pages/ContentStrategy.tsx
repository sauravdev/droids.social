import React, { useEffect, useState } from "react";
import { useContentStrategy } from "../hooks/useContentStrategy";
import { useContentPlan } from "../hooks/useContentPlan";
import { generateContentStrategy } from "../lib/openai";
import { PostGenerator } from "../components/PostGenerator";
import { ScheduleModal } from "../components/ScheduleModal";
import { supabase } from "../lib/supabase";

import type {
  ContentPlan,
  ContentStrategy as ContentStrategyType,
} from "../lib/types";
import { Loader, Plus, X, Calendar } from "lucide-react";
import { useScheduledPosts } from "../hooks/useScheduledPosts";
import {
  getContentPlans,
  getContentPlansWithSpecificStrategyId,
  getContentStrategies,
  getSocialMediaAccountInfo,
} from "../lib/api";
import { BACKEND_APIPATH } from "../constants";
import { useProfile } from "../hooks/useProfile";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useSocialAccounts } from "../hooks/useSocialAccounts";
import { useCustomModel } from "../hooks/useCustomModel";

interface ContentPlanCardProps {
  plan: ContentPlan;
  onSave: (planId: string, updates: Partial<ContentPlan>) => Promise<void>;
  onSchedule: (plan: ContentPlan) => void;
  setSelectedPlan: (action: any) => void;
  selectedPlan : any 
}

function ContentPlanCard({
  plan,
  onSave,
  onSchedule,
  setSelectedPlan,
  selectedPlan,
}: ContentPlanCardProps) {
  return (
    <div className="bg-gray-800 h-full  rounded-lg p-2 flex flex-col justify-between">
      <h3 className="text-lg font-medium text-white mb-2">{plan.topic}</h3>
      <PostGenerator
        plan={plan}
        onSave={(updates) => onSave(plan.id, updates)}
        onSchedule={() => onSchedule(plan)}
        setSelectedPlan={setSelectedPlan}
        selectedPlan = {selectedPlan} 
      />
    </div>
  );
}
interface Success {
  state: boolean;
  message: string;
}
export function ContentStrategy() {
  const {
    strategies,
    loading: strategiesLoading,
    error: strategiesError,
    createStrategy,
  } = useContentStrategy();
  const {
    loading: plansLoading,
    error: plansError,
    createPlan,
    updatePlan,
  } = useContentPlan();
  const [niche, setNiche] = useState("");
  const [plans, setPlans] = useState<any>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [newGoal, setNewGoal] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<ContentPlan | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const { profile, updateProfile } = useProfile();
  const [selectedStrategyId , setSelectedStrategyId] = useState('');
  const [success, setSuccess] = useState<Success>({
    state: false,
    message: "",
  });
  const navigateTo = useNavigate();
  const { accounts } = useSocialAccounts();
  const [refreshPlanss, setRefreshPlanss] = useState<boolean>(false);

  const [allStrategies, setAllStrategies] = useState([]);
  const [selectedStrategy, setSelectedStrategy] = useState("");

  const [loader, setLoader] = useState(false);

  const { loadCustomModels } = useCustomModel();
  // const [models, setModels] = useState(["grok", "openai"]);
  // const [selectedModel, setSelectedModel] = useState<string>(models?.[0]);

  const { models, setSelectedModel, selectedModel } = useAuth();

  useEffect(() => {
    ;(async () => {
      console.log("change spotted in selected plan = " , selectedPlan) ; 
      if(selectedStrategyId )
      {
        const data = await getContentPlansWithSpecificStrategyId(
            selectedStrategyId 
          );
        setPlans(data);
      }
    })()
  } , [selectedPlan]  )  

  const onChangeStrategyHandler = async (e: any) => {
    console.log("function triggered ... ");
    console.log("value ===== ", e.target.value);
    const id = e.target.value;
    if (!id) return;
    setLoader(true);
    let newPlans = [];
    try {
      const strategy = allStrategies.find((strategy) => strategy?.id === id);

      newPlans = await getContentPlansWithSpecificStrategyId(id);
      setPlans(newPlans);
      // console.log("nicheeeeeeeeeeeeeee => " , strategy?.niche)
      setSelectedStrategy(strategy?.niche);
      setSelectedStrategyId(strategy?.id || '') ; 
      
      console.log("new plans = ", newPlans);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoader(false);
    }
  };

  useEffect(() => {
    // ;(async () => {
    //   const customModels = await loadCustomModels() ;
    //   console.log("custom models  = " , customModels ) ;
    //   if(customModels && customModels?.length > 0 )
    //   {
    //     setModels((prev) => {
    //     return [
    //       ...prev , ...customModels
    //     ]
    //   })
    //   }
    // })() ;
    (async () => {
      try {
        const response = await getContentStrategies();

        if (response?.length > 0) {
          console.log("response = ", response);
          setAllStrategies(response);
          const data = await getContentPlansWithSpecificStrategyId(
            response[0]?.id
          );
          setPlans(data);
          setSelectedStrategy(response[0]?.niche)
          setSelectedStrategyId(response[0]?.id || '') ; 
        }
      } catch (err: any) {
        console.log("error = ", err);
        setError(err?.message);
      }
    })();
  }, [refreshPlanss]);

  const { setRefreshHeader } = useAuth();

  const { createPost } = useScheduledPosts();

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGoal.trim()) {
      setGoals([...goals, newGoal.trim()]);
      setNewGoal("");
    }
  };

  const handleRemoveGoal = (index: number) => {
    setGoals(goals.filter((_, i) => i !== index));
  };

  const handleGenerateStrategy = async () => {
    if (accounts?.length == 0) {
      setError("Please connect atleast one account first ....");
      return;
    }
    if (profile?.tokens - 10 < 0) {
      setError("You do not have enough tokens for strategy generation ..");
      navigateTo("/pricing");
      return;
    }
    if (!niche || goals.length === 0) {
      setError("Please provide a niche and at least one goal");
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const platforms = accounts.map((account) => account.platform);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user found");
      console.log("accounts = ", accounts);
      const strategy = await generateContentStrategy(niche, goals, platforms);
      const savedStrategy = await createStrategy({
        profile_id: user.id,
        niche,
        goals,
        monthly_theme: strategy.monthly_theme,
        weekly_plans: strategy.weekly_plans,
      });

      console.log("strategy = ", savedStrategy);

      // Create content plans for each post
      for (const week of strategy.weekly_plans) {
        for (const day of week.days) {
          for (const post of day.posts) {
            await createPlan({
              profile_id: user.id,
              strategy_id: savedStrategy.id,
              platform: post.platform,
              format: post.format,
              topic: post.topic,
              suggestion: post.suggestion,
              status: "pending",
              scheduled_for: null,
            });
          }
        }
      }

      // Reset form
      setNiche("");
      setGoals([]);
      if (profile?.tokens - 10 >= 0) {
        await updateProfile({ tokens: profile?.tokens - 10 });
        setRefreshHeader((prev) => !prev);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRefreshPlanss((prev) => !prev);
      setGenerating(false);
    }
  };



  const handleSchedule = async (
    strategyId: string,
    platform: string,
    format: string,
    topic: string,
    suggestion: string,
    status: string,
    scheduled_for: string
  ) => {

    console.log("selected plan suggestion ====== " , selectedPlan?.suggestion) ; 
    if (!selectedPlan) return;
    // console.log("scheduling for date = "  , date ) ;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("No authenticated user found");

    //creating a schedule
    try {

       if((format === "video" ) && platform == "instagram") 
        {
          setError("Video posting on instagram is currently not supported !");
           setTimeout(() => {
            setError("");
          }, 1500);
          return ; 
        }
        if((format === "carousel" ) && platform == "instagram") 
        {
          setError("Carousel posting on instagram is currently not supported !");
           setTimeout(() => {
            setError("");
          }, 1500);
          return ; 
        }
      const response = await createPost({
        profile_id: user.id,
        platform: platform,
        content: suggestion,
        media_urls: [],
        scheduled_for,
        status,
      });
      console.log("response  = ", response);
      const jobId = response?.id;
      if (platform == "instagram") {

       
        const accountInfo = await getSocialMediaAccountInfo("instagram");
        const { access_token, userId } = accountInfo;
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
              date: scheduled_for,
              caption: suggestion,
              jobId,
            }),
          }
        );
        const data = await response.json();
        console.log("scheduled insta post api ", data);
        setSuccess({ state: true, message: "Content Scheduled Successfully" });
      } else if (platform == "linkedin") {
        const accountInfo = await getSocialMediaAccountInfo("linkedin");
        const { access_token, userId } = accountInfo;
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
              text: suggestion,
              date: scheduled_for,
              jobId,
            }),
          }
        );

        const data = await response.json();
        console.log(data);
        setSuccess({ state: true, message: "Content Scheduled Successfully" });
      } else if (platform == "twitter") {
        const scheduledResponse = await fetch(
          `${BACKEND_APIPATH.BASEURL}/schedule/post/api`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              data: suggestion,
              date: scheduled_for,
              jobId,
            }),
          }
        );
        const data = await scheduledResponse.json();
        console.log("scheduled response from API  =  ", data);
        setSuccess({ state: true, message: "Content Scheduled Successfully" });
      } else {
        console.warn("Invalid platform selected");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setShowScheduleModal(false);
      setSelectedPlan(null);
    }
  };

  const handleModelChange = (e) => {
    const model = e.target.value;
    setSelectedModel(model);
    console.log("selected model = ", model);
  };

  if (strategiesLoading || plansLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }
  if (loader) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">
          AI Post Strategy and Content Generator
        </h1>
      </div>

      {/* Strategy Generator */}
      <div className="bg-gray-800 rounded-xl p-6">
        {/* <h2 className="text-xl font-bold text-white mb-4">Generate New Strategy</h2> */}

        {error && (
          <div className="bg-red-900 text-white px-4 py-2 rounded-md text-sm mb-4">
            {error}
          </div>
        )}

        {success.state && (
          <div className="bg-green-600 text-white px-3 py-2 my-3 sm:px-4 rounded-md text-sm">
            {success.message}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label
              htmlFor="niche"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Business Niche
            </label>
            <input
              type="text"
              id="niche"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:ring-purple-500 focus:border-purple-500"
              placeholder="e.g., Tech Startup, Fashion Brand, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Business Goals
            </label>
            <form onSubmit={handleAddGoal} className="flex space-x-2 mb-2">
              <input
                type="text"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                className="flex-1 bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:ring-purple-500 focus:border-purple-500"
                placeholder="Add a business goal"
              />
              <button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
              >
                Add Goal
              </button>
            </form>
            <div className="flex flex-wrap gap-2">
              {goals.map((goal, index) => (
                <div
                  key={index}
                  className="bg-gray-700 text-white px-3 py-1 rounded-full flex items-center space-x-2"
                >
                  <span>{goal}</span>
                  <button
                    onClick={() => handleRemoveGoal(index)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4 ">

        {allStrategies?.length > 0 && (
          <div className="flex-1 relative">
            <p className = "capitalize text-gray-200 ">Select a Strategy</p>
            <select
              // value ={selectedStrategy}
              onChange={onChangeStrategyHandler}
              className="block w-full px-4 py-3 pr-8 leading-tight bg-gray-700  border-gray-300 text-gray-200 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option className="capitalize" value="" disabled selected>
                {selectedStrategy}
              </option>
              {allStrategies.map((strategy) => (
                <option
                  className="capitalize "
                  key={strategy?.id}
                  value={strategy?.id}
                >
                  {strategy?.niche}
                </option>
              ))}
            </select>
            <div className="absolute top-[3.2rem] right-0 flex items-center px-2 pointer-events-none">
              <svg
                className="w-4 h-4 text-gray-200"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        )}
        {models && models?.length > 0 && (
          <div className=" flex-1 relative">
            <p className = "capitalize text-gray-200 ">Select a model</p>
            <select
              onChange={handleModelChange}
              className="block  appearance-none w-full  bg-gray-700 border border-gray-300 hover:border-gray-400 px-4 py-2 pr-8 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-200"
            >
              <option className="capitalize" value="" disabled selected>
                {selectedModel}
              </option>
              {models.map((model) => (
                <option key={model} value={model} className="py-1 capitalize">
                  {model}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute  top-[3.2rem] right-0 flex items-center px-2 text-gray-200">
              <svg
                className="h-4 w-4 fill-current"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
          </div>
          </div>
        )}
        
      </div>

          <div>
            <button
              onClick={handleGenerateStrategy}
              disabled={generating}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  <span>Generating Strategy...</span>
                </>
              ) : (
                <>
                  <Calendar className="h-5 w-5" />
                  <span>Generate Content Strategy</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      
      {/* Content Plans */}
      {plans.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">Content Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            { plans.map((plan) => (
               accounts.some((account) => account.platform === plan.platform) && <ContentPlanCard
                key={plan.id}
                plan={plan}
                onSave={updatePlan}
                onSchedule={(plan) => {
                  console.log("scheduling plan = ", plan);
                  setSelectedPlan(plan);
                  setShowScheduleModal(true);
                  // add logic to schedule post
                }}
                setSelectedPlan={setSelectedPlan}
                selectedPlan = {selectedPlan} 
              />
            ))}
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && selectedPlan && (
        <ScheduleModal
          plan={selectedPlan}
          onSchedule={(scheduled_for: string) => {
            handleSchedule(
              selectedPlan?.strategy_id,
              selectedPlan?.platform,
              selectedPlan?.format,
              selectedPlan?.topic,
              selectedPlan?.suggestion,
              selectedPlan?.status,
              scheduled_for
            );
          }}
          onClose={() => {
            setShowScheduleModal(false);
            setSelectedPlan(null);
          }}
        />
      )}
    </div>
  );
}
