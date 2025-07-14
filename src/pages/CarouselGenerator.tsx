import React, { useState } from "react";
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
import { generatePost } from "../lib/openai";
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
import { nonWhiteSpace } from "html2canvas/dist/types/css/syntax/parser";
import { overflowWrap } from "html2canvas/dist/types/css/property-descriptors/overflow-wrap";
import { textAlign } from "html2canvas/dist/types/css/property-descriptors/text-align";

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
  const [schedulingInstagramCarousel, setSchedulingInstagramCarousel] =
    useState<boolean>(false);
  const [generatedCaption, setGeneratedCaption] = useState<string>("");
  const { setRefreshHeader } = useAuth();
  const [success, setSuccess] = useState<Success>({
    state: false,
    message: "",
  });
  const navigateTo = useNavigate();

  const removeToast = () => {
    setTimeout(() => {
      setSuccess({ state: false, message: "" });
    }, 2500);
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
      const prompt = `Create a high-quality, professional carousel post about "${topic}" optimized for ${platform} (e.g., Instagram, LinkedIn), consisting of exactly 5 slides. Design it to be visually appealing, concise, and engaging, using emojis to enhance tone and draw attention. Follow this structure:

Intro Slide: A bold, attention-grabbing headline that introduces the topic, paired with an emoji to set the mood.

Content Slide 1: One key insight about the topic.

Content Slide 2: Another key insight or value-adding point.

Content Slide 3: A final strong insight, quote, or tip.

Outro Slide: A summary or call-to-action (e.g., "Follow for more," "Share your thoughts"), paired with an impactful emoji.

Guidelines:

Keep text concise (max 20 words per slide) to suit carousel readability.

Use platform-appropriate tone (e.g., professional for LinkedIn, casual for Instagram).

Select emojis that align with the topic and enhance emotional appeal.

Avoid overloading slides with multiple points—focus on one idea per slide.

Format the output as a JSON array of 5 objects, each containing:

header: The slide's headline (short and punchy)

content: The supporting text (detailed but concise)

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
            `An artistic, high-resolution illustration depicting ${slide.header}, inspired by the theme of ${topic}. The image should be vivid, meaningful, and emotionally engaging. Avoid any text, letters, or symbols. Focus on rich colors, balanced composition, and clear visual storytelling. Use a cinematic, editorial style.`
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

      // Convert canvas to image data URL
      const imgData = canvas.toDataURL("image/jpeg");
      const imgBlob = await (await fetch(imgData)).blob();
      const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "");
      const fileName = `uploads/Dalle-slide-${timestamp}-${i}.jpeg`;
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

  // const exportToPDF = async () => {
  //   setSuccess({ state: false, message: "" });
  //   if (slides.length === 0) {
  //     setError("No slides to export");
  //     return;
  //   }

  //   setExporting(true);
  //   setError(null);

  //   try {
  //     const pdf = new jsPDF("p", "px", [1080, 1350]);
  //     const pdfPages = [];

  //     for (let i = 0; i < slides.length; i++) {
  //       const slide = document.getElementById(`slide-${i}`);
  //       if (!slide) continue;

  //       const canvas = await html2canvas(slide, {
  //         scale: 2,
  //         backgroundColor: slides[i].backgroundColor,
  //         logging: false,
  //         useCORS: true,
  //         // height: slide.clientHeight,
  //         // width: slide.clientWidth,
  //         // width: 1080,
  //         // height: 1350
  //       });

  //       const imgData = canvas.toDataURL("image/jpeg", 0.92);
  //       pdfPages.push(imgData);
  //       if (i > 0) pdf.addPage([1080, 1350], "p");
  //       pdf.addImage(imgData, "JPEG", 0, 0, 1080, 1350);
  //     }

  //     const pdfBlob = pdf.output("blob");
  //     console.log("pdf blob", pdfBlob);
  //     const pdfUrl = URL.createObjectURL(pdfBlob);
  //     const downloadLink = document.createElement("a");
  //     downloadLink.href = pdfUrl;
  //     downloadLink.download = "generated.pdf";
  //     downloadLink.textContent = "Download PDF";
  //     document.body.appendChild(downloadLink);
  //     downloadLink.click();
  //     setSuccess({ state: true, message: "PDF Downloaded successfully !!" });

  //     removeToast();
  //   } catch (err: any) {
  //     setError("Error exporting to PDF: " + (err?.message || "Unknown error"));
  //   } finally {
  //     setExporting(false);
  //   }
  // };

    const exportToPDF = async () => {
    setSuccess({ state: false, message: "" });
    if (slides.length === 0) {
      setError("No slides to export");
      return;
    }

    setExporting(true);
    setError(null);

    try {
      const pdf = new jsPDF("p", "px", [1080, 1350]);
      const pdfPages = [];

      for (let i = 0; i < slides.length; i++) {
        const slide = document.getElementById(`slide-${i}`);
        if (!slide) continue;

        const canvas = await html2canvas(slide, {
          scale: 2,
          backgroundColor: slides[i].backgroundColor,
          logging: false,
          useCORS: true,
        });

        const imgData = canvas.toDataURL("image/jpeg", 0.92);
        pdfPages.push(imgData);
        if (i > 0) pdf.addPage([1080, 1350], "p");
        pdf.addImage(imgData, "JPEG", 0, 0, 1080, 1350);

        // Add clickable link overlay
        const links = slide.querySelectorAll('a[href]');
        links.forEach(link => {
          const rect = link.getBoundingClientRect();
          const slideRect = slide.getBoundingClientRect();

          // Calculate relative position within the slide
          const x = (rect.left - slideRect.left) * (1080 / slideRect.width);
          const y = (rect.top - slideRect.top) * (1350 / slideRect.height);
          const width = rect.width * (1080 / slideRect.width);
          const height = rect.height * (1350 / slideRect.height);

          // Add clickable area to PDF
          pdf.link(x, y, width, height, { url: link.href });
        });
      }

      const pdfBlob = pdf.output("blob");
      console.log("pdf blob", pdfBlob);
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const downloadLink = document.createElement("a");
      downloadLink.href = pdfUrl;
      downloadLink.download = "generated.pdf";
      downloadLink.textContent = "Download PDF";
      document.body.appendChild(downloadLink);
      downloadLink.click();
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

        const imgData = canvas.toDataURL("image/jpeg");
        pdfPages.push(imgData);
        if (i > 0) pdf.addPage([1080, 1350], "p");
        pdf.addImage(imgData, "JPEG", 0, 0, 1080, 1350);
      }

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
      setSuccess({ state: true, message: "content scheduled successfully" });
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

        const imgData = canvas.toDataURL("image/jpeg");
        pdfPages.push(imgData);
        if (i > 0) pdf.addPage([1080, 1350], "p");
        pdf.addImage(imgData, "JPEG", 0, 0, 1080, 1350);
      }

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
    exportToPDF();
    setPostingOnLinkedIn(false);
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

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Platform
            </label>
            <div className="flex space-x-4">
              <button
                onClick={() => setPlatform("linkedin")}
                className={`px-4 py-2 rounded-lg ${
                  platform === "linkedin"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
              >
                LinkedIn
              </button>
              <button
                onClick={() => setPlatform("instagram")}
                className={`px-4 py-2 rounded-lg ${
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
                onClick={() => {
                  setShowScheduleModal(true);
                }}
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
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Preview & Edit</h2>
          <div className="flex flex-col gap-4 w-full">
            {slides.map((slide, index) => (
              <div
                onClick={() => {
                  setCurrentSlide(index);
                }}
                id={`slide-${index}`}
                key={slide.id}
                className={`${
                  currentSlide == index ? "border-2" : ""
                } carousel-slide flex flex-col items-center justify-between p-4 rounded-lg shadow-lg w-full `}
                style={{
                  backgroundColor: slide.backgroundColor,
                  color: slide.textColor,
                  backgroundImage: slide.backgroundColor.includes("gradient")
                    ? slide.backgroundColor
                    : undefined,
                  minHeight: "auto",
                  height: "auto",
                  overflow: "visible",
                  paddingBottom: "20px",
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
                        // Update the slide with the custom uploaded image
                        updateSlide(slide.id, {
                          image: reader.result as string,
                          isCustomImage: true,
                        });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden "
                  id={`custom-image-upload-${slide.id}`}
                />

                {slide.image ? (
                  <label
                    htmlFor={`custom-image-upload-${slide.id}`}
                    className="block cursor-pointer w-full"
                  >
                    <img
                      className="rounded-sm w-full h-auto max-h-[500px] object-cover mx-auto"
                      src={slide?.image}
                      alt="Slide image"
                    />
                    {!slide.isCustomImage && (
                      <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                        AI Generated
                      </div>
                    )}
                  </label>
                ) : (
                  <label
                    htmlFor={`custom-image-upload-${slide.id}`}
                    className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center justify-center h-[500px]"
                  >
                    Upload Image
                  </label>
                )}

                {/* Slide Content */}
                <div className=" flex flex-col items-center justify-center space-y-2 w-full gap-2 my-10 px-20">
                  <h2
                    style={{
                      fontFamily: slide.headerFont,
                      fontSize: slide.headerSize,
                    }}
                    className="text-center font-bold flex items-center space-x-2 w-full"
                  >
                    <span>{slide.emoji}</span>
                    <div
                      contentEditable="true"
                      className="text-center bg-transparent  outline-none w-full tracking-widest "
                      onChange={(e: any) =>
                        updateSlide(slide.id, { header: e.target.value })
                      }
                    >
                      {slide.header}
                    </div>
                  </h2>

                  {/* <div
                    contentEditable="true"
                    suppressContentEditableWarning={true}
                    style={{
                      width: "100%",
                      minHeight: "40px",
                      height: "auto",
                      maxWidth: "100%",
                      overflowWrap: "break-word",
                      wordBreak: "break-word",
                      whiteSpace: "pre-wrap",
                      padding: "5px",

                      outline: "none",
                      textAlign: "center",
                    }}
                    className="bg-transparent text-2xl tracking-wider font-medium text-white"
                    onChange={(e) =>
                      updateSlide(slide.id, { content: e.target.value })
                    } // Updates state on change
                  >
                    {slide.content}
                  </div> */}

                  <div
                    contentEditable
                    suppressContentEditableWarning
                    style={{
                      minHeight: "60px",
                      maxWidth: "100%",
                      wordBreak: "break-word",
                      overflowWrap: "break-word",
                      textAlign: "center",
                      outline: "none",
                      padding: "10px",
                    }}
                    className="editable-text tracking-widest bg-transparent text-white text-2xl font-medium"
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
                <div className="w-full flex items-center justify-between text-sm opacity-75">
                  {/* Logo - Extreme Left */}
                  <div className="flex items-center gap-2">
                    <div
                      style={{
                        width: "100px",
                        height: "64px",
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
                  </div>

                  {/* Created by - Extreme Right */}
                  <div className="capitalize tracking-widest flex-shrink-0">
                    Created by{" "}
                    <a
                      href={linkedinProfile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
                      style={{
                        color: "#2563eb",
                        textDecoration: "underline",
                        WebkitPrintColorAdjust: "exact",
                        colorAdjust: "exact",
                      }}
                    >
                      {profile?.full_name || "User"}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {generatedCaption && (
            <div className="flex flex-col gap-4 my-4 ">
              <h2 className="capitalize text-2xl text-white ">
                Caption For <span>{platform}</span>
              </h2>
              <Editor initialContent={generatedCaption} />
            </div>
          )}
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
                    onClick={() =>
                      updateSlide(slides[currentSlide].id, {
                        backgroundColor: theme.bg,
                        textColor: theme.text,
                      })
                    }
                    className="h-10 rounded-lg cursor-pointer  border-transparent hover:border-purple-500 transition-colors"
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
              <div className="flex flex-wrap gap-2">
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

export default CarouselGenerator ;