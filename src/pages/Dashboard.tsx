import React, { useCallback, useEffect, useState } from 'react';
import { Calendar, MessageSquare, Users, TrendingUp, Twitter, Linkedin, Instagram, Link2} from 'lucide-react';
import { useProfile } from '../hooks/useProfile';
import { useScheduledPosts } from '../hooks/useScheduledPosts';
import { useSocialAccounts } from '../hooks/useSocialAccounts';
import { initializeTwitterAuth } from '../lib/twitter';
import { initializeLinkedInAuth } from '../lib/linkedin';
import { useNavigate } from 'react-router-dom';
import { loginWithInstagram } from '../lib/InstagramAuth';
import LinkedInAuth from '../lib/LinkedInAuth';
import { handleLogin } from '../lib/LinkedInAuth';
import { generateAIContentSuggestion } from '../lib/openai';
import { InstagramServices } from '../services/instagram';
import { getSocialAccounts, getSocialMediaAccountInfo } from '../lib/api';
import { BACKEND_APIPATH } from '../constants';
import { supabase } from '../lib/supabase';
import { parse, parseISO ,format} from 'date-fns';
import { useAuth } from '../context/AuthContext';
import PaymentSuccessPopup from '../components/PaymentSuccessPopup';

interface suggestion{
  type : string , 
  title : string , 
  description : string , 
}

export function Dashboard() {
  const { profile, loading: profileLoading } = useProfile();
  const { loadPosts , loading: postsLoading } = useScheduledPosts();
  const {  loading: accountsLoading  , unlinkAccount} = useSocialAccounts();
  const [accounts , setAccounts ] = useState<any>([]) ; 
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [platform , setPlatform] = useState<string | null > (null) ; 
  const [suggestions ,  setSuggestions ] = useState<suggestion[]>([]) ;
  const [instaAccountId , setInstaAccountId] = useState<number>();
  const [instaUserName , setInstaUserName] = useState<any>(); 
  const [idConnectedWithInsta , setIdConnectedWithInsta] = useState<number>();
  const[instaFollowers, setInstaFollowers] = useState<string>("");
  const[instaEngagement, setInstaEngagement] = useState<string>("");
  const [twitterinsights  , setTwitterinsights ] = useState({}) ; 
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const {paymentStatus } = useAuth() ;

  // ...existing functions (getTwitterInsights, fetchPastOneWeekData, etc.)...

  const getTwitterInsights = async () => {
    const {access_token , userId } = await getSocialMediaAccountInfo("twitter") ;
    console.log("user id =" , userId) ;
    const response = await fetch(`${BACKEND_APIPATH.BASEURL}/twitter/insights` , {
      method : 'POST' , 
      headers: {
        'Authorization': `Bearer ${access_token}`, 
        "Content-Type" : "application/json" ,
      } , 
      body : JSON.stringify({id : userId }) 
    })
    const data = await response.json() ; 
    return data ;
  }

  async function fetchPastOneWeekData(tableName: string, platformname: string): Promise<any[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user found');

    const now = new Date();
    const startOfLastWeek = new Date();
    startOfLastWeek.setDate(now.getDate() - 7);
    startOfLastWeek.setHours(0, 0, 0, 0);
    
    const endOfLastWeek = new Date();
    endOfLastWeek.setHours(23, 59, 59, 999) ;

    const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq("profileid", user?.id)
        .eq("platform", platformname)
        .gte('date', startOfLastWeek.toISOString().split('T')[0])
        .lte('date', endOfLastWeek.toISOString().split('T')[0])
        .limit(1) ; 

    if (error) {
        console.error('Error fetching last weeks data:', error);
        return [];
    }
    return data;
  }

  // ...existing useEffect hooks...

  useEffect(() => {
    ;(async () => {
      const newPosts = await loadPosts() ; 
      console.log("scheduled posts = "  , newPosts ) ;
      setPosts(newPosts) ;
      try{
        await fetchLinkedAccount()  
      }
      catch(err : any ) 
      {
        console.log("Something went wrong while fetching accounts"); 
      }
    })()

    ;(async () => {
      const accountsData = await getSocialAccounts() ; 
      console.log("my social media accounts = " , accountsData) ; 
      setAccounts(accountsData)  ; 
    })()
  } , [] ) ; 

  useEffect(()=>{ 
     if(idConnectedWithInsta){
       getInstaAccountId(idConnectedWithInsta)
     }
  },[idConnectedWithInsta])

  useEffect(()=>{
      if(instaAccountId){
        getInstaInsights(instaAccountId,instaUserName)
      }
    },[instaAccountId])

   useEffect(() => {
      ;(async () => {
        try{
          const response = await getTwitterInsights()  ;
          console.log("data  = "  , response) ; 
          setTwitterinsights(response?.data) ; 
        }
        catch(err) 
        {
          console.log(err) ; 
        }
      })() 
    } , [platform] ) ; 

  if (profileLoading || postsLoading || accountsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const getInstaAccountId = async (id:number) => {
    try {
      const res = await InstagramServices.fetchInstaAccountID(id)
      console.log("Response insta account id",res)
      setInstaAccountId(res?.instagram_business_account?.id)
    } catch (error) {
      console.error("Error fetching Instagram accounts", error);
    }
  }

  const getInstaInsights = async (instAccId:number,userName:string) => {
    try {
      const res = await InstagramServices.insights(instAccId,userName)
      console.log("Response insta insights",res) 
      const followers:number = res?.business_discovery?.followers_count  ?? 0;
      const totalLikes:number = res?.business_discovery?.media?.data.reduce((sum:number, post:any) => sum + (post?.like_count ?? 0), 0)?? 0;
      const totalComments = res?.business_discovery?.media?.data.reduce((sum:any, post:any) => sum +  (post?.comments_count ?? 0), 0)?? 0; 
      const engagement = followers > 0 ? ((totalLikes + totalComments) / followers) * 10 : 0;
      
      console.log("Engagement Rate:", engagement.toFixed(2) + "%");
      setInstaFollowers(followers.toLocaleString())
      setInstaEngagement(engagement.toFixed(2) + "%")
    } catch (error) {
      console.error("Error fetching Instagram insights", error);
    }
  }

  const fetchLinkedAccount = async () =>{
    const instaAccount = accounts.find((acc) => acc?.platform === "instagram");

    if (!instaAccount || !instaAccount.access_token) {
     console.error("Instagram account or token is missing");
     return;
    }
    const instaToken: string  = instaAccount?.access_token;
    setInstaUserName(instaAccount?.username)
   console.log('instatoken',instaToken);
    try {
         const res = await InstagramServices.fetchLinkedAccounts(instaToken)
         console.log("Response insta fetch accounts",res?.data) 
         const newId = res?.data[0]?.id
         console.log("id = " , newId) ; 
         setIdConnectedWithInsta(res?.data[0]?.id)
    } catch (error) {
         console.error("Error fetching linked accounts", error);
    }
  }

  const totalFollowers = accounts.reduce((sum, account) => sum + parseInt(account.username) || 0, 0);
  const upcomingPostsCount = posts.filter(post => new Date(post.scheduled_for) > new Date()).length;
  
  const handleTwitterConnect =  async () => {
    try{
      await initializeTwitterAuth();
    const newAccounts = await getSocialAccounts()  ; 
    setAccounts(newAccounts) ;
    }
    catch(err : any ) 
    {
      console.log("Something went wrong" , err?.message) ; 
    }
  }

  const handleInstaConnect =  async () => {
    try{
      loginWithInstagram() ; 
      const newAccounts = await getSocialAccounts()  ; 
      setAccounts(newAccounts) ;
    }
    catch(err : any ) 
    {
      console.log("Something went wrong" , err?.message) ; 
    }
  }

  const handleLinkedInConnect = async () => {
    try{
      handleLogin() ; 
      const newAccounts = await getSocialAccounts()  ; 
      setAccounts(newAccounts) ;
    }
    catch(err : any ) 
    {
      console.log("Something went wrong" , err?.message) ; 
    }
  }

  const handleConnect = async (platform: string) => {
    switch (platform) {
      case 'twitter':
        await handleTwitterConnect()
        break;
      case 'linkedin':
        await handleLinkedInConnect() ; 
        break;
      case 'instagram':
        await handleInstaConnect() ; 
        break;
      default:
        console.log('Platform not implemented:', platform);
    }
  };

  const handleDisconnect = async (platform: string) => {
    setDisconnecting(platform);
    setUpdateError(null);
    try {
      await unlinkAccount(platform);
      const newAccounts = accounts.filter((account) => account?.platform !== platform  ) 
      setAccounts(newAccounts) ; 
    } catch (err: any) {
      setUpdateError(err.message);
    } finally {
      setDisconnecting(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">
        Welcome back, {profile?.full_name || 'User'}!
      </h1>
      
      {/* Social Connections CTA */}
      <div className="bg-gray-800 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Connect Your Social Accounts</h2>
        <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">Get started by connecting your social media accounts to enable automatic posting and analytics.</p>
        
        {/* Connection buttons */}
        <div className="flex flex-wrap gap-2 sm:gap-4 mb-4">
          <button
            onClick={() => accounts.find((account) => account?.platform == "twitter") ? handleDisconnect("twitter") :  handleConnect('twitter')}
            className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm transition-colors ${accounts.find((account) => account?.platform == "twitter")
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
          >
            <Twitter className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="hidden xs:inline">{accounts.find((account) => account?.platform == "twitter") ? 'Disconnect Twitter' : 'Connect Twitter'}</span>
            <span className="xs:hidden">{accounts.find((account) => account?.platform == "twitter") ? 'Disconnect' : 'Connect'}</span>
            <Link2 className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
          </button>

          <button
            onClick={() => accounts.find((account) => account?.platform == "linkedin") ?  handleDisconnect("linkedin") : handleConnect('linkedin') }
            className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm transition-colors ${accounts.find((account) => account?.platform == "linkedin")
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
          >
            <Linkedin className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="hidden xs:inline">{accounts.find((account) => account?.platform == 'linkedin') ? "Disconnect LinkedIn" : "Connect LinkedIn"}</span>
            <span className="xs:hidden">{accounts.find((account) => account?.platform == 'linkedin') ? "Disconnect" : "Connect"}</span>
            <Link2 className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
          </button>

          <button
            onClick={() => accounts.find((account) => account?.platform == "instagram") ?  handleDisconnect("instagram") : handleConnect("instagram")}
            className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm transition-colors ${accounts.find((account) => account?.platform == "instagram")
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
          >
            <Instagram className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="hidden xs:inline">{accounts.find((account) => account?.platform == 'instagram') ? "Disconnect Instagram" : "Connect Instagram"}</span>
            <span className="xs:hidden">{accounts.find((account) => account?.platform == 'instagram') ? "Disconnect" : "Connect"}</span>
            <Link2 className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
          </button>
        </div>

        {/* Platform selector buttons */}
        <div className='flex flex-wrap gap-2 sm:gap-4'>
          {accounts?.length >= 1 && accounts.find((account) => account?.platform === "twitter") && 
            <button 
              onClick={() => {setPlatform("twitter")}} 
              className={`flex items-center justify-center p-2 sm:p-3 rounded-xl transition-colors ${platform == "twitter" ? "bg-blue-500 text-gray-200" : "bg-gray-200 text-blue-500 hover:bg-gray-300"}`}
            >
              <Twitter className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          }
          {accounts?.length >= 1 && accounts.find((account) => account?.platform == "instagram") && 
            <button 
              onClick={async () => {setPlatform("instagram") ; await fetchLinkedAccount() }} 
              className={`flex items-center justify-center p-2 sm:p-3 rounded-xl transition-colors ${platform == "instagram" ? "bg-purple-500 text-gray-200" : "bg-gray-200 text-purple-500 hover:bg-gray-300"}`}
            >
              <Instagram className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          }
          {accounts?.length >=1 && accounts.find((account) => account?.platform == "linkedin") && 
            <button 
              onClick={() => {setPlatform("linkedin")}} 
              className={`flex items-center justify-center p-2 sm:p-3 rounded-xl transition-colors ${platform == "linkedin" ? "bg-blue-500 text-gray-200" : "bg-gray-200 text-blue-500 hover:bg-gray-300"}`}
            >
              <Linkedin className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          }
        </div>
      </div>

      {/* Stats Grid - Twitter */}
      {platform == "twitter" && 
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <StatCard
            icon={<Users className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />}
            title="Total Followers"
            value={twitterinsights?.followers || 0 }
          />
          <StatCard
            icon={<MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />}
            title="Engagement Rate"
            value={`${(twitterinsights?.engagement || 0  )}%` }
          />
          <StatCard
            icon={<Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />}
            title="Scheduled Posts"
            value={posts.filter(post => post?.platform == "twitter" && new Date(post.scheduled_for) > new Date()).length.toString()}
            trend="Next 7 days"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />}
            title="Growth Rate"
            value="2.4%"
          />
        </div>
      }

      {/* Stats Grid - Instagram */}
      {platform == "instagram" && 
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <StatCard
            icon={<Users className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />}
            title="Total Followers"
            value={instaFollowers.toString() }
          />
          <StatCard
            icon={<MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />}
            title="Engagement Rate"
            value={instaEngagement}
          />
          <StatCard
            icon={<Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />}
            title="Scheduled Posts"
            value={posts.filter(post => post?.platform == "instagram" && new Date(post.scheduled_for) > new Date()).length.toString()}
            trend="Next 7 days"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />}
            title="Growth Rate"
            value="1.4%"
          />
        </div>
      }

      {/* Stats Grid - LinkedIn */}
      {platform == "linkedin" && 
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <StatCard
            icon={<Users className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />}
            title="Total Followers"
            value={"0"}
          />
          <StatCard
            icon={<MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />}
            title="Engagement Rate"
            value="0.0%"
          />
          <StatCard
            icon={<Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />}
            title="Scheduled Posts"
            value={ posts.filter(post => post?.platform == "linkedin" && new Date(post.scheduled_for) > new Date()).length.toString() }
            trend="Next 7 days"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />}
            title="Growth Rate"
            value="0.0%"
          />
        </div>
      }

      {/* Content Calendar Preview */}
      <div className="bg-gray-800 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Upcoming Content</h2>
        <div className="space-y-3 sm:space-y-4">
          {posts
            .filter(post => post?.status === "pending" && parseISO(post?.scheduled_for)  >=  new Date())
            .slice(0, 3)
            .map((post) => (
              <div key={post.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-700 p-3 sm:p-4 rounded-lg gap-3 sm:gap-0">
                <div className="min-w-0 flex-1">
                  <p className="text-white font-medium text-sm sm:text-base truncate">{post.content.slice(0, 50)}...</p>
                  <p className="text-gray-400 text-xs sm:text-sm capitalize">{post.platform}</p>
                </div>
                <div className="text-left sm:text-right flex-shrink-0">
                  <p className="text-purple-400 text-xs sm:text-sm">
                   {`${parseISO(post?.scheduled_for).getUTCDate()}/${parseISO(post?.scheduled_for).getUTCMonth() + 1 }/${parseISO(post?.scheduled_for).getFullYear()}`}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {`${parseISO(post?.scheduled_for).getUTCHours().toString().padStart(2, '0')}:${parseISO(post?.scheduled_for).getUTCMinutes().toString().padStart(2, '0')}`}
                  </p>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* AI Suggestions */}
      <div className="bg-gray-800 rounded-xl p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">AI Suggestions</h2>
        {suggestions && suggestions?.length > 0 && 
          <div className="space-y-3 sm:space-y-4">
            {suggestions.map((suggestion, index) => (
              <div key={index} className="bg-gray-700 p-3 sm:p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${suggestion?.type === 'high' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <span className="text-white font-medium text-sm sm:text-base">{suggestion?.title}</span>
                </div>
                <p className="text-gray-400 text-xs sm:text-sm">{suggestion?.description}</p>
              </div>
            ))}
          </div>
        }
      </div>
      {paymentStatus && <PaymentSuccessPopup/>}
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  trend?: string;
}

function StatCard({ icon, title, value, trend }: StatCardProps) {
  return (
    <div className="bg-gray-800 rounded-xl p-4 sm:p-6">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="p-2 bg-gray-700 rounded-lg">{icon}</div>
        {trend && <span className="text-green-500 text-xs sm:text-sm">{trend}</span>}
      </div>
      <h3 className="text-gray-400 text-xs sm:text-sm mb-1">{title}</h3>
      <p className="text-xl sm:text-2xl font-bold text-white truncate">{value}</p>
    </div>
  );
}