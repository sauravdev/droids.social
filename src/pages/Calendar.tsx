import React, { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, parseISO , startOfMonth, addMonths, subMonths, eachDayOfInterval, endOfMonth, isSameMonth } from 'date-fns';
import { useScheduledPosts } from '../hooks/useScheduledPosts';
import { useContentPlan } from '../hooks/useContentPlan';
import { Edit2, Clock, Send, MoreVertical, X, AlertCircle , ChevronLeft, ChevronRight, Delete, RefreshCcw, Loader, Save } from 'lucide-react';
import type { ScheduledPost } from '../lib/types';
import { getSocialMediaAccountInfo } from '../lib/api';
import { BACKEND_APIPATH } from '../constants';
import Editor from '../components/Editor';
import { initializeTwitterAuth } from '../lib/twitter';

interface Post {
  id: string;
  content: string;
  platform: string;
  scheduled_for: string;
  status?  :string ,
  type: 'scheduled' | 'planned'  ,
  media_urls : any ;
}

interface PostModalProps {
  refreshCalendar : boolean ;
  setRefreshCalendar :  (refreshCalendar : boolean ) => void ; 
  post: Post;
  onClose: () => void;
  onSave?: (content: string) => Promise<void>;
  onReschedule?: (date: string) => Promise<void>;
  onPostNow?: () => Promise<void>;
}

//  onReschedule, 
function PostModal({refreshCalendar , setRefreshCalendar  ,  post, onClose}: PostModalProps) {
  console.log("post modal posts = " , post) ;
  const [content, setContent] = useState(post.content);

  const [scheduledFor, setScheduledFor] = useState(() => {
    const dateUTC = parseISO(post.scheduled_for);
    const dateLocal = new Date(dateUTC.getTime() + dateUTC.getTimezoneOffset() * 60000);
    return format(dateLocal, "yyyy-MM-dd'T'HH:mm");
  });
  const [saving, setSaving] = useState(false);
  const [deleting , setDeleting ] = useState(false)  ;
  const [posting , setPosting] = useState(false) ; 

  const [error, setError] = useState<string | null>(null);
  const {updatePost , deletePost   } = useScheduledPosts() ; 

 
  const hasContentChanged = content !== post.content;
  const hasScheduleChanged = scheduledFor !== format(new Date(parseISO(post.scheduled_for).getTime() + parseISO(post.scheduled_for).getTimezoneOffset() * 60000),  "yyyy-MM-dd'T'HH:mm");
 
  const handleReschedule = async () => {
    if (!hasScheduleChanged) return;
    setSaving(true);
    setError(null);
    try {
      console.log(scheduledFor);
      await updatePost(post?.id , {scheduled_for : scheduledFor }) ; 
      // call the backend api for rescheduling
      if(post?.platform == "instagram") 
      {
        const accountInfo = await getSocialMediaAccountInfo("instagram") ; 
        const {access_token , userId } = accountInfo  ; 
        if(post?.media_urls?.length == 1 ) 
        {
          const response  = await fetch(`${BACKEND_APIPATH.BASEURL}/schedule/post/instagram` , {
            method : "POST" ,
            headers: {
              'Authorization': `Bearer ${access_token}`, 
              "Content-Type" : "application/json" ,
            } , 
            body : JSON.stringify({ IG_USER_ID  : userId , date : scheduledFor ,imageUrl : post?.media_urls?.[0] ,  caption : post?.content   , jobId : post?.id})
    
          })
          const data = await response.json() 
          console.log("scheduled insta post api " , data ) ;  
        } 
        else if(post?.media_urls?.length > 1 ) {
          const response  = await fetch(`${BACKEND_APIPATH.BASEURL}/schedule/carousel/instagram` , {
            method : "POST" ,
            headers: {
              'Authorization': `Bearer ${access_token}`, 
              "Content-Type" : "application/json" ,
            } , 
            body : JSON.stringify({ userId  : userId , date : scheduledFor ,imageUrls : post?.media_urls ,  caption : post?.content   , jobId : post?.id})
    
          })
          const data = await response.json() 
          console.log("scheduled insta post api " , data ) ;  
        }

      }
      else if (post?.platform == "linkedin") 
      {
         const accountInfo = await getSocialMediaAccountInfo("linkedin") ; 
        const {access_token , userId  } = accountInfo  ;
        const response = await fetch(`${BACKEND_APIPATH.BASEURL}/schedule/post/linkedin` ,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id :userId,  text: post?.content  , date : scheduledFor  ,  jobId : post?.id }),
          }
        );
    
        const data = await response.json() ; 
        console.log(data)

      }
      else if(post?.platform == "twitter") 
      {
          const accountInfo = await getSocialMediaAccountInfo("twitter") ; 
          const {access_token , refresh_token  } = accountInfo  ;
        const scheduledResponse = await fetch(`${BACKEND_APIPATH.BASEURL}/schedule/post/api` , {method : "POST"   , headers: {
        'Content-Type': 'application/json',
      } , body : JSON.stringify({access_token , refresh_token , data : post?.content , date  : scheduledFor , jobId  :post?.id })})
        const data =  await scheduledResponse.json()  ;
        console.log("scheduled response from API  =  "  , data ) ;
      }
      else{
        console.warn("Invalid platform selected") ;
      }
     
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRefreshCalendar(!refreshCalendar) ; 
      onClose();
      setSaving(false);
    }
  };
  const handleDeletePost = async () : Promise<void> => {
    setError(null); 
    setDeleting(true) ;
    try{
      await deletePost(post?.id); 
      setRefreshCalendar(!refreshCalendar)
      onClose() ; 
    }
    catch(err :any ) 
    {
      setError(err?.message )
    }
    finally{
      setDeleting(false) ;
    }
  }

  const handlePostNow = async () => {
    setSaving(true);
    setError(null);
   
    try {
     
      if(post?.platform  == "instagram") 
      {
        setPosting(true) ;
         try{
              const accountInfo = await getSocialMediaAccountInfo("instagram") ; 
              const {access_token , userId } = accountInfo  ;
        
              const response = await fetch(`${BACKEND_APIPATH.BASEURL}/upload/post/instagram`,
                {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${access_token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({IG_USER_ID : userId ,  caption: post?.content , imageUrl : post?.media_urls?.[0] , postId : post?.id }),
                }
              );
              const data = await response.json() ; 
              console.log("post instagram api " , data) ; 
              setRefreshCalendar(!refreshCalendar) ;
            }
            catch(err )
            {
              console.log(err) ; 
            }
            finally{
              setPosting(false)  ;  
            }
      }
      else if(post?.platform == "linkedin" ) 
      {
        setPosting(true) ; 
        console.log("linked in post handler")  ;
        try{
              const accountInfo = await getSocialMediaAccountInfo("linkedin") ; 
              const {access_token , userId  } = accountInfo  ;
              const response = await fetch(`${BACKEND_APIPATH.BASEURL}/upload/post/linkedin` ,
                {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${access_token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ id : userId ,  text: post?.content , postId : post?.id  }),
                }
              );
              const data = await response.json() ; 
              console.log("post linkedin api " , data) ;
              setRefreshCalendar(!refreshCalendar) ;
        
            }
            catch(err) 
            {
              console.log(err)  ;
            }
            finally{
              setPosting(false) ;
            }
      }
      else if(post?.platform == "twitter") 
      {
        try{
          setPosting(true) ; 
          console.log("posting from twitter ... ")  ; 
          const accountInfo = await getSocialMediaAccountInfo("twitter") ; 
          const {access_token , refresh_token  } = accountInfo  ;
          const response = await fetch(`${BACKEND_APIPATH.BASEURL}/post/tweet/twitter` , {  headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
          }, method :  "POST" ,body : JSON.stringify({access_token , refresh_token   , data  :post?.content , postId : post?.id  } )} )
           if(response?.status >= 400  ) 
                {
                  if(response?.status == 403 ) 
                  {
                  setError("Content already posted") ; 
                  setPosting(false) ; 
                  return ;
                  }
                  else if(response?.status == 401 ) 
                  {
                      // redirect to login 
                      initializeTwitterAuth() ; 
                      setPosting(false) ; 
                      return ; 
                  }
                  setError("Something went wrong while posting on twitter") ; 
                  return ; 
                }
            const data = await response.json()  ; 
            console.log("twitter response  : " , data) ; 
            setRefreshCalendar(!refreshCalendar) ;
        }
        catch(err)
        {
          console.log(err) ; 
        }
        finally{
          setPosting(false) ;
        }
      }
      else{
        console.log("Invalid platform") 
      }
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
      setPosting(false) ;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Edit Post for  {post?.platform}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-900 text-white px-4 py-2 rounded-md text-sm mb-4 flex items-center space-x-2">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Content
            </label>
           
            <Editor data = {content}/>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Scheduled For
            </label>
            <input
              type="datetime-local"
              value={scheduledFor}
              onChange={(e ) => {setScheduledFor(e.target.value) } }
              className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div className="flex flex-wrap gap-2 justify-start">
       
            <button
              onClick={handleDeletePost}
              disabled={deleting}
              className={`px-4 py-2 text-white rounded-md flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50`}
            >
              {deleting ? (
            <>
              <Loader className="h-4 w-4 animate-spin" />
              <span>Deleting...</span>
            </>
          ) : (
            <>
               <Delete className="h-4 w-4" />
               <span>Delete Post</span>
            </>
          )}
             
            </button>


            <button
              onClick={handleReschedule}
              disabled={saving || !hasScheduleChanged}
              className={`px-4 py-2 text-white rounded-md flex items-center space-x-2 ${
                hasScheduleChanged ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 cursor-not-allowed'
              } disabled:opacity-50`}
            >
              <Clock className="h-4 w-4" />
              <span>Reschedule</span>
            </button>
            <button
              onClick={handlePostNow}
              disabled={posting}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center space-x-2 disabled:opacity-50"
            >
              {posting ? (
            <>
              <Loader className="h-4 w-4 animate-spin" />
              <span>Posting...</span>
            </>
            ) : (
              <>
                 <Send className="h-4 w-4" />
                 <span>Post Now</span>
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
 
  const { loading: scheduledLoading, error: scheduledError, updatePost, createPost, loadPosts } = useScheduledPosts();
  const { plans: contentPlans, loading: plansLoading, updatePlan, refreshPlans } = useContentPlan();
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [refreshCalendar , setRefreshCalender] = useState<boolean>(false);
  const [allPosts , setAllPosts] = useState<Post[]>([]) ;
  const [refreshingState , setRefreshingState] = useState<boolean>(false) ;

  const refresh =   async () : any  => {
    const data  =  await loadPosts() ; 
    console.log("refresh posts = " , data) ; 
    const newPosts  = [
      ...data 
    ]
    const newAllPosts = [
      ...newPosts.map(post => ({
        ...post,                   
        content: post.content,      
        type: 'scheduled' as const  
      })),
    ];
    setAllPosts(newAllPosts)
  }

  useEffect(() => {
    setInterval(() => {

      setRefreshCalender((prev) => !prev) ; 

    } , 5000) 
  },[])

  useEffect(() => {
    setRefreshingState(true) 
    ;(async () => {
      await refresh() ; 
    })()
    setRefreshingState(false) ; 
  } , [refreshCalendar] )


  // Calculate date range
  const startDate = subMonths(startOfMonth(currentDate), 1);
  const endDate = addMonths(endOfMonth(currentDate), 1);
  const monthsToShow = eachDayOfInterval({ start: startDate, end: endDate });
  
  // Group days by month
  const months = monthsToShow.reduce((acc: { [key: string]: Date[] }, date) => {
    const monthKey = format(date, 'yyyy-MM');
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(date);
    return acc;
  }, {});

  

  

  const getPostsForDay = (date: Date) => {
    return allPosts.filter((post: Post) => {
      const postDateUTC = parseISO(post.scheduled_for); // Parse stored UTC date
      const postDateLocal = new Date(postDateUTC.getTime() + postDateUTC.getTimezoneOffset() * 60000); // Convert to local time
  
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }
  

  return (
    <div className="space-y-8">
  <div className="flex justify-between items-center">
    <div className="flex gap-4 items-center">
      <h1 className="text-3xl font-bold text-white">Content Calendar</h1>
      <button 
        className={`${refreshingState ? 'animate-spin' : ""}`} 
        onClick={() => {setRefreshingState(true); setRefreshCalender(!refreshCalendar)}}
      >
        <RefreshCcw className={`h-6 w-6 text-gray-800 ${refreshingState ? 'animate-spin' : ''}`} />
      </button>
    </div>
    
    <div className="flex space-x-4">
      <button 
        onClick={() => setCurrentDate(subMonths(currentDate, 1))} 
        className="text-white"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <span className="text-white font-medium">{format(currentDate, 'MMMM yyyy')}</span>
      <button 
        onClick={() => setCurrentDate(addMonths(currentDate, 1))} 
        className="text-white"
      >
        <ChevronRight className="h-6 w-6" />
      </button>
    </div>
  </div>
  
  <div onClick={() => {setRefreshCalender(!refreshCalendar)}} className="space-y-8">
    {/* Sort months to ensure current month appears first */}
    {Object.entries(months)
      .sort(([keyA], [keyB]) => {
        // Get current month key in same format as month keys
        const currentMonthKey = format(currentDate, 'yyyy-MM');
        
        // If keyA is current month, it should come first
        if (keyA.startsWith(currentMonthKey)) return -1;
        // If keyB is current month, it should come first
        if (keyB.startsWith(currentMonthKey)) return 1;
        
        // Otherwise sort chronologically
        return new Date(keyA) - new Date(keyB);
      })
      .map(([monthKey, days]) => (
        <div key={monthKey} className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            {format(days[0], 'MMMM yyyy')}
          </h2>
          <div className="grid grid-cols-7 gap-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-gray-400 text-sm">
                {day}
              </div>
            ))}
            
            {days.map((date, index) => {
              const dayPosts = getPostsForDay(date);
              return (
                <div
                  key={index}
                  className={`min-h-[100px] p-2 rounded-lg ${
                    isSameMonth(date, new Date(monthKey))
                      ? 'bg-gray-700'
                      : 'bg-gray-800 opacity-50'
                  }`}
                >
                  <p className="text-white text-sm mb-2">{format(date, 'd')}</p>
                  <div className="space-y-2">
                    {dayPosts.map((post: Post) => (
                      post?.status !== "published" && <div
                        key={post.id}
                        onClick={() => setSelectedPost(post)}
                        className={`${
                          post.type === 'planned'
                            ? 'bg-blue-600 bg-opacity-20 border-blue-500'
                            : 'bg-purple-600 bg-opacity-20 border-purple-500'
                        } border rounded-lg p-2 cursor-pointer hover:bg-opacity-30 transition`}
                      >
                        <p className="text-white text-xs">
                          {post.content.slice(0, 20)}...
                        </p>
                        <p className="text-gray-400 text-xs">
                          {`${parseISO(post?.scheduled_for).getUTCHours()}:${parseISO(post?.scheduled_for).getUTCMinutes()}:${parseISO(post?.scheduled_for).getUTCSeconds()}`}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
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