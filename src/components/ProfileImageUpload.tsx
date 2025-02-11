import React, { useState } from 'react';
import { Camera, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ProfileImageUploadProps {
  currentUrl: string | null;
  onUpload: (url: string) => Promise<void>;
  type: 'avatar' | 'banner';
}

export function ProfileImageUpload({ currentUrl, onUpload, type }: ProfileImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      console.log("file path uploading = ",filePath);
      console.log("file  = ",file);
      const {data  , error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }
      console.log("uploaded file path  = " , data?.path) ; 

      // Get public URL
      const {data : {publicUrl}} = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);
      if(!publicUrl) {
        throw new Error('Failed to get public URL for uploaded file.');
      } 
      await onUpload(publicUrl);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`relative ${type === 'banner' ? 'h-48' : 'h-32'} w-full rounded-lg overflow-hidden bg-gray-700`}>
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

      <label className="absolute inset-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
        <input
          type="file"
          accept="image/*"
          onChange={uploadImage}
          disabled={uploading}
          className="hidden"
        />
        <div className="flex items-center space-x-2 text-white">
          {uploading ? (
            <>
              <Loader className="h-5 w-5 animate-spin" />
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <Camera className="h-5 w-5" />
              <span>Change {type === 'avatar' ? 'Profile Picture' : 'Banner'}</span>
            </>
          )}
        </div>
      </label>

      {error && (
        <div className="absolute bottom-0 left-0 right-0 bg-red-900 text-white px-4 py-2 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}