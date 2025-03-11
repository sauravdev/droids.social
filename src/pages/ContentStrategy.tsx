import React, { useState } from 'react';
import { useContentStrategy } from '../hooks/useContentStrategy';
import { useContentPlan } from '../hooks/useContentPlan';
import { generateContentStrategy } from '../lib/openai';
import { PostGenerator } from '../components/PostGenerator';
import { ScheduleModal } from '../components/ScheduleModal';
import { supabase } from '../lib/supabase';
import type { ContentPlan, ContentStrategy as ContentStrategyType } from '../lib/types';
import { Loader, Plus, X, Calendar } from 'lucide-react';
import {useScheduledPosts} from '../hooks/useScheduledPosts'
import { getSocialMediaAccountInfo } from '../lib/api';
import { BACKEND_APIPATH } from '../constants';
import { useProfile } from '../hooks/useProfile';
import { useAuth } from '../context/AuthContext';
interface ContentPlanCardProps {
  plan: ContentPlan;
  onSave: (planId: string, updates: Partial<ContentPlan>) => Promise<void>;
  onSchedule: (plan: ContentPlan) => void;
}

function ContentPlanCard({ plan, onSave, onSchedule }: ContentPlanCardProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 flex flex-col justify-between">
      <h3 className="text-lg font-medium text-white mb-2">{plan.topic}</h3>
      <PostGenerator
        plan={plan}
        onSave={(updates) => onSave(plan.id, updates)}
        onSchedule={() => onSchedule(plan)}
      />
    </div>
  );
}

export function ContentStrategy() {
  const { strategies, loading: strategiesLoading, error: strategiesError, createStrategy } = useContentStrategy();
  const { plans, loading: plansLoading, error: plansError, createPlan, updatePlan } = useContentPlan();
  const [niche, setNiche] = useState('');
  const [goals, setGoals] = useState<string[]>([]);
  const [newGoal, setNewGoal] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<ContentPlan | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const {profile , updateProfile } = useProfile() ; 
  const {setRefreshHeader }  = useAuth() ; 

  const {createPost} = useScheduledPosts() ; 

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGoal.trim()) {
      setGoals([...goals, newGoal.trim()]);
      setNewGoal('');
    }
  };

  const handleRemoveGoal = (index: number) => {
    setGoals(goals.filter((_, i) => i !== index));
  };

  const handleGenerateStrategy = async () => {
    if((profile?.tokens - 10 ) < 0 ) 
      {
      setError("You do not have enough tokens for strategy generation ..") ; 
       return ; 
      } 
    if (!niche || goals.length === 0) {
      setError('Please provide a niche and at least one goal');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user found');

      const strategy = await generateContentStrategy(niche, goals);
      const savedStrategy = await createStrategy({
        profile_id: user.id,
        niche,
        goals,
        monthly_theme: strategy.monthly_theme,
        weekly_plans: strategy.weekly_plans
      });

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
              status: 'pending',
              scheduled_for: null
            });
          }
        }
      }

      // Reset form
      setNiche('');
      setGoals([]);
      if((profile?.tokens - 10 ) >= 0 ) 
        {
          await updateProfile({tokens : profile?.tokens - 10 })
          setRefreshHeader((prev) => !prev) ; 
        } 

    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSchedule = async (strategyId  : string , platform : string , format : string , topic  :string  , suggestion : string , status : string ,  scheduled_for : string    ) => {
    if (!selectedPlan) return;
    // console.log("scheduling for date = "  , date ) ; 
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user found');

    //creating a schedule
    try {
      const response = await createPost({
        profile_id: user.id,
        platform : platform,
        content : suggestion ,
        media_urls : [] , 
        scheduled_for,
        status  , 
      });
      console.log("response  = " , response ) ; 
      const jobId = response?.id ;
      if(platform == "instagram") 
            {
              const accountInfo = await getSocialMediaAccountInfo("instagram") ; 
              const {access_token , userId } = accountInfo  ; 
              const response  = await fetch(`${BACKEND_APIPATH.BASEURL}/schedule/post/instagram` , {
                method : "POST" ,
                headers: {
                  'Authorization': `Bearer ${access_token}`, 
                  "Content-Type" : "application/json" ,
                } , 
                body : JSON.stringify({ IG_USER_ID  : userId , date : scheduled_for ,  caption : suggestion, jobId })
        
              })
              const data = await response.json() 
              console.log("scheduled insta post api " , data ) ;   
      
            }
            else if (platform == "linkedin") 
            {
               const accountInfo = await getSocialMediaAccountInfo("linkedin") ; 
              const {access_token , userId  } = accountInfo  ;
              const response = await fetch(`${BACKEND_APIPATH.BASEURL}/schedule/post/linkedin`,
                {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${access_token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ id :userId,  text: suggestion  , date : scheduled_for  , jobId }),
                }
              );
          
              const data = await response.json() ; 
              console.log(data)
      
            }
            else if(platform == "twitter") 
            {
              const scheduledResponse = await fetch(`${BACKEND_APIPATH.BASEURL}/schedule/post/api` , {method : "POST"   , headers: {
              'Content-Type': 'application/json',
            } , body : JSON.stringify({data : suggestion , date  : scheduled_for , jobId})})
              const data =  await scheduledResponse.json()  ;
              console.log("scheduled response from API  =  "  , data ) ;
            }
            else{
              console.warn("Invalid platform selected") ;
            }
    } catch (err: any) {
      setError(err.message);
    }
    finally{
      setShowScheduleModal(false);
      setSelectedPlan(null);
    }
  };
  

  if (strategiesLoading || plansLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Content Strategy</h1>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>New Strategy</span>
        </button>
      </div>

      {/* Strategy Generator */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Generate New Strategy</h2>
        
        {error && (
          <div className="bg-red-900 text-white px-4 py-2 rounded-md text-sm mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="niche" className="block text-sm font-medium text-gray-300 mb-1">
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
            {plans.map((plan) => (
              <ContentPlanCard
                key={plan.id}
                plan={plan}
                onSave={updatePlan}
                onSchedule={(plan) => {
                  console.log("scheduling plan = " , plan ) ;
                  setSelectedPlan(plan);
                  setShowScheduleModal(true);
                  // add logic to schedule post 
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && selectedPlan && (
        <ScheduleModal
          plan={selectedPlan}
          onSchedule={(scheduled_for : string ) => {handleSchedule(selectedPlan?.strategy_id , selectedPlan?.platform , selectedPlan?.format , selectedPlan?.topic , selectedPlan?.suggestion , selectedPlan?.status , scheduled_for)}}
          onClose={() => {
            setShowScheduleModal(false);
            setSelectedPlan(null);
          }}
        />
      )}
    </div>
  );
}