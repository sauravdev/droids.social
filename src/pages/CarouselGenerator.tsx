import React, { useState } from 'react';

import {Twitter, Linkedin, Instagram  , FileText, Download, Loader, Image as ImageIcon, Edit2, Plus, Trash2, ArrowLeft, ArrowRight, Upload, Sparkles } from 'lucide-react';
import { generatePost } from '../lib/openai';
import { generateImage } from '../lib/openai';
import { supabase } from '../lib/supabase';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
import { useProfile } from '../hooks/useProfile';
import { getSocialMediaAccountInfo } from '../lib/api';
import { ScheduleModal } from '../components/ScheduleModal';
import { useScheduledPosts } from '../hooks/useScheduledPosts';
interface CarouselSlide {
  id: string;
  header: string;
  content: string;
  backgroundColor: string;
  textColor: string;
  headerFont: string;
  contentFont: string;
  headerSize: string;
  contentSize: string;
  emoji: string;
  icon: string;
  image: string;
}

const defaultSlideStyle = {
  backgroundColor: '#1F2937',
  textColor: '#FFFFFF',
  headerFont: 'Inter',
  contentFont: 'Inter',
  headerSize: '32px',
  contentSize: '24px',
  emoji: '',
  icon: ''
};

const fonts = [
  { name: 'Inter', label: 'Inter (Modern)' },
  { name: 'Georgia', label: 'Georgia (Elegant)' },
  { name: 'Arial', label: 'Arial (Clean)' },
  { name: 'Verdana', label: 'Verdana (Readable)' },
  { name: 'Trebuchet MS', label: 'Trebuchet MS (Professional)' }
];

const emojis = ['🚀', '💡', '✨', '🎯', '📈', '🔥', '💪', '🌟', '⭐️', '🏆'];
const icons = ['✓', '→', '•', '◆', '★', '○', '□', '△', '▷', '◎'];

const themes = [
  { name: 'Modern Dark', bg: '#1F2937', text: '#FFFFFF' },
  { name: 'Ocean Blue', bg: '#1E40AF', text: '#FFFFFF' },
  { name: 'Forest Green', bg: '#065F46', text: '#FFFFFF' },
  { name: 'Royal Purple', bg: '#5B21B6', text: '#FFFFFF' },
  { name: 'Sunset Orange', bg: '#9A3412', text: '#FFFFFF' },
  { name: 'Light Minimal', bg: '#F3F4F6', text: '#111827' },
  { name: 'Gradient Blue', bg: 'linear-gradient(135deg, #1E40AF, #3B82F6)', text: '#FFFFFF' },
  { name: 'Gradient Purple', bg: 'linear-gradient(135deg, #5B21B6, #8B5CF6)', text: '#FFFFFF' }
];

export function CarouselGenerator() {
  const { profile } = useProfile();
  const {createPost} = useScheduledPosts() ; 
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState<'linkedin' | 'instagram'>('linkedin');
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brandLogo, setBrandLogo] = useState<string | null>(null);
  const [linkedinProfile, setLinkedinProfile] = useState<string>('');
  const [postingOnInsta , setPostingOnInsta ] = useState<boolean>(false);
  const [postingOnLinkedin  , setPostingOnLinkedIn] = useState<boolean>(false) ; 
  const [showScheduleModal , setShowScheduleModal] = useState<boolean>(false) ; 

  const [schedulingInstagramCarousel , setSchedulingInstagramCarousel ] = useState<boolean>(false) ; 

  

  const handleBrandLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setBrandLogo(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateSlide = (id: string, updates: Partial<CarouselSlide>) => {
    setSlides(prevSlides => 
      prevSlides.map(slide => 
        slide.id === id ? { ...slide, ...updates } : slide
      )
    );
  };

  const generateCarousel = async () => {
    if (!topic) {
      setError('Please enter a topic');
      return;
    }
    

    setGenerating(true);
    setError(null);

    try {
      const prompt = `Create a professional carousel post about "${topic}" for ${platform} with exactly 3 slides. Include emojis and make it engaging:

      1. Intro slide: Attention-grabbing headline with emoji
      2-5. Four content slides: Key points with relevant emojis
      6. Summary slide: Key takeaways with emoji
      7. Outro slide: Strong call-to-action with emoji
      
      Format as JSON array: [{"header": "headline", "content": "detailed text", "emoji": "relevant_emoji"}, ...]`;

      let content = await generatePost(prompt, platform);
      
      
      const generateImg = async (prompt : string ) => {
        try{
          const imageURI =   await generateImage(prompt) ; 
          console.log("image generated = "  , imageURI  )  ;  
          try {
            const proxyUrl = `http://localhost:3000/fetch-image?url=${encodeURIComponent(imageURI)}`;
            const response = await fetch(proxyUrl);
            const blob = await response.blob();
            const imageObjectUrl = URL.createObjectURL(blob);
            console.log("imageObjectURl = " , imageObjectUrl) ;
            return imageObjectUrl;
          } catch (err) {
            console.error("Error:", err.message);
            return null;
          }
        }
        catch(err)
        {
          console.log("Something went wrong while generating image " , err  )
        }
      }
      
      
      let slideContents;
      try {
        if(typeof (content) == "string" ) 
        {
          const regex = /^```json\s*([\s\S]*)\s*```$/;
          const match = content.match(regex);
        if (match) {
          content =  match[1].trim();

        }
          slideContents = JSON.parse(content);
        }
        else{
          slideContents = content 
        }
      } catch(err) {
        console.log(err) ; 
        slideContents = [] 
        console.log("error parsing json") 
      }
      // Ensure we have all required slides
      while (slideContents.length < 3) {
        slideContents.push({
          header: `Slide ${slideContents.length + 1}`,
          content: 'Content here',
          emoji: emojis[slideContents.length % emojis.length]
        });
      }

      const newSlides = await Promise.all(
        slideContents.slice(0, 3).map(async (slide , index) => {
          const image = await generateImg( `$A high-quality, detailed image related to ${topic}, visually representing ${slide.header}. The image should be purely illustrative with no text, letters, or written elements. Focus on composition, colors, and meaningful visual storytelling.`);
          
          return {
            id: `slide-${index}`,
            header: slide.header || `Slide ${index + 1}`,
            content: slide.content || 'Content here',
            emoji: slide.emoji || emojis[index % emojis.length],
            icon: icons[index % icons.length],
            image: image, 
            ...defaultSlideStyle,
            ...themes[index % themes.length]
          };
        })
      );
      console.log(newSlides) 

      setSlides(newSlides);
      setCurrentSlide(0);
    } catch (err: any) {
      setError(err.message || 'Failed to generate carousel content');
    } finally {
      setGenerating(false);
    }
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


  const convertPDFToImages = async (pdfUrl) => {
    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    const pdf = await loadingTask.promise;
    const images = [];
    const imageUrls = [] 
  
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      await page.render(renderContext).promise;
      images.push(canvas.toDataURL('image/png'));

      // Convert canvas to image data URL
    const imgData = canvas.toDataURL('image/png');
    const imgBlob = await (await fetch(imgData)).blob();
    const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, ""); 
    const fileName = `uploads/Dalle-slide-${timestamp}-${i}.png`;
    const publicUrl = await uploadToSupabase(imgBlob, fileName);
    if (publicUrl) {
      console.log(`Image for page ${i} uploaded successfully! Public URL: ${publicUrl}`);
      imageUrls.push(publicUrl) ; 
    }
    }
    console.log("public images url = " , imageUrls) ;
    console.log("image urls = " , imageUrls) ; 
    const caption = await generatePost(topic   , "instagram") ;
    return {imageUrls ,caption } 
    
  };

  
 

  
  const exportToPDF = async () => {
    if (slides.length === 0) {
      setError('No slides to export');
      return;
    }
  
    setExporting(true);
    setError(null);
  
    try {
      const pdf = new jsPDF('p', 'px', [1080, 1350]);
      const pdfPages = [];
  
      for (let i = 0; i < slides.length; i++) {
        const slide = document.getElementById(`slide-${i}`);
        if (!slide) continue;
  
        const canvas = await html2canvas(slide, {
          scale: 2,
          backgroundColor: slides[i].backgroundColor,
          logging: false,
          useCORS: true,
          height: slide.clientHeight,
          width: slide.clientWidth,
          // width: 1080,
          // height: 1350
        });
        
        const imgData = canvas.toDataURL('image/png');
        pdfPages.push(imgData);
        if (i > 0) pdf.addPage([1080, 1350], 'p');
        pdf.addImage(imgData, 'PNG', 0, 0, 1080, 1350);
      }
      
      const pdfBlob = pdf.output('blob');
      console.log("pdf blob" , pdfBlob) 
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = pdfUrl;
      downloadLink.download = 'generated.pdf'; 
      downloadLink.textContent = 'Download PDF';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      const accountInfo = await getSocialMediaAccountInfo("linkedin") ; 
      const {access_token , userId  } = accountInfo  ;
      const formData = new FormData();
      formData.append('pdf', pdfBlob, 'generated.pdf');
      formData.append('caption', 'This is my new PDF publication on LinkedIn!');
      formData.append('id', userId);
     
      await fetch('http://localhost:3000/upload/carousel/linkedin', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
        body: formData,
    })
        .then(response => response.json())
        .then(data => console.log('Success:', data))
        .catch(error => console.error('Error:', error));
    } catch (err : any ) {
      setError('Error exporting to PDF: ' + (err?.message || 'Unknown error'));
    } finally {
      setExporting(false);
    }
  };

  const handleInstagramExport = async () => {
    if (slides.length === 0) {
      setError('No slides to export');
      return;
    }
    setPostingOnInsta(true ); 
    setError(null);
     try {
      const pdf = new jsPDF('p', 'px', [1080, 1350]);
      const pdfPages = [];
  
      for (let i = 0; i < slides.length; i++) {
        const slide = document.getElementById(`slide-${i}`);
        if (!slide) continue;
  
        const canvas = await html2canvas(slide, {
          scale: 2,
          backgroundColor: slides[i].backgroundColor,
          logging: false,
          useCORS: true,
          height: slide.clientHeight,
          width: slide.clientWidth,
        });
        
        const imgData = canvas.toDataURL('image/png');
        pdfPages.push(imgData);
        if (i > 0) pdf.addPage([1080, 1350], 'p');
        pdf.addImage(imgData, 'PNG', 0, 0, 1080, 1350);
      }
      
      const pdfBlob = pdf.output('blob');
      console.log("pdf blob" , pdfBlob) 
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const {imageUrls , caption }  = await convertPDFToImages(pdfUrl);
      try{
        const accountInfo = await getSocialMediaAccountInfo("instagram") ; 
        const {access_token , userId  } = accountInfo  ;
        const response = await fetch('http://localhost:3000/publish/carousel/instagram' ,{
          method: "POST",
          headers: {
            'Authorization': `Bearer ${access_token}`,
            "Content-Type": "application/json",
          },
          body : JSON.stringify({imageUrls , userId , caption})
        })
        const data = await response.json() ; 
        console.log("response from insta carousel api = " ,data ) ; 
      }
      catch(err : any ) 
      {
        console.log("Something went wrong while publishing carousel " , err || err?.message  )
      }
     
    }
    catch(error : any ) 
    {
      console.log('Something went wrong = ' ,  error || error?.message )
    }
    finally {
      setPostingOnInsta(false) ; 
    }

  }


  const handleScheduleCarouselOnInstagram = async (date : string    , postId : null | string = null) => {
    setSchedulingInstagramCarousel(true ) ;
    if (slides.length === 0) {
      setError('No slides to export');
      return;
    }
    setError(null);
    try{
      const pdf = new jsPDF('p', 'px', [1080, 1350]);
      const pdfPages = [];
  
      for (let i = 0; i < slides.length; i++) {
        const slide = document.getElementById(`slide-${i}`);
        if (!slide) continue;
  
        const canvas = await html2canvas(slide, {
          scale: 2,
          backgroundColor: slides[i].backgroundColor,
          logging: false,
          useCORS: true,
          height: slide.clientHeight,
          width: slide.clientWidth,
        });
        
        const imgData = canvas.toDataURL('image/png');
        pdfPages.push(imgData);
        if (i > 0) pdf.addPage([1080, 1350], 'p');
        pdf.addImage(imgData, 'PNG', 0, 0, 1080, 1350);
      }
      
      const pdfBlob = pdf.output('blob');
      console.log("pdf blob" , pdfBlob) 
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const {imageUrls , caption }  = await convertPDFToImages(pdfUrl);
      const accountInfo = await getSocialMediaAccountInfo("instagram") ; 
      const {access_token , userId } = accountInfo  ;  
      if(!postId) 
        {
          const post = {
            platform: platform ,
            content : caption ,
            media_urls : [] , 
            scheduled_for  :date , 
            status : "pending" , 
          }
          const createdPost = await createPost(post) ; 
          console.log("createdPost (in instagram) = " , createdPost ); 
          const response  = await fetch("http://localhost:3000/schedule/carousel/instagram" , {
            method : "POST" ,
            headers: {
              'Authorization': `Bearer ${access_token}`, 
              "Content-Type" : "application/json" ,
            } , 
            body : JSON.stringify({ imageUrls , userId , date : date ,  caption, jobId : createdPost?.id })
          })
          const data = await response.json() 
          console.log("scheduled insta post api " , data ) ;
        }  
    }
    catch(error : any ) 
    {
      setError(error?.message)  ; 
      console.log("Something went wrong while scheduling carousel post for instagram => " , error || error?.message )
    }
    finally{
      setSchedulingInstagramCarousel(false) ; 

    }

  }

  const handleScheduleCarouselOnLinkedin = (date  :string   ,  postId : null | string = null) => {

  }

  const handleLinkedinExport = async () => {
    setPostingOnLinkedIn(true) ; 
    // exportToPDF() 
    const caption = await generatePost(topic   , "linkedin")
    try{
      const accountInfo = await getSocialMediaAccountInfo("linkedin") ; 
      const {access_token , userId  } = accountInfo  ;
      const response = await fetch('http://localhost:3000/upload/multi/images' ,{
        method: "POST",
        headers: {
          'Authorization': `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
        body : JSON.stringify({  caption , id : userId })
      })
      const data = await response.json() ; 
      console.log("response from insta carousel api = " ,data ) ; 
    }
    catch(err : any ) 
    {
      console.log("Something went wrong while publishing carousel " , err || err?.message  )
    }
    setPostingOnLinkedIn(false) ;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-white mb-8">Carousel Generator</h1>

      {/* Generator Form */}
      <div className="bg-gray-800 rounded-xl p-6">
        <div className="space-y-6">
          <div>
            <label htmlFor="topic" className="block text-sm font-medium text-gray-300 mb-2">
              Topic
            </label>
            <input
              id="topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white"
              placeholder="What would you like to create a carousel about?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Platform
            </label>
            <div className="flex space-x-4">
              <button
                onClick={() => setPlatform('linkedin')}
                className={`px-4 py-2 rounded-lg ${
                  platform === 'linkedin'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                LinkedIn
              </button>
              <button
                onClick={() => setPlatform('instagram')}
                className={`px-4 py-2 rounded-lg ${
                  platform === 'instagram'
                    ? 'bg-pink-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Instagram
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Brand Logo
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleBrandLogoUpload}
                className="hidden"
                id="brand-logo"
              />
              <label
                htmlFor="brand-logo"
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg cursor-pointer flex items-center space-x-2"
              >
                <Upload className="h-5 w-5" />
                <span>Upload Logo</span>
              </label>
              {brandLogo && (
                <button
                  onClick={() => setBrandLogo(null)}
                  className="text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="linkedin" className="block text-sm font-medium text-gray-300 mb-2">
              LinkedIn Profile URL
            </label>
            <input
              id="linkedin"
              type="text"
              value={linkedinProfile}
              onChange={(e) => setLinkedinProfile(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white"
              placeholder="https://linkedin.com/in/username"
            />
          </div>

          <div className="flex space-x-4">
            <button
              onClick={generateCarousel}
              disabled={generating || !topic}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  <span>Generate Carousel</span>
                </>
              )}
            </button>

            {slides.length > 0 && (
              <button
                onClick={exportToPDF}
                disabled={exporting}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {exporting ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5" />
                    <span>Export PDF</span>
                  </>
                )}
              </button>
            )}


          {slides.length > 0 && platform == "instagram" &&  (
              <button
                onClick={handleInstagramExport}
                disabled={postingOnInsta}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {postingOnInsta ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    <span>Posting...</span>
                  </>
                ) : (
                  <>
                    <Instagram className="h-5 w-5" />
                    <span className='capitalize'>Post</span>
                  </>
                )}
              </button>
            )}
             {slides.length > 0 && platform == "instagram" &&  (
              <button
                onClick={() => {setShowScheduleModal(true)}}
                disabled={schedulingInstagramCarousel}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {schedulingInstagramCarousel ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    <span>Scheduling...</span>
                  </>
                ) : (
                  <>
                    <Instagram className="h-5 w-5" />
                    <span className='capitalize'>Schedule</span>
                  </>
                )}
              </button>
            )}
             {slides.length > 0 && platform == "linkedin" &&  (
              <button
                onClick={handleLinkedinExport}
                disabled={postingOnLinkedin}
                className="flex-1 bg-[#1E40AF] hover:bg-[#2753e6]  text-[#FFFFFF] px-4 py-2 rounded-lg flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {postingOnLinkedin ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <Linkedin className="h-5 w-5" />
                    <span className='capitalize'>Post</span>
                  </>
                )}
              </button>
            )}
            {slides.length > 0 && platform == "linkedin" &&  (
              <button
                onClick={() => {setShowScheduleModal(true ) }}
                disabled={postingOnLinkedin}
                className="flex-1 bg-[#1E40AF] hover:bg-[#2753e6]  text-[#FFFFFF] px-4 py-2 rounded-lg flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {postingOnLinkedin ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    <span>Scheduling...</span>
                  </>
                ) : (
                  <>
                    <Linkedin className="h-5 w-5" />
                    <span className='capitalize'>Schedule</span>
                  </>
                )}
              </button>
            )}
          </div>

          {error && (
            <div className="bg-red-900 text-white px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Preview and Editor sections */}
      {slides.length > 0 && (
        <div  className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Preview & Edit</h2>
          
          {/* Slides Container - Displays All Slides */}
  <div className="flex flex-col gap-4 w-full">
    {slides.map((slide, index) => (
      <div
        onClick={() => {setCurrentSlide(index)}}
        id = {`slide-${index}`}
        key={slide.id}
        className={`${currentSlide == index ?"border-2" : ""} carousel-slide flex flex-col items-center justify-between p-4 rounded-lg shadow-lg w-full `}
        style={{
          backgroundColor: slide.backgroundColor,
          color: slide.textColor,
          backgroundImage: slide.backgroundColor.includes('gradient') ? slide.backgroundColor : undefined,
          minHeight: 'auto', 
          height: 'auto', 
          overflow: 'visible',
          paddingBottom: '20px'
        }}
      >
        {/* Brand Logo */}
        {brandLogo && (
          <img src={brandLogo} alt="Brand logo" className="h-16 object-contain mb-4" />
        )}

        {/* Slide Image */}
        {slide.image && (
          <img
            className="rounded-sm w-full h-auto max-h-[500px] object-cover mx-auto"
            src={slide?.image}
            alt="alternate text"
          />
        )}

        {/* Slide Content */}
        <div className=" flex flex-col items-center justify-center space-y-2 w-full gap-2 my-10 px-20">
          <h2
            style={{ fontFamily: slide.headerFont, fontSize: slide.headerSize }}
            className="text-center font-bold flex items-center space-x-2 w-full"
          >
            <span>{slide.emoji}</span>
            <input
              className="text-center bg-transparent border-none outline-none w-full"
              type="text"
              value={slide.header}
              onChange={(e) => updateSlide(slide.id, { header: e.target.value })}
            />
          </h2>

          <div
            contentEditable="true"
            suppressContentEditableWarning={true}
            style={{
                width: '100%',
                minHeight: '40px',
                height: 'auto',
                maxWidth: '100%',
                overflowWrap: 'break-word', 
                wordBreak: 'break-word', 
                whiteSpace: 'pre-wrap',
                padding: '5px',
               
                outline: 'none',
                textAlign: 'center',
    }}
    className="bg-transparent text-xl"
    onChange={(e) => updateSlide(slide.id, { content:e.target.value })} // Updates state on change
>
    {slide.content}
</div>
        </div>

        {/* Footer */}
        <div className="w-full flex justify-between items-center text-sm opacity-75">
          <div>Created by {profile?.full_name || 'User'}</div>
          {linkedinProfile && <div>{linkedinProfile.replace('https://linkedin.com/in/', '@')}</div>}
        </div>
      </div>
    ))}
  </div>

          {/* Slide Editor  */}
          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Theme
              </label>
           <div className="grid grid-cols-4 gap-2">
                {themes.map((theme, index) => (
                  <button
                    key={index}
                    onClick={() => updateSlide(slides[currentSlide].id, {
                      backgroundColor: theme.bg,
                      textColor: theme.text
                    })}
                    className="h-10 rounded-lg cursor-pointer  border-transparent hover:border-purple-500 transition-colors"
                    style={{
                      background: theme.bg,
                      backgroundImage: theme.bg.includes('gradient') ? theme.bg : undefined,
                      minHeight: 'auto', 
                      padding: '20px', 
                      breakInside: 'avoid',
                    }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Emoji
              </label>
              <div className="flex flex-wrap gap-2">
                {emojis.map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => updateSlide(slides[currentSlide].id, { emoji })}
                    className="w-10 h-10 flex items-center justify-center bg-gray-700 rounded-lg hover:bg-gray-600 text-xl"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Bullet Style
              </label>
              <div className="flex flex-wrap gap-2">
                {icons.map((icon, index) => (
                  <button
                    key={index}
                    onClick={() => updateSlide(slides[currentSlide].id, { icon })}
                    className="w-10 h-10 flex items-center justify-center bg-gray-700 rounded-lg hover:bg-gray-600 text-xl"
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Font Style
              </label>
              <div className="grid grid-cols-2 gap-2">
                {fonts.map((font, index) => (
                  <button
                    key={index}
                    onClick={() => updateSlide(slides[currentSlide].id, {
                      headerFont: font.name,
                      contentFont: font.name
                    })}
                    className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 text-white text-left"
                    style={{ fontFamily: font.name }}
                  >
                    {font.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
       {showScheduleModal && (
              <ScheduleModal
                plan={{
                  id: '',
                  profile_id: '',
                  platform,
                  format: 'text',
                  topic,
                  suggestion: '',
                  status: 'pending',
                  scheduled_for: new Date().toISOString(),
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }}
                onSchedule={platform ==  "instagram" ? handleScheduleCarouselOnInstagram : handleScheduleCarouselOnLinkedin}
                onClose={() => setShowScheduleModal(false)}
              />
            )}
    </div>
  );
}