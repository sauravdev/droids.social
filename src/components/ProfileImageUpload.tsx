import React, { useState } from 'react';
import { Camera, Loader, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ProfileImageUploadProps {
  currentUrl: string | null;
  onUpload: (url: string) => Promise<void>;
  type: 'avatar' | 'banner';
}

export function ProfileImageUpload({ currentUrl, onUpload, type }: ProfileImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDownloadConfirm, setShowDownloadConfirm] = useState(false);
  const [showChangeOptions, setShowChangeOptions] = useState(false);
  
  const uploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      setError(null);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }
      
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `uploads/${fileName}`;
      // Upload image to Supabase Storage
      console.log("file path uploading = ", filePath);
      console.log("file  = ", file);
      const { data, error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file);
      
      if (uploadError) {
        throw uploadError;
      }
      console.log("uploaded file path  = ", data?.path);
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);
      if (!publicUrl) {
        throw new Error('Failed to get public URL for uploaded file.');
      }
      
      await onUpload(publicUrl);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
      setShowChangeOptions(false);
    }
  };

  const handleDownloadImage = async () => {
    if (currentUrl) {
      try {
        // Fetch the image first to ensure it downloads properly
        const response = await fetch(currentUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }
        
        // Convert the response to a blob
        const blob = await response.blob();
        
        // Create a blob URL for the image
        const blobUrl = URL.createObjectURL(blob);
        
        // Create an anchor element and trigger download
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `${type}-image-${Date.now()}.${getImageExtension(currentUrl)}`;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(blobUrl);
        }, 100);
        
        setShowDownloadConfirm(false);
      } catch (err: any) {
        setError(`Download failed: ${err.message}`);
        setShowDownloadConfirm(false);
      }
    }
  };
  
  // Helper function to get file extension from URL
  const getImageExtension = (url: string): string => {
    // Try to get extension from URL path
    const urlPath = url.split('?')[0]; // Remove query parameters
    const extension = urlPath.split('.').pop()?.toLowerCase();
    
    // Return valid image extension or default to jpg
    if (extension && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
      return extension;
    }
    return 'jpg'; // Default extension
  };

  const handleImageClick = () => {
    if (currentUrl) {
      setShowDownloadConfirm(true);
    } else {
      // If no image exists, directly show file upload
      document.getElementById(`${type}-file-input`)?.click();
    }
  };

  return (
    <div className="relative ">
      <div 
        className={`relative ${type === 'banner' ? 'h-48' : 'h-32'} w-full rounded-lg overflow-hidden bg-gray-700`}
        onClick={handleImageClick}
      >
        {currentUrl ? (
          <img
            src={currentUrl}
            alt={type === 'avatar' ? 'Profile picture' : 'Profile banner'}
            className={`w-full h-full object-cover ${type === 'avatar' ? 'object-center' : 'object-center'}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-700">
            <Camera className="h-8 w-8 text-gray-400" />
          </div>
        )}

        {!showDownloadConfirm && !showChangeOptions && (
          <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
            <div className="flex items-center space-x-2 text-white">
              {currentUrl ? (
                <span>Click to download or change</span>
              ) : (
                <>
                  <Camera className="h-5 w-5" />
                  <span>Upload {type === 'avatar' ? 'Profile Picture' : 'Banner'}</span>
                </>
              )}
            </div>
          </div>
        )}
        
        {/* Hidden file input for image upload */}
        <input
          id={`${type}-file-input`}
          type="file"
          accept="image/*"
          onChange={uploadImage}
          disabled={uploading}
          className="hidden"
        />
      </div>

      {/* Download confirmation popup */}
      {showDownloadConfirm && (
        <div className="absolute -white top-[-210px] left-[-100px]  h-[500px] w-[500px]   flex items-center justify-center  z-[3000]">
          <div className="bg-gray-800 px-6 py-4 rounded-lg shadow-lg text-white max-w-md">
            <h3 className="text-lg font-medium mb-3">What would you like to do?</h3>
            <div className="flex flex-col space-y-3">
              <button 
                onClick={handleDownloadImage}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
              >
                <Download className="h-5 w-5" />
                <span>Download Image</span>
              </button>
              <button 
                onClick={() => {
                  setShowDownloadConfirm(false);
                  setShowChangeOptions(true);
                }}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
              >
                <Camera className="h-5 w-5" />
                <span>Change Image</span>
              </button>
              <button 
                onClick={() => setShowDownloadConfirm(false)}
                className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change image overlay */}
      {showChangeOptions && (
        <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-black bg-opacity-70 z-10">
          <div className="flex flex-col space-y-4">
            <label className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded cursor-pointer text-white">
              <Camera className="h-5 w-5" />
              <span>Select New Image</span>
              <input
                type="file"
                accept="image/*"
                onChange={uploadImage}
                disabled={uploading}
                className="hidden"
              />
            </label>
            {uploading && (
              <div className="flex items-center justify-center space-x-2 text-white">
                <Loader className="h-5 w-5 animate-spin" />
                <span>Uploading...</span>
              </div>
            )}
            <button 
              onClick={() => setShowChangeOptions(false)}
              className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute bottom-0 left-0 right-0 bg-red-900 text-white px-4 py-2 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}