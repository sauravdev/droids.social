import React, { useState, useEffect } from "react";
import {
  Twitter,
  Linkedin,
  Instagram,
  FileText,
  Download,
  Loader,
  Image as ImageIcon,
  Edit2,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Upload,
  Sparkles,
} from "lucide-react";
import { generatePost, generateTopics, generateTopicsUsingGrok } from "../lib/openai";
import { generateImage } from "../lib/openai";
import { supabase } from "../lib/supabase";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker?url";
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
import { useProfile } from "../hooks/useProfile";
import { getSocialMediaAccountInfo } from "../lib/api";
import { ScheduleModal } from "../components/ScheduleModal";
import { useScheduledPosts } from "../hooks/useScheduledPosts";
import { BACKEND_APIPATH } from "../constants";
import Editor from "../components/Editor";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

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
  isCustomImage?: boolean;
}

const defaultSlideStyle = {
  backgroundColor: "#1F2937",
  textColor: "#FFFFFF",
  headerFont: "Inter",
  contentFont: "Inter",
  headerSize: "32px",
  contentSize: "24px",
  emoji: "",
  icon: "",
};

const fonts = [
  { name: "Inter", label: "Inter (Modern)" },
  { name: "Georgia", label: "Georgia (Elegant)" },
  { name: "Arial", label: "Arial (Clean)" },
  { name: "Verdana", label: "Verdana (Readable)" },
  { name: "Trebuchet MS", label: "Trebuchet MS (Professional)" },
];

const emojis = ["🚀", "💡", "✨", "🎯", "📈", "🔥", "💪", "🌟", "⭐️", "🏆"];
const icons = ["✓", "→", "•", "◆", "★", "○", "□", "△", "▷", "◎"];

const themes = [
  { name: "Midnight Blue", bg: "#0F172A", text: "#FFFFFF" },
  { name: "Cherry Red", bg: "#7F1D1D", text: "#FFFFFF" },
  { name: "Teal Accent", bg: "#0F766E", text: "#FFFFFF" },
  { name: "Golden Amber", bg: "#92400E", text: "#FFFFFF" },
  { name: "Lavender Calm", bg: "#6B21A8", text: "#FFFFFF" },
  { name: "Slate Gray", bg: "#334155", text: "#FFFFFF" },
  { name: "Mint Fresh", bg: "#065F46", text: "#FFFFFF" },
  { name: "Soft Beige", bg: "#F5F5DC", text: "#2D3748" },
  { name: "Charcoal Dark", bg: "#1E1E1E", text: "#E2E8F0" },
  { name: "Rose Pink", bg: "#9D174D", text: "#FFFFFF" },
];

interface Success {
  state: boolean;
  message: string;
}

function CarouselGenerator() {
  const { profile, updateProfile } = useProfile();
  const { createPost } = useScheduledPosts();
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState<"linkedin" | "instagram">(
    "linkedin"
  );
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brandLogo, setBrandLogo] = useState<string | null>(null);
  const [linkedinProfile, setLinkedinProfile] = useState<string>("");
  const [postingOnInsta, setPostingOnInsta] = useState<boolean>(false);
  const [postingOnLinkedin, setPostingOnLinkedIn] = useState<boolean>(false);
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);
  const [loadingTopics, setLoadingTopics] = useState<boolean>(false);
  const [schedulingInstagramCarousel, setSchedulingInstagramCarousel] =
    useState<boolean>(false);
  const [generatedCaption, setGeneratedCaption] = useState<string>("");
  const {
    setRefreshHeader,
    carouselGeneratedTopics,
    setCarouselGeneratedTopics,
    selectedModel
  } = useAuth();
  const [success, setSuccess] = useState<Success>({
    state: false,
    message: "",
  });
  const navigateTo = useNavigate();
  const [createdByText, setCreatedByText] = useState("Created by");
  const [authorName, setAuthorName] = useState(profile?.full_name || "User");
  
  // Add state to track window width for responsive updates
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Add useEffect to handle window resize events
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    
    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleCreatedByChange = (e) => {
    setCreatedByText(e.target.textContent);
  };

  const handleAuthorNameChange = (e) => {
    setAuthorName(e.target.textContent);
  };

  const handleGenerateTopics = async (topic: string, platform: string) => {
    console.log("topic generation called ... ");
    setSuccess({ state: false, message: "" });
    if (profile?.tokens - 10 < 0) {
      setError("You do not have enough tokens for post generation ..");
      navigateTo("/pricing");
      return;
    }

    if (!topic) {
      setError("Please enter a topic");
      return;
    }

    setLoadingTopics(true);
    setError(null);
    setCarouselGeneratedTopics([]);

    let suggestion = "";
    try {
      if (selectedModel == "grok") {
        suggestion = await generateTopicsUsingGrok(topic, platform);
        // setGeneratedContent(suggestion);
      } else if (selectedModel == "openai") {
        suggestion = await generateTopics(topic, platform);
        // setGeneratedContent(suggestion);
      }
      const topics = JSON.parse(suggestion) || [];
      setCarouselGeneratedTopics(topics || []);
     
      if (profile?.tokens - 10 >= 0) {
        await updateProfile({ tokens: profile?.tokens - 10 });
        setRefreshHeader((prev) => !prev);
      }
      
    } catch (err: any) {
      setError("Something went wrong !. Please try again");
    } finally {
      setLoadingTopics(false);
      
    }
  };

  const removeToast = () => {
    setTimeout(() => {
      setSuccess({ state: false, message: "" });
    }, 3000);
  };

  const handleBrandLogoUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
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
    setSlides((prevSlides) =>
      prevSlides.map((slide) =>
        slide.id === id ? { ...slide, ...updates } : slide
      )
    );
  };

  // Create a hidden slide element optimized for PDF export
  const createPDFSlideElement = (slide: CarouselSlide, index: number): HTMLElement => {
    const slideElement = document.createElement('div');
    slideElement.className = 'pdf-slide';
    slideElement.style.cssText = `
      width: 1080px !important;
      height: 1350px !important;
      min-height: 1350px !important;
      max-height: 1350px !important;
      padding: 24px !important;
      margin: 0 !important;
      box-sizing: border-box !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: space-between !important;
      background-color: ${slide.backgroundColor} !important;
      color: ${slide.textColor} !important;
      overflow: hidden !important;
      position: absolute !important;
      top: -9999px !important;
      left: -9999px !important;
      font-family: ${slide.contentFont} !important;
    `;

    // Image container
    if (slide.image) {
      const imageContainer = document.createElement('div');
      imageContainer.style.cssText = `
        width: 100% !important;
        max-width: 1032px !important;
        height: auto !important;
        max-height: 600px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        margin: 0 auto !important;
        border-radius: 8px !important;
        overflow: hidden !important;
      `;
      
      const img = document.createElement('img');
      img.src = slide.image;
      img.alt = 'Slide image';
      img.style.cssText = `
        width: 100% !important;
        height: auto !important;
        max-height: 600px !important;
        object-fit: cover !important;
        border-radius: 8px !important;
      `;
      
      imageContainer.appendChild(img);
      slideElement.appendChild(imageContainer);
    }

    // Content container
    const contentContainer = document.createElement('div');
    contentContainer.style.cssText = `
      flex: 1 !important;
      width: 100% !important;
      max-width: 900px !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 20px !important;
      margin: 40px 0 !important;
      padding: 0 60px !important;
      box-sizing: border-box !important;
    `;

    // Header
    const header = document.createElement('h2');
    header.style.cssText = `
      font-family: ${slide.headerFont} !important;
      font-size: 36px !important;
      font-weight: bold !important;
      line-height: 1.4 !important;
      letter-spacing: 0.5px !important;
      text-align: center !important;
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      color: ${slide.textColor} !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 8px !important;
      word-wrap: break-word !important;
      overflow-wrap: break-word !important;
    `;

    if (slide.emoji) {
      const emojiSpan = document.createElement('span');
      emojiSpan.textContent = slide.emoji;
      emojiSpan.style.cssText = `
        font-size: 36px !important;
        line-height: 1 !important;
        flex-shrink: 0 !important;
      `;
      header.appendChild(emojiSpan);
    }

    const headerText = document.createElement('span');
    headerText.textContent = slide.header;
    headerText.style.cssText = `
      flex: 1 !important;
      text-align: center !important;
      color: ${slide.textColor} !important;
      font-family: ${slide.headerFont} !important;
      font-size: 36px !important;
      font-weight: bold !important;
      line-height: 1.4 !important;
      letter-spacing: 0.5px !important;
      word-wrap: break-word !important;
      overflow-wrap: break-word !important;
    `;
    header.appendChild(headerText);

    // Content text
    const contentText = document.createElement('div');
    contentText.textContent = slide.content;
    contentText.style.cssText = `
      width: 100% !important;
      max-width: 100% !important;
      min-height: 120px !important;
      font-family: ${slide.contentFont} !important;
      font-size: 28px !important;
      line-height: 1.6 !important;
      letter-spacing: 0.5px !important;
      text-align: center !important;
      padding: 20px !important;
      margin: 0 !important;
      color: ${slide.textColor} !important;
      word-wrap: break-word !important;
      overflow-wrap: break-word !important;
      box-sizing: border-box !important;
    `;

    contentContainer.appendChild(header);
    contentContainer.appendChild(contentText);
    slideElement.appendChild(contentContainer);

    // Footer
    const footer = document.createElement('div');
    footer.style.cssText = `
      width: 100% !important;
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      padding: 0 20px !important;
      margin-top: auto !important;
      font-size: 18px !important;
      opacity: 0.8 !important;
      flex-shrink: 0 !important;
    `;

    // Logo container
    const logoContainer = document.createElement('div');
    logoContainer.style.cssText = `
      width: 120px !important;
      height: 80px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      flex-shrink: 0 !important;
    `;

    if (brandLogo) {
      const logo = document.createElement('img');
      logo.src = brandLogo;
      logo.alt = 'Brand logo';
      logo.style.cssText = `
        max-width: 100% !important;
        max-height: 100% !important;
        object-fit: contain !important;
      `;
      logoContainer.appendChild(logo);
    }

    // Author section
    const authorSection = document.createElement('div');
    authorSection.style.cssText = `
      font-size: 18px !important;
      color: ${slide.textColor} !important;
      flex-shrink: 0 !important;
      text-align: right !important;
    `;

    const authorText = `${createdByText} `;
    const authorSpan = document.createElement('span');
    authorSpan.textContent = authorText;

    if (linkedinProfile) {
      const link = document.createElement('a');
      link.href = linkedinProfile;
      link.textContent = authorName;
      link.style.cssText = `
        color: #3B82F6 !important;
        text-decoration: underline !important;
        font-size: 18px !important;
      `;
      authorSection.appendChild(authorSpan);
      authorSection.appendChild(link);
    } else {
      const nameSpan = document.createElement('span');
      nameSpan.textContent = authorName;
      authorSection.appendChild(authorSpan);
      authorSection.appendChild(nameSpan);
    }

    footer.appendChild(logoContainer);
    footer.appendChild(authorSection);
    slideElement.appendChild(footer);

    return slideElement;
  };

  const generateCarousel = async () => {
    if (profile?.tokens - 10 < 0) {
      setError("You do not have enough tokens for carousel generation ..");
      navigateTo("/pricing");
      return;
    }
    if (!topic) {
      setError("Please enter a topic");
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const prompt = `Do latest internet search and create a high-quality, professional, informative carousel post about "${topic}" optimized for ${platform} (e.g., Instagram, LinkedIn), consisting of exactly 5 slides. Design it to be visually appealing, and engaging, using emojis to enhance tone and draw attention. Follow this structure:

Intro hero Slide: A bold, attention-grabbing headline that introduces the topic, paired with an emoji to set the mood.

Content Slide 1: One key core idea and insight about the topic which is informative and thought-provoking with some details.

Content Slide 2: Continuation of the first slide core idea with additional details and information.

Content Slide 3: Continuation of the second slide core idea with additional details and information.

Outro Slide: final strong insight, quote, or tip which is informative and little detailed and a summary with  call-to-action (e.g., "Follow for more," "Share your thoughts"), paired with an impactful emoji.

Guidelines:

Keep text concise (max 50-60 words per slide) to suit carousel readability.

Use platform-appropriate tone (e.g., professional for LinkedIn, casual for Instagram).

Select emojis that align with the topic and enhance emotional appeal.

Format the output as a JSON array of 5 objects, each containing:

header: The slide's headline (short and punchy)

content: The supporting text (detailed but little concise)

emoji: A single, relevant emoji as a string (e.g., "🚀")`;

      let content = await generatePost(prompt, platform);

      const generateImg = async (prompt: string) => {
        try {
          const imageURI = await generateImage(prompt);
          console.log("image generated = ", imageURI);
          try {
            const proxyUrl = `${
              BACKEND_APIPATH.BASEURL
            }/fetch-image?url=${encodeURIComponent(imageURI)}`;
            const response = await fetch(proxyUrl);
            const blob = await response.blob();
            const imageObjectUrl = URL.createObjectURL(blob);
            console.log("imageObjectURl = ", imageObjectUrl);
            return imageObjectUrl;
          } catch (err) {
            console.error("Error:", err.message);
            return null;
          }
        } catch (err) {
          console.log("Something went wrong while generating image ", err);
        }
      };

      let slideContents;
      try {
        if (typeof content == "string") {
          const regex = /^```json\s*([\s\S]*)\s*```$/;
          const match = content.match(regex);
          if (match) {
            content = match[1].trim();
          }
          slideContents = JSON.parse(content);
        } else {
          slideContents = content;
        }
      } catch (err) {
        console.log(err);
        slideContents = [];
        console.log("error parsing json");
        setGenerating(false);
        return;
      }
      while (slideContents.length <= 5) {
        slideContents.push({
          header: `Slide ${slideContents.length + 1}`,
          content: "Content here",
          emoji: emojis[slideContents.length % emojis.length],
        });
      }

      const newSlides = await Promise.all(
        slideContents.slice(0, 5).map(async (slide, index) => {
          const image = await generateImg(
            `Create an artistic, high-resolution illustration representing the concept: "${slide.header}", rooted in the broader theme of "${topic}". The artwork should evoke emotion and meaning through vivid color, strong composition, and symbolic visual storytelling.

Guidelines:
- Style: Cinematic and editorial; magazine-quality aesthetics
- Composition: Balanced, with a clear focal point and depth
- Visuals: Avoid all text, lettering, or symbols
- Color: Rich, saturated tones with thoughtful contrast
- Details: Include metaphorical or symbolic elements that reflect "${slide.header}"

Do **not** include watermarks, logos, or text overlays. Make the image visually striking and contextually aligned with the theme "${topic}".`
          );

          return {
            id: `slide-${index}`,
            header: slide.header || `Slide ${index + 1}`,
            content: slide.content || "Content here",
            emoji: slide.emoji || emojis[index % emojis.length],
            icon: icons[index % icons.length],
            image: image,
            ...defaultSlideStyle,
            ...themes[index % themes.length],
            isCustomImage: false,
          };
        })
      );
      console.log(newSlides);
      const caption = await generatePost(topic, platform);
      setGeneratedCaption(caption);
      setSlides(newSlides);
      setCurrentSlide(0);
      if (profile?.tokens - 10 >= 0) {
        await updateProfile({ tokens: profile?.tokens - 10 });
        setRefreshHeader((prev) => !prev);
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate carousel content");
    } finally {
      setGenerating(false);
    }
  };

  async function uploadToSupabase(
    imageData: File | Blob,
    fileName: string
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase.storage
        .from("profile-images")
        .upload(fileName, imageData, {
          cacheControl: "3600",
          upsert: true,
          contentType: imageData.type || "image/jpeg",
        });

      if (error) {
        console.error("Error uploading to Supabase:", error);
        return null;
      }
      const { data: urlData } = supabase.storage
        .from("profile-images")
        .getPublicUrl(fileName);

      return urlData?.publicUrl ?? null;
    } catch (err) {
      console.log("error  = ", err);
    }
  }

  const convertPDFToImages = async (pdfUrl) => {
    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    const pdf = await loadingTask.promise;
    const images = [];
    const imageUrls = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };
      await page.render(renderContext).promise;
      images.push(canvas.toDataURL("image/jpeg"));

      const imgData = canvas.toDataURL("image/jpeg");
      const imgBlob = await (await fetch(imgData)).blob();
      const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "");
      const fileName = `Uploads/Dalle-slide-${timestamp}-${i}.jpeg`;
      const publicUrl = await uploadToSupabase(imgBlob, fileName);
      if (publicUrl) {
        console.log(
          `Image for page ${i} uploaded successfully! Public URL: ${publicUrl}`
        );
        imageUrls.push(publicUrl);
      }
    }
    console.log("public images url = ", imageUrls);
    console.log("image urls = ", imageUrls);

    return { imageUrls };
  };

  const exportToPDF = async () => {
    setSuccess({ state: false, message: "" });
    if (slides.length === 0) {
      setError("No slides to export");
      return;
    }

    setExporting(true);
    setError(null);

    try {
      // Set PDF dimensions to match Instagram/LinkedIn carousel aspect ratio (1080x1350)
      const pdf = new jsPDF("p", "px", [1080, 1350]);
      const tempElements: HTMLElement[] = [];

      for (let i = 0; i < slides.length; i++) {
        // Create a temporary PDF-optimized slide element
        const tempSlide = createPDFSlideElement(slides[i], i);
        document.body.appendChild(tempSlide);
        tempElements.push(tempSlide);

        // Wait for images to load
        const images = tempSlide.getElementsByTagName('img');
        if (images.length > 0) {
          await Promise.all(Array.from(images).map(img => {
            return new Promise((resolve) => {
              if (img.complete) {
                resolve(null);
              } else {
                img.onload = () => resolve(null);
                img.onerror = () => resolve(null);
              }
            });
          }));
        }

        // Create high-quality canvas with consistent settings
        const canvas = await html2canvas(tempSlide, {
          scale: 2, // Good balance between quality and performance
          width: 1080,
          height: 1350,
          backgroundColor: slides[i].backgroundColor,
          logging: false,
          useCORS: true,
          allowTaint: true,
          removeContainer: false,
          foreignObjectRendering: false,
        });

        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        
        if (i > 0) pdf.addPage([1080, 1350], "p");
        pdf.addImage(imgData, "JPEG", 0, 0, 1080, 1350, undefined, "FAST");

        // Add clickable link overlay if LinkedIn profile exists
        if (linkedinProfile) {
          const linkRect = {
            x: 750, // Approximate position of author name
            y: 1280,
            width: 300,
            height: 30
          };
          pdf.link(linkRect.x, linkRect.y, linkRect.width, linkRect.height, { url: linkedinProfile });
        }
      }

      // Clean up temporary elements
      tempElements.forEach(element => {
        document.body.removeChild(element);
      });

      const pdfBlob = pdf.output("blob");
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const downloadLink = document.createElement("a");
      downloadLink.href = pdfUrl;
      downloadLink.download = `${topic.replace(/[^a-zA-Z0-9]/g, '_')}_carousel.pdf`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      // Clean up
      URL.revokeObjectURL(pdfUrl);
      
      setSuccess({ state: true, message: "PDF Downloaded successfully !!" });
      removeToast();
    } catch (err) {
      setError("Error exporting to PDF: " + (err?.message || "Unknown error"));
    } finally {
      setExporting(false);
    }
  };

  const handleInstagramExport = async () => {
    setSuccess({ state: false, message: "" });
    if (slides.length === 0) {
      setError("No slides to export");
      return;
    }
    setPostingOnInsta(true);
    setError(null);
    try {
      const pdf = new jsPDF("p", "px", [1080, 1350]);
      const tempElements: HTMLElement[] = [];

      for (let i = 0; i < slides.length; i++) {
        const tempSlide = createPDFSlideElement(slides[i], i);
        document.body.appendChild(tempSlide);
        tempElements.push(tempSlide);

        // Wait for images to load
        const images = tempSlide.getElementsByTagName('img');
        if (images.length > 0) {
          await Promise.all(Array.from(images).map(img => {
            return new Promise((resolve) => {
              if (img.complete) {
                resolve(null);
              } else {
                img.onload = () => resolve(null);
                img.onerror = () => resolve(null);
              }
            });
          }));
        }

        const canvas = await html2canvas(tempSlide, {
          scale: 2,
          width: 1080,
          height: 1350,
          backgroundColor: slides[i].backgroundColor,
          logging: false,
          useCORS: true,
          allowTaint: true,
          removeContainer: false,
          foreignObjectRendering: false,
        });

        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        if (i > 0) pdf.addPage([1080, 1350], "p");
        pdf.addImage(imgData, "JPEG", 0, 0, 1080, 1350, undefined, "FAST");
      }

      // Clean up temporary elements
      tempElements.forEach(element => {
        document.body.removeChild(element);
      });

      const pdfBlob = pdf.output("blob");
      console.log("pdf blob", pdfBlob);
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const { imageUrls } = await convertPDFToImages(pdfUrl);
      try {
        const accountInfo = await getSocialMediaAccountInfo("instagram");
        const { access_token, userId } = accountInfo;
        const response = await fetch(
          `${BACKEND_APIPATH.BASEURL}/publish/carousel/instagram`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              imageUrls,
              userId,
              caption: generatedCaption,
            }),
          }
        );
        const data = await response.json();
        console.log("response from insta carousel api = ", data);
      } catch (err: any) {
        console.log(
          "Something went wrong while publishing carousel ",
          err || err?.message
        );
      }
      setSuccess({ state: true, message: "Content scheduled successfully" });
      removeToast();
    } catch (error: any) {
      console.log("Something went wrong = ", error || error?.message);
    } finally {
      setPostingOnInsta(false);
    }
  };

  const handleScheduleCarouselOnInstagram = async (
    date: string,
    postId: null | string = null
  ) => {
    setSchedulingInstagramCarousel(true);
    setSuccess({ state: false, message: "" });
    if (slides.length === 0) {
      setError("No slides to export");
      return;
    }
    setError(null);
    try {
      const pdf = new jsPDF("p", "px", [1080, 1350]);
      const tempElements: HTMLElement[] = [];

      for (let i = 0; i < slides.length; i++) {
        const tempSlide = createPDFSlideElement(slides[i], i);
        document.body.appendChild(tempSlide);
        tempElements.push(tempSlide);

        // Wait for images to load
        const images = tempSlide.getElementsByTagName('img');
        if (images.length > 0) {
          await Promise.all(Array.from(images).map(img => {
            return new Promise((resolve) => {
              if (img.complete) {
                resolve(null);
              } else {
                img.onload = () => resolve(null);
                img.onerror = () => resolve(null);
              }
            });
          }));
        }

        const canvas = await html2canvas(tempSlide, {
          scale: 2,
          width: 1080,
          height: 1350,
          backgroundColor: slides[i].backgroundColor,
          logging: false,
          useCORS: true,
          allowTaint: true,
          removeContainer: false,
          foreignObjectRendering: false,
        });

        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        if (i > 0) pdf.addPage([1080, 1350], "p");
        pdf.addImage(imgData, "JPEG", 0, 0, 1080, 1350, undefined, "FAST");
      }

      // Clean up temporary elements
      tempElements.forEach(element => {
        document.body.removeChild(element);
      });

      const pdfBlob = pdf.output("blob");
      console.log("pdf blob", pdfBlob);
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const { imageUrls } = await convertPDFToImages(pdfUrl);
      const accountInfo = await getSocialMediaAccountInfo("instagram");
      const { access_token, userId } = accountInfo;
      if (!postId) {
        const post = {
          platform: platform,
          content: generatedCaption,
          media_urls: imageUrls,
          scheduled_for: date,
          status: "pending",
        };
        const createdPost = await createPost(post);
        console.log("createdPost (in instagram) = ", createdPost);
        const response = await fetch(
          `${BACKEND_APIPATH.BASEURL}/schedule/carousel/instagram`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              imageUrls,
              userId,
              date: date,
              caption: generatedCaption,
              jobId: createdPost?.id,
            }),
          }
        );
        const data = await response.json();
        console.log("scheduled insta post api ", data);
      }

      setSuccess({ state: true, message: "Content scheduled successfully !!" });
      removeToast();
    } catch (error: any) {
      setError(error?.message);
      console.log(
        "Something went wrong while scheduling carousel post for instagram => ",
        error || error?.message
      );
    } finally {
      setSchedulingInstagramCarousel(false);
    }
  };

  const handleScheduleCarouselOnLinkedin = (
    date: string,
    postId: null | string = null
  ) => {};

  const handleLinkedinExport = async () => {
    setPostingOnLinkedIn(true);
    await exportToPDF();
    setPostingOnLinkedIn(false);
  };

  // Helper function to get responsive styles for preview - now uses windowWidth state
  const getResponsiveStyles = () => {
    const isMobile = windowWidth < 768;
    const isTablet = windowWidth < 1024;
    
    return {
      slideWidth: isMobile ? "100%" : isTablet ? "600px" : "800px",
      slideHeight: isMobile ? "auto" : "auto",
      headerSize: isMobile ? "18px" : isTablet ? "24px" : "28px",
      contentSize: isMobile ? "14px" : isTablet ? "16px" : "18px",
      imagePadding: isMobile ? "8px" : "12px",
      imageMaxHeight: isMobile ? "200px" : isTablet ? "300px" : "400px",
      footerSize: isMobile ? "12px" : "14px",
    };
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-white mb-8">Carousel Generator</h1>

      {/* Generator Form */}
      <div className="bg-gray-800 rounded-xl p-6">
        <div className="space-y-6">
          <div>
            <label
              htmlFor="topic"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
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

          {Array.isArray(carouselGeneratedTopics) &&
                carouselGeneratedTopics?.length > 0 && (
                  <div className="flex flex-col  gap-2 items-start flex-wrap ">
                    <h1 className="text-sm font-medium text-gray-300">
                      Select a topic below based on your above niche
                    </h1>
                    <div className="flex gap-2 items-start flex-wrap">
                      {carouselGeneratedTopics.map((item: string, index: number) => {
                        return (
                          <button
                            disabled={generating || loadingTopics }
                          
                            title={item}
                            className={`${(generating || loadingTopics) ? "cursor-not-allowed" : "cursor-pointer"} ${
                              topic === item
                                ? "bg-purple-600 text-white"
                                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                            } px-3 py-1 rounded-full text-xs sm:text-sm transition-colors`}
                            onClick={() => {
                              setTopic(item);
                            }}
                            key={index}
                          >
                            {item?.length > 40
                              ? item.substring(0, 40) + "..."
                              : item}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Platform
            </label>
            <div className="flex space-x-4">
              <button
                disabled={generating || loadingTopics }
                onClick={() => setPlatform("linkedin")}
                className={`px-4 py-2 rounded-lg ${(generating || loadingTopics) ? "cursor-not-allowed" : "cursor-pointer"} ${
                  platform === "linkedin"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                LinkedIn
              </button>
              <button
                disabled={generating || loadingTopics }
                onClick={() => setPlatform("instagram")}
                className={`px-4 py-2 rounded-lg  ${(generating || loadingTopics) ? "cursor-not-allowed" : "cursor-pointer"}  ${
                  platform === "instagram"
                    ? "bg-pink-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
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

          {platform == "linkedin" && (
            <div>
              <label
                htmlFor="linkedin"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
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
          )}

          <div className="flex flex-col items-start  w-full space-y-4 md:space-y-0  md:flex md:flex-row md:space-x-4">
          <button
              onClick={() => {handleGenerateTopics(topic , platform )}}
              disabled={generating || loadingTopics || !topic}
              className={`w-full flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 disabled:opacity-50 ${(generating || loadingTopics || !topic) ? "cursor-not-allowed" : "cursor-pointer"  }`}
            >
              {loadingTopics ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  <span>Generate Topics</span>
                </>
              )}
            </button>
            <button
              onClick={generateCarousel}
              disabled={loadingTopics || generating || !topic}
              className={` w-full flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 disabled:opacity-50 ${(loadingTopics || generating || !topic) ? "cursor-not-allowed" : "cursor-pointer"}`}
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
                className="w-full flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 disabled:opacity-50"
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

            {slides.length > 0 && platform == "instagram" && (
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
                    <span className="capitalize">Post</span>
                  </>
                )}
              </button>
            )}
            {slides.length > 0 && platform == "instagram" && (
              <button
                onClick={() => setShowScheduleModal(true)}
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
                    <span className="capitalize">Schedule</span>
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

          {success.state && (
            <div className="bg-green-600 text-white px-3 py-2 sm:px-4 rounded-md text-sm">
              {success.message}
            </div>
          )}
        </div>
      </div>

      {/* Preview and Editor sections */}
      {slides.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-3 sm:p-6 sm:px-12 lg:px-24">
          <h2 className="text-xl font-bold text-white mb-4">Preview & Edit</h2>
          <div className="flex flex-col gap-4 w-full max-w-4xl mx-auto">
            {slides.map((slide, index) => {
              const responsiveStyles = getResponsiveStyles();
              return (
                <div
                  onClick={() => setCurrentSlide(index)}
                  id={`slide-${index}`}
                  key={slide.id}
                  className={`${
                    currentSlide == index ? "border-2 border-purple-500" : ""
                  } carousel-slide flex flex-col items-center justify-between p-3 sm:p-6 rounded-lg shadow-lg w-full mx-auto cursor-pointer transition-all duration-200`}
                  style={{
                    backgroundColor: slide.backgroundColor,
                    color: slide.textColor,
                    backgroundImage: slide.backgroundColor.includes("gradient")
                      ? slide.backgroundColor
                      : undefined,
                    width: responsiveStyles.slideWidth,
                    aspectRatio: "4/5",
                    minHeight: "300px",
                    boxSizing: "border-box",
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e: any) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          updateSlide(slide.id, {
                            image: reader.result as string,
                            isCustomImage: true,
                          });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                    id={`custom-image-upload-${slide.id}`}
                  />

                  {slide.image ? (
                    <label
                      htmlFor={`custom-image-upload-${slide.id}`}
                      className="block cursor-pointer w-full rounded-md relative"
                    >
                      <img
                        className="rounded-sm w-full h-auto object-cover mx-auto"
                        style={{ maxHeight: responsiveStyles.imageMaxHeight }}
                        src={slide?.image}
                        alt="Slide image"
                      />
                      {!slide.isCustomImage && (
                        <></>
                      )}
                    </label>
                  ) : (
                    <label
                      htmlFor={`custom-image-upload-${slide.id}`}
                      className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center justify-center w-full"
                      style={{ height: responsiveStyles.imageMaxHeight }}
                    >
                      Upload Image
                    </label>
                  )}

                  {/* Slide Content */}
                  <div className="flex flex-col items-center justify-center space-y-2 sm:space-y-4 w-full gap-2 sm:gap-4 my-4 sm:my-6 px-4 sm:px-8">
                    <h2
                      style={{
                        fontFamily: slide.headerFont,
                        fontSize: responsiveStyles.headerSize,
                        lineHeight: "1.4",
                        letterSpacing: "0.3px",
                      }}
                      className="text-center font-bold flex items-center space-x-1 sm:space-x-2 w-full"
                    >
                      <span style={{ fontSize: responsiveStyles.headerSize }}>{slide.emoji}</span>
                      <div
                        contentEditable="true"
                        suppressContentEditableWarning={true}
                        className="text-center bg-transparent outline-none w-full tracking-wide"
                        onBlur={(e) =>
                          updateSlide(slide.id, {
                            header: e.currentTarget.innerText,
                          })
                        }
                      >
                        {slide.header}
                      </div>
                    </h2>

                    <div
                      contentEditable
                      suppressContentEditableWarning
                      style={{
                        minHeight: windowWidth < 768 ? "40px" : "60px",
                        maxWidth: "100%",
                        wordBreak: "break-word",
                        overflowWrap: "break-word",
                        textAlign: "center",
                        outline: "none",
                        padding: responsiveStyles.imagePadding,
                        fontFamily: slide.contentFont,
                        fontSize: responsiveStyles.contentSize,
                        lineHeight: "1.5",
                        letterSpacing: "0.3px",
                      }}
                      className="editable-text tracking-wide bg-transparent"
                      onBlur={(e) =>
                        updateSlide(slide.id, {
                          content: e.currentTarget.innerText,
                        })
                      }
                    >
                      {slide.content}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="w-full flex items-center justify-between opacity-75 mt-auto pt-2">
                    <div className="flex items-center gap-2">
                      {brandLogo && (
                        <div
                          style={{
                            width: windowWidth < 768 ? "60px" : "80px",
                            height: windowWidth < 768 ? "40px" : "50px",
                            flexShrink: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "transparent",
                          }}
                        >
                          <img
                            src={brandLogo}
                            alt="Brand logo"
                            style={{
                              maxWidth: "100%",
                              maxHeight: "100%",
                              objectFit: "contain",
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="capitalize tracking-wide flex-shrink-0" style={{ fontSize: responsiveStyles.footerSize }}>
                      <span
                        contentEditable={true}
                        suppressContentEditableWarning={true}
                        className="outline-none focus:ring-1 focus:ring-blue-300 rounded px-1"
                        onBlur={handleCreatedByChange}
                      >
                        {createdByText}
                      </span>{" "}
                      {linkedinProfile ? (
                        <a
                          href={linkedinProfile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 underline cursor-pointer outline-none focus:ring-1 focus:ring-blue-300 rounded px-1"
                          style={{
                            color: "#60A5FA",
                            textDecoration: "underline",
                            fontSize: responsiveStyles.footerSize,
                          }}
                          contentEditable={true}
                          onBlur={handleAuthorNameChange}
                          suppressContentEditableWarning={true}
                        >
                          {authorName}
                        </a>
                      ) : (
                        <span
                          contentEditable={true}
                          suppressContentEditableWarning={true}
                          className="outline-none focus:ring-1 focus:ring-blue-300 rounded px-1"
                          onBlur={handleAuthorNameChange}
                        >
                          {authorName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {generatedCaption && (
            <div className="flex flex-col gap-4 my-4 w-full">
              <h2 className="capitalize text-2xl text-white">
                Caption For <span>{platform}</span>
              </h2>
              <Editor initialContent={generatedCaption} />
            </div>
          )}

          {/* Slide Editor */}
          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Theme
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {themes.map((theme, index) => (
                  <button
                    key={index}
                    onClick={() =>
                      updateSlide(slides[currentSlide].id, {
                        backgroundColor: theme.bg,
                        textColor: theme.text,
                      })
                    }
                    className="h-10 rounded-lg cursor-pointer border-transparent hover:border-purple-500 transition-colors"
                    style={{
                      background: theme.bg,
                      backgroundImage: theme.bg.includes("gradient")
                        ? theme.bg
                        : undefined,
                      minHeight: "auto",
                      padding: "20px",
                      breakInside: "avoid",
                    }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Emoji
              </label>
              <div className="grid grid-cols-5 sm:flex sm:flex-wrap gap-2">
                {emojis.map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() =>
                      updateSlide(slides[currentSlide].id, { emoji })
                    }
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
                    onClick={() =>
                      updateSlide(slides[currentSlide].id, { icon })
                    }
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
                    onClick={() =>
                      updateSlide(slides[currentSlide].id, {
                        headerFont: font.name,
                        contentFont: font.name,
                      })
                    }
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
            id: "",
            profile_id: "",
            platform,
            format: "text",
            topic,
            suggestion: "",
            status: "pending",
            scheduled_for: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }}
          onSchedule={
            platform == "instagram"
              ? handleScheduleCarouselOnInstagram
              : handleScheduleCarouselOnLinkedin
          }
          onClose={() => setShowScheduleModal(false)}
        />
      )}
    </div>
  );
}

export default CarouselGenerator;