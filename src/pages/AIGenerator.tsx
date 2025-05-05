import React, { useState , useEffect} from 'react';
import {Twitter, Linkedin, Instagram , Sparkles, Loader, Save, Edit2, History, RefreshCw, X, Calendar  , HardDriveUpload} from 'lucide-react';
import { generateImage, generatePost, generatePostFromCustomModel, generatePostUsingGrok, postGenerationApi } from '../lib/openai';
import { useContentPlan } from '../hooks/useContentPlan';
import { supabase } from '../lib/supabase';
import { ScheduleModal } from '../components/ScheduleModal';
import Editor from '../components/Editor.js';
import { useSocialAccounts } from '../hooks/useSocialAccounts.js';
import {useScheduledPosts} from '../hooks/useScheduledPosts.js'
import { getSocialMediaAccountInfo } from '../lib/api.js';
import { BACKEND_APIPATH } from '../constants/';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../hooks/useProfile.js';
import { useNavigate } from 'react-router-dom';
import { initializeTwitterAuth } from '../lib/twitter.js';
import { useCustomModel } from '../hooks/useCustomModel.js';
interface HistoryItem {
  id: string;
  topic: string;
  content: string;
  createdAt: string;
}

interface Success{
  state : boolean ; 
  message : string ;
}


const formatOptions = ['text', 'image'];
const sourceOptions = ['arxiv', 'youtube', 'twitter', 'linkedin', 'feedly'];

export function AIGenerator() {
  const [topic, setTopic] = useState('');
  const [platforms, setPlatforms] = useState<any>(['twitter' , "instagram" , "linkedin"]);  const [formats, setFormats] = useState<string[]>(['text']);
  const [selectedPlatforms , setSelectedPlatforms ] = useState<any>([]) ; 
  // const [platform , setPlatform ] = useState<string>("instagram")
  const [sources, setSources] = useState<string[]>([]);
  const [generatedContent, setGeneratedContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [posting , setPosting  ] = useState(false ); 
  const [generatedImage , setGeneratedImage ] = useState("") ;
  const {updateProfile , profile } = useProfile() ; 
  const [success  ,setSuccess ] = useState<Success>({state : false ,message : '' }) ; 
  const navigateTo = useNavigate() ; 
  const removeToast = () => {
    setTimeout(() => {setSuccess({state : false , message : ""})} , 2000)
  }; 

  const [model , setModel] = useState(['openai' , 'grok' ]) ; 
  const [selectedModel , setSelectedModel] = useState<string>('grok') ;
  const [customModels , setCustomModels] = useState<any>([]) ;
  const {loadCustomModels } = useCustomModel() ; 

  const handleCustomModelChange = (e : React.ChangeEvent<HTMLSelectElement>) => {

    const modelId = e.target.value ;
    const selectedModel  = customModels.find(((cm : any ) => cm?.id == modelId )) ; 
    console.log("selected model ="  , selectedModel) ; 
    setSelectedModel(selectedModel)  ; 
  } 



  

  

  const {setRefreshHeader} = useAuth() ; 


  const { createPlan } = useContentPlan();
  const {accounts} = useSocialAccounts() ; 

  const {createPost} = useScheduledPosts() ;


  useEffect(() => {
    ;(async () => {
      const models = await loadCustomModels() ;
      console.log("models = " , models ) ; 
      setCustomModels(models) ; 
    })()
  } , []  )

  async function handlePostTweet() {
    setSuccess({state : false , message : ''}) ; 
    const accountInfo = await getSocialMediaAccountInfo("twitter") ; 
    const {access_token , refresh_token  } = accountInfo  ;
    setPosting(true) ;
    try{
      const response = await fetch(`${BACKEND_APIPATH.BASEURL}/post/tweet/twitter` , {  headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }, method :  "POST" ,body : JSON.stringify({access_token , refresh_token , data  :generatedContent} )} )
      const data = await response.json() ; 
      console.log(data ) ;
      if(response?.status >= 400  ) 
      {
        if(response?.status == 403 ) 
        {
        setError("Content already posted") ; 
        setTopic('') ;
        setGeneratedContent('') ;
        setGeneratedImage('') ;
        return ;
        }
        else if(response?.status == 401 ) 
        {
            // redirect to login 
            initializeTwitterAuth() ; 
            return ; 
        }
        setError("Something went wrong while posting on twitter") ; 
        setTopic('') ;
        setGeneratedContent('') ;
        setGeneratedImage('') ;
        return ; 
      }
      setSuccess({state : true , message : 'Content posted !!'}) ; 
      removeToast() ;
    }
    catch(err : any ) 
    {
      setError(err?.message) ; 
    }
    finally{
      setTopic('') ;
      setGeneratedContent('') ;
      setGeneratedImage('') ;
      setPosting(false) ;
    }
  }
  const handlePostInstagram = async () => {
    setSuccess({state : false , message : ''}) ; 
    setPosting(true)  ;
    if(!generatedImage) 
      {
        setError("Please Provide Image For Uploading On Instagram") ; 
        return ; 
      }
    if(!generatedContent) 
    {
      setError("Please Provide Caption For Uploading On Instagram ") ; 
    }

  
    try{
      const accountInfo = await getSocialMediaAccountInfo("instagram") ; 
      const {access_token , userId  } = accountInfo  ;

      if(!userId || !access_token ) 
      {
        setError("Something went wrong while fetching user information") ;
        return ; 
      }
      
      const response = await fetch(`${BACKEND_APIPATH.BASEURL}/upload/post/instagram`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({IG_USER_ID : userId ,  caption: generatedContent  , imageUrl : generatedImage  }),
        }
      );
      const data = await response.json() ; 
      console.log("post instagram api " , data) ; 
      setSuccess({state : true , message : 'Content posted !!'}) ; 
      removeToast() ; 
    }
    catch(err : any  )
    {
      console.log(err) ; 
      setError(err.message);
    }
    finally{
      setPosting(false) ;
      setTopic('') ; 
      setGeneratedContent('') ;
      setGeneratedImage('') ;

    }
  }

  const handlePostLinkedin = async () => {
    
    setPosting(true)  ;
    setSuccess({state : false , message : ''}) ; 
    if(!generatedContent) 
      {
        setError("Please Provide Caption For Uploading On Linkedin ") ; 
      }
    try{
      const accountInfo = await getSocialMediaAccountInfo("linkedin") ; 
      const {access_token , userId  } = accountInfo  ;
      if(!userId || !access_token ) 
        {
          setError("Something went wrong while fetching user information") ;
          return ; 
        }
      const response = await fetch(`${BACKEND_APIPATH.BASEURL}/upload/post/linkedin` ,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id : userId ,  text: generatedContent }),
        }
      );
      const data = await response.json() ; 
      console.log("post linkedin api " , data) ;
      setSuccess({state : true , message : 'Content posted !!'}) ; 
      removeToast() ; 
    }
    catch(err : any ) 
    {
      console.log(err)  ;
      setError(err?.message) ; 
    }
    finally{
      setPosting(false) ;
      setGeneratedContent('');
      setTopic(''); 
      setGeneratedImage('') ; 
    }
  }

  

  const postButtons = [
    {value : "twitter" , method : handlePostTweet , icon : <Twitter/>},
    {value : "instagram" , method : handlePostInstagram , icon : <Instagram/>},
    {value : "linkedin" , method : handlePostLinkedin , icon : <Linkedin/>},
  ]
 

  const handleFormatToggle = (format: string) => {
    setFormats(prev => 
      prev.includes(format) 
        ? prev.filter(f => f !== format)
        : [...prev, format]
    );
  };

async function uploadToSupabase(imageData: File | Blob, fileName: string): Promise<string | null> {
      try{
        const { data, error } = await supabase.storage
        .from('profile-images')  
        .upload(fileName, imageData, {
          cacheControl: '3600', 
          upsert: true , 
          contentType: imageData.type || 'image/png',
        });
    
      if (error) {
        console.error('Error uploading to Supabase:', error);
        return null;
      }
      const { data: urlData } = supabase.storage
        .from('profile-images')
        .getPublicUrl(fileName);
    
      return urlData?.publicUrl ?? null;
      }
      catch(err) 
      {
        console.log("error  = " , err ) 
      } 
  } 

  const handleImageGeneration =  async () => {

    try{
      const imageURI = await generateImage(topic) ;
      const response = await fetch(`${BACKEND_APIPATH.BASEURL}/fetch-image?url=${encodeURIComponent(imageURI)}`)
      const imageBlob = await response.blob(); 
      const fileName = `uploads/generations-${Date.now()}.png`;
      const { data, error } = await supabase.storage
      .from("profile-images")
      .upload(fileName, imageBlob, { contentType: "image/png" });
    if (error) throw error;
    // Get the public URL of the uploaded image
     const { data: urlData } = supabase.storage
           .from('profile-images')
           .getPublicUrl(fileName);
    setGeneratedImage(urlData?.publicUrl ) ;
    }
    catch(error : any ) 
    {
      console.log("Something went wrong while handling the image " , error  ) ; 
      setError(error?.message) ; 
    }

  }

  const handleSourceToggle = (source: string) => {
    setSources(prev => 
      prev.includes(source) 
        ? prev.filter(s => s !== source)
        : [...prev, source]
    );
  }; 

  const handleGenerate = async () => {
    setSuccess({state : false , message : ''}) ; 
    if((profile?.tokens - 10 ) < 0 ) 
      {
        setError("You do not have enough tokens for post generation ..") ; 
        navigateTo("/pricing"); 
       return ; 
      } 

    if(selectedPlatforms.length == 0 ) 
    {
      setError("please select platform") ;
      return ; 
    }
      
    if (!topic) {
      setError('Please enter a topic');
      return;
    }
    setLoading(true);
    setError(null); 
    setGeneratedImage("") ; 
    setGeneratedContent("") ; 

    if (formats.find((format) => format === "image")) 
    {
      await handleImageGeneration() ;
    }
    try {
      // const content = await generatePost(topic, selectedPlatforms[0] );
      // const content = await generatePostFromCustomModel(topic)
      let content = ''; 
      if(selectedModel == "grok" )
      {
        const response = await generatePostUsingGrok(topic , selectedPlatforms[0]) ;
        const data = await response.json() ;  
        content = data?.message ; 
        console.log("content = " , data  ) ;
        
      }
      else if(selectedModel == "openai")
      {
        content = await generatePost(topic, selectedPlatforms[0] );
      }
      else{
        content  = await generatePostFromCustomModel(topic , selectedModel ) ;
      }
     
      if(selectedPlatforms?.length === 0  ) 
      {
        setError("Please select platform");
        return ;
      } 
      // const content = await generatePostUsingGrok(topic , selectedPlatforms[0] ) ; 
      setGeneratedContent(content) ;
      const historyItem: HistoryItem = {
        id: crypto.randomUUID(),
        topic,
        content,
        createdAt: new Date().toISOString()
      };
      setHistory(prev => [historyItem, ...prev]);
      if((profile?.tokens - 10 ) >= 0 ) 
        {
          await updateProfile({tokens : profile?.tokens - 10 })
          setRefreshHeader((prev) => !prev) ; 
        } 
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (platform : string ) => {
    setSuccess({state : false  , message : ''}) ;
    if (!generatedContent) {
      setError('Please generate content first');
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user found');
      console.log(user);
      await createPlan({
        profile_id: user.id,
        strategy_id: null,
        platform,
        format: formats[0],
        topic,
        suggestion: generatedContent,
        status: 'pending',
        scheduled_for: null
      });
      setSuccess({state : true , message : 'Content Saved !'}) ;
      removeToast() ; 
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };
  const handleScheduleTweet = async (date: string , postId : null | string = null ) => {
    if(!generatedContent) 
    {
      setError("Please generate content first") ; 
      return  ; 
    }
    setSuccess({state : false , message : ''}) ; 
    try {
      // protected route 
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user found');

      console.log(date.toString() ); 
      const post = {
        platform: "twitter" ,
        content : generatedContent ,
        media_urls : [] , 
        scheduled_for  :date , 
        status : "pending" , 
      }
      const accountInfo = await getSocialMediaAccountInfo("twitter") ; 
      const {access_token , refresh_token  } = accountInfo  ;
      if(!postId) 
      {
        const createdPost = await createPost(post) ; 
        console.log("createdPost (in tweet) = " , createdPost ); 
        const scheduledResponse = await fetch(`${BACKEND_APIPATH.BASEURL}/schedule/post/api` , {method : "POST"   , headers: {
          'Content-Type': 'application/json',
        } , body : JSON.stringify({access_token , refresh_token   , data : generatedContent , date  : date.toString() , jobId  :createdPost?.id })})
        console.log("scheduled response from API  =  "  , await scheduledResponse.json() ) ;
      }
      else{
        const scheduledResponse = await fetch(`${BACKEND_APIPATH.BASEURL}/schedule/post/api` , {method : "POST"   , headers: {
          'Content-Type': 'application/json',
        } , body : JSON.stringify({access_token , refresh_token   , data : generatedContent , date  : date.toString() , jobId  :postId})})
        console.log("scheduled response from API  =  "  , await scheduledResponse.json() ) ;
      }
      setSuccess({state : true , message : 'Content Scheduled Successfully !!'}) ; 
      removeToast() ; 
      
    } catch (err: any) {
      setError(err.message);
    }
    finally{
      setShowScheduleModal(false);
      setTopic('');
      setGeneratedContent('');
    }
  };
  const handleScheduleInstaPost = async (date :string , postId : null | string = null ) => {
    setSuccess({state : false , message : ''}) ; 
    if(!generatedImage)
    {
      setError("Please Provide Image For Uploading On Instagram") ;
      return ;
    }
    if(!generatedContent) 
    {
      setError("Please generate content first") ; 
      return ; 
    }
    try{
      const accountInfo = await getSocialMediaAccountInfo("instagram") ; 
      const {access_token , userId } = accountInfo  ;    
      if(!access_token || !userId) 
      {
        setError("Something went wrong while fetching user information") ;
        return ; 
      } 
      if(!postId) 
      {
        const post = {
          platform: "instagram" ,
          content : generatedContent ,
          media_urls : [generatedImage] , 
          scheduled_for  :date , 
          status : "pending" , 
        }
        const createdPost = await createPost(post) ; 
        console.log("createdPost (in instagram) = " , createdPost ); 
        const response  = await fetch(`${BACKEND_APIPATH.BASEURL}/schedule/post/instagram` , {
          method : "POST" ,
          headers: {
            'Authorization': `Bearer ${access_token}`, 
            "Content-Type" : "application/json" ,
          } , 
          body : JSON.stringify({ IG_USER_ID  : userId , date : date ,  caption : generatedContent , imageUrl : generatedImage  ,  jobId : createdPost?.id })

        })
        const data = await response.json() 
        console.log("scheduled insta post api " , data ) ;
        setSuccess({state : true , message : 'Content Scheduled Successfully !!'}) ; 
        removeToast() ; 
      }
      else{
        const response  = await fetch(`${BACKEND_APIPATH.BASEURL}/schedule/post/instagram` , {
          method : "POST" ,
          headers: {
            'Authorization': `Bearer ${access_token}`, 
            "Content-Type" : "application/json" ,
          } , 
          body : JSON.stringify({ IG_USER_ID  : userId , date : date ,  caption : generatedContent , jobId : postId})
  
        })
        const data = await response.json() 
        console.log("scheduled insta post api " , data ) ;
      }
      setShowScheduleModal(false); 
      // create scheduled post 
    }
    catch(err)  
    {
      console.log(err);
    }
  }
  const handleScheduleLinkedinPost = async (date : string ,  postId : null | string = null) => {
  setSuccess({state : false , message : ''}) ; 
  try{
    const accountInfo = await getSocialMediaAccountInfo("linkedin") ; 
    const {access_token , userId  } = accountInfo  ;
   if(!postId) 
   {
    const post = {
      platform: "linkedin" ,
      content : generatedContent ,
      media_urls : [] , 
      scheduled_for  :date , 
      status : "pending" , 
    }
    const createdPost = await createPost(post) ;  
    const response = await fetch(`${BACKEND_APIPATH.BASEURL}/schedule/post/linkedin` ,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id :userId,  text: generatedContent  , date  , jobId : createdPost?.id }),
      }
    );
    const data = await response.json() ; 
    console.log("data = " , data )  ;
   }
   else{
    const response = await fetch(`${BACKEND_APIPATH.BASEURL}/schedule/post/linkedin`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id :userId,  text: generatedContent  , date  , jobId : postId }),
      }
    );
    const data = await response.json() ; 
    console.log("data = " , data )  ;
   }

   setSuccess({state : true , message : 'Content Scheduled Successfully'}) ; 
   removeToast(); 
   
  }
  catch(err) 
  {
    console.log(err) ;
  }
  finally{
    setShowScheduleModal(false); 
  }
}
  const loadHistoryItem = (item: HistoryItem) => {
    setTopic(item.topic);
    setGeneratedContent(item.content);
  };

  const deleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const handleMultiPlatformPost = async () => {
    setSuccess({state : false , message  : '' }) ; 
    setPosting(true)  ;
    console.log("selected platforms  = " , selectedPlatforms  ) ; 
    const apiCalls = selectedPlatforms.map((selectedPlatform : string ) => selectedPlatform == "twitter" ? handlePostTweet : selectedPlatform == "instagram" ? handlePostInstagram : handlePostLinkedin )
    console.log("api calls = " , apiCalls) ; 
    try {
      if(selectedPlatforms?.find((selectedPlatform : string  ) => selectedPlatform == "instagram") ) 
      {
        await handlePostInstagram() ; 
      }
      if(selectedPlatforms?.find((selectedPlatform : string  ) => selectedPlatform == "linkedin"))
      {
        await handlePostLinkedin() ; 
      }
      if(selectedPlatforms?.find((selectedPlatform : string  ) => selectedPlatform == "twitter"))
      {
        await handlePostTweet()  ;
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Something went wrong") ; 
    }
    finally{
      setPosting(false) ; 
      setTopic(''); 
      setGeneratedContent(''); 
      setGeneratedImage('') ;

    }
    
  }
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-8">AI Content Generator</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Form Section */}
        <div className="lg:col-span-2">
          <div className="bg-gray-800 rounded-xl p-4 sm:p-6 space-y-4 sm:space-y-6">
            {error && (
              <div className="bg-red-900 text-white px-3 py-2 sm:px-4 rounded-md text-sm">
                {error}
              </div>
            )}
            {success.state && (
              <div className="bg-green-600 text-white px-3 py-2 sm:px-4 rounded-md text-sm">
                {success.message}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="topic" className="block text-sm font-medium text-gray-300 mb-1">
                  Topic
                </label>
                <input
                  type="text"
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:ring-purple-500 focus:border-purple-500 text-sm sm:text-base"
                  placeholder="What would you like to post about?"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full ">
               {accounts.length > 0 && <div>
                 
                  <label htmlFor="platform" className="block text-sm font-medium text-gray-300 mb-1">
                    Platform
                  </label>
                  <div className='flex  gap-2 w-full '>
  
                    {
                      platforms.map((platform : string  , index  ) => {
                        return accounts.find((account) => account?.platform == platform ) && <button className={`${(selectedPlatforms.some((selectedPlatform : string  ) => selectedPlatform === platform )? 'bg-purple-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'  )} px-3 py-1 rounded-full text-xs sm:text-sm `} onClick={() => {
                            if(selectedPlatforms.some((selectedPlatform : string  ) => selectedPlatform == platform ))
                            {
                              const newSelectedPlatforms = selectedPlatforms.filter((selectedPlatform : string  ) => selectedPlatform !== platform )
                              setSelectedPlatforms(newSelectedPlatforms) ; 
                            }
                            else{
                              setSelectedPlatforms((prev) => {
                                return [
                                  ...prev , 
                                  platform
                                ]
                              })

                            }
                          }} key = {index} >{platform} </button>
                      })
                    }
                  </div>
                </div>}

                <div>
                  
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Format
                </label>
                <div className="flex flex-wrap gap-2">
                  {formatOptions.map((format) => (
                    <button
                      key={format}
                      onClick={() =>{ handleFormatToggle(format)}}
                      className={`px-3 py-1 rounded-full text-xs sm:text-sm ${
                        formats.includes(format)
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
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
                <div className="flex flex-wrap gap-2">
                  {model.map((mod , index ) => (
                    <button
                      key={index}
                      onClick={() =>{ setSelectedModel(mod) }} 
                      className={`px-3 py-1 rounded-full text-xs sm:text-sm ${
                        selectedModel === mod 
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {mod}
                    </button>
                  ))}

                  {customModels?.length > 0 && <select value="custom-models"  onChange={(e) => {handleCustomModelChange(e )}} className="bg-gray-700 text-gray-300 border max-w-44 border-gray-600 rounded-md shadow-sm  text-sm sm:text-base">
                  <option value="custom-models" disabled>Custom Models</option>
                    {
                      
                      customModels.map((cm : any , index) => {
                        return <option key={index} value={cm?.id}>{cm?.model_name}</option>
                      })
                    }
                  </select>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Source
                </label>
                <div className="flex flex-wrap gap-2">
                  {sourceOptions.map((source) => (
                    <button
                      key={source}
                      onClick={() => handleSourceToggle(source)}
                      className={`px-3 py-1 rounded-full text-xs sm:text-sm ${
                        sources.includes(source)
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {source}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md flex items-center justify-center space-x-2 disabled:opacity-50 text-sm sm:text-base"
                >
                  {loading ? (
                    <>
                      <Loader className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span>Generate Content</span>
                    </>
                  )}
                </button>
              </div>

              {generatedContent && (
                <div className="space-y-4">
                  {generatedImage !== "" && <div className='w-full'><img  className='w-full object-cover rounded-xl' src = {generatedImage} /> </div>}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Generated Content
                    </label>
                    <Editor data = {generatedContent} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
  <button
    onClick={handleGenerate}
    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md flex items-center justify-center space-x-2 text-sm sm:text-base"
  >
    <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5" />
    <span>Regenerate</span>
  </button>

  {<button
    onClick={() => { 
      if(selectedPlatforms?.length > 0) {
        selectedPlatforms.map((selectedPlatform: string) => {
          handleSave(selectedPlatform);
        });
      } else {
        handleSave('');
      }
      setTopic('');
      setGeneratedContent('');
      setGeneratedImage("");
    }}
    disabled={saving}
    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center justify-center space-x-2 disabled:opacity-50 text-sm sm:text-base"
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
  </button>}
  
  {selectedPlatforms?.length == 1 && postButtons.map((postButton) => {
    return selectedPlatforms.find((selectedPlatform: string) => selectedPlatform === postButton?.value) && (
      <button
        key={postButton.value}
        onClick={postButton?.method}
        disabled={posting}
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center justify-center space-x-2 disabled:opacity-50 text-sm sm:text-base"
      >
        {posting ? (
          <>
            <Loader className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
            <span>posting...</span>
          </>
        ) : (
          <>
            {postButton?.icon}
            <span>Post</span>
          </>
        )}
      </button>
    );
  })}

  {selectedPlatforms?.length > 1 && (
    <button 
      disabled={posting} 
      onClick={handleMultiPlatformPost} 
      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center justify-center space-x-2 disabled:opacity-50 text-sm sm:text-base"
    >
      {posting ? (
        <>
          <Loader className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
          <span>posting...</span>
        </>
      ) : (
        <>
          <span>Post</span>
        </>
      )}
    </button>
  )}
  
  {selectedPlatforms?.length == 1 && (
    <button
      onClick={() => setShowScheduleModal(true)}
      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center justify-center space-x-2 text-sm sm:text-base"
    >
      <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
      <span>Schedule</span>
    </button>
  )}
</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* History Section */}
        <div className="bg-gray-800 rounded-xl p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4 flex items-center">
            <History className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            History
          </h2>
          <div className="space-y-4">
            {history.map((item) => (
              <div key={item.id} className="bg-gray-700 p-3 sm:p-4 rounded-lg">
                <h3 className="text-white font-medium mb-2 text-sm sm:text-base">{item.topic}</h3>
                <p className="text-white-400 text-xs sm:text-sm mb-2">
                  {item.content.substring(0, 100)}...
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => loadHistoryItem(item)}
                      className="text-purple-400 hover:text-purple-300 text-xs sm:text-sm flex items-center"
                    >
                      <Edit2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => deleteHistoryItem(item.id)}
                      className="text-red-400 hover:text-red-300 text-xs sm:text-sm flex items-center"
                    >
                      <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      <span>Delete</span>
                    </button>
                  </div>
                  <span className="text-gray-500 text-xs sm:text-sm">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
            {history.length === 0 && (
              <p className="text-gray-400 text-xs sm:text-sm">No generated content yet</p>
            )}
          </div>
        </div>

        
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <ScheduleModal
          plan={{
            id: '',
            profile_id: '',
            platform : selectedPlatforms[0], 
            format: formats[0],
            topic,
            suggestion: generatedContent,
            status: 'pending',
            scheduled_for: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }}
          onSchedule={selectedPlatforms[0] == "twitter" ? handleScheduleTweet : selectedPlatforms[0] == "instagram" ? handleScheduleInstaPost : handleScheduleLinkedinPost}
          onClose={() => setShowScheduleModal(false)}
        />
      )}
    </div>
  );
}


