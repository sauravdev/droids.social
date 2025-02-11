import React, { useState } from 'react';
import { FileText, Download, Loader, Image as ImageIcon, Edit2, Plus, Trash2, ArrowLeft, ArrowRight, Upload, Sparkles } from 'lucide-react';
import { generatePost } from '../lib/openai';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useProfile } from '../hooks/useProfile';

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
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState<'linkedin' | 'instagram'>('linkedin');
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brandLogo, setBrandLogo] = useState<string | null>(null);
  const [linkedinProfile, setLinkedinProfile] = useState<string>('');

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
      const prompt = `Create a professional carousel post about "${topic}" for ${platform} with exactly 7 slides. Include emojis and make it engaging:

      1. Intro slide: Attention-grabbing headline with emoji
      2-5. Four content slides: Key points with relevant emojis
      6. Summary slide: Key takeaways with emoji
      7. Outro slide: Strong call-to-action with emoji
      
      Format as JSON array: [{"header": "headline", "content": "detailed text", "emoji": "relevant_emoji"}, ...]`;

      const content = await generatePost(topic, platform);
      
      let slideContents;
      try {
        slideContents = JSON.parse(content);
      } catch {
        // Fallback to basic format if JSON parsing fails
        const lines = content.split('\n').filter(line => line.trim());
        slideContents = lines.map((line, index) => ({
          header: 'Slide Header',
          content: line,
          emoji: emojis[index % emojis.length]
        }));
      }

      // Ensure we have all required slides
      while (slideContents.length < 7) {
        slideContents.push({
          header: `Slide ${slideContents.length + 1}`,
          content: 'Content here',
          emoji: emojis[slideContents.length % emojis.length]
        });
      }

      const newSlides = slideContents.slice(0, 7).map((slide, index) => ({
        id: `slide-${index}`,
        header: slide.header || `Slide ${index + 1}`,
        content: slide.content || 'Content here',
        emoji: slide.emoji || emojis[index % emojis.length],
        icon: icons[index % icons.length],
        ...defaultSlideStyle,
        ...themes[index % themes.length]
      }));

      setSlides(newSlides);
      setCurrentSlide(0);
    } catch (err: any) {
      setError(err.message || 'Failed to generate carousel content');
    } finally {
      setGenerating(false);
    }
  };

  const exportToPDF = async () => {
    if (slides.length === 0) {
      setError('No slides to export');
      return;
    }

    setExporting(true);
    setError(null);
    
    try {
      // Use Instagram aspect ratio (1080x1350)
      const pdf = new jsPDF('p', 'px', [1080, 1350]);
      
      for (let i = 0; i < slides.length; i++) {
        const slide = document.getElementById(`slide-${i}`);
        if (!slide) continue;

        const canvas = await html2canvas(slide, {
          scale: 2,
          backgroundColor: slides[i].backgroundColor,
          logging: false,
          useCORS: true,
          width: 1080,
          height: 1350
        });
        
        const imgData = canvas.toDataURL('image/png');
        if (i > 0) pdf.addPage([1080, 1350], 'p');
        
        // Add slide content
        pdf.addImage(imgData, 'PNG', 0, 0, 1080, 1350);
        
        // Add page number and branding
        pdf.setFontSize(12);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`${i + 1}/${slides.length}`, 1020, 1330);
        if (profile?.full_name) {
          pdf.text(`Created by ${profile.full_name}`, 40, 1330);
        }
        if (linkedinProfile) {
          pdf.text(linkedinProfile.replace('https://linkedin.com/in/', '@'), 40, 1310);
        }
      }
      
      pdf.save(`carousel-${platform}-${new Date().getTime()}.pdf`);
    } catch (err: any) {
      setError('Error exporting to PDF: ' + (err.message || 'Unknown error'));
    } finally {
      setExporting(false);
    }
  };

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
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Preview & Edit</h2>
          
          <div className="relative w-full" style={{ paddingBottom: '125%' }}> {/* 1080:1350 aspect ratio */}
            <div
              id={`slide-${currentSlide}`}
              className="absolute inset-0 flex flex-col items-center justify-between p-12"
              style={{
                backgroundColor: slides[currentSlide].backgroundColor,
                color: slides[currentSlide].textColor,
                backgroundImage: slides[currentSlide].backgroundColor.includes('gradient') ? slides[currentSlide].backgroundColor : undefined
              }}
            >
              {/* Brand Logo */}
              {brandLogo && (
                <img src={brandLogo} alt="Brand logo" className="h-16 object-contain mb-4" />
              )}
              
              {/* Slide Content */}
              <div className="flex-1 flex flex-col items-center justify-center space-y-8 w-full">
                <h2
                  style={{
                    fontFamily: slides[currentSlide].headerFont,
                    fontSize: slides[currentSlide].headerSize
                  }}
                  className="text-center font-bold flex items-center space-x-2"
                >
                  <span>{slides[currentSlide].emoji}</span>
                  <span>{slides[currentSlide].header}</span>
                </h2>
                <p
                  style={{
                    fontFamily: slides[currentSlide].contentFont,
                    fontSize: slides[currentSlide].contentSize
                  }}
                  className="text-center flex items-start space-x-2"
                >
                  <span className="text-2xl">{slides[currentSlide].icon}</span>
                  <span>{slides[currentSlide].content}</span>
                </p>
              </div>
              
              {/* Footer */}
              <div className="w-full flex justify-between items-center text-sm opacity-75">
                <div>Created by {profile?.full_name || 'User'}</div>
                {linkedinProfile && (
                  <div>{linkedinProfile.replace('https://linkedin.com/in/', '@')}</div>
                )}
              </div>
            </div>

            {/* Navigation Controls */}
            {currentSlide > 0 && (
              <button
                onClick={() => setCurrentSlide(prev => prev - 1)}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-75"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
            )}
            {currentSlide < slides.length - 1 && (
              <button
                onClick={() => setCurrentSlide(prev => prev + 1)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-75"
              >
                <ArrowRight className="h-6 w-6" />
              </button>
            )}

            {/* Slide Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black bg-opacity-50 px-3 py-1 rounded-full">
              <span className="text-white text-sm">
                {currentSlide + 1} / {slides.length}
              </span>
            </div>
          </div>

          {/* Slide Editor */}
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
                    className="h-10 rounded-lg cursor-pointer border-2 border-transparent hover:border-purple-500 transition-colors"
                    style={{
                      background: theme.bg,
                      backgroundImage: theme.bg.includes('gradient') ? theme.bg : undefined
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
    </div>
  );
}