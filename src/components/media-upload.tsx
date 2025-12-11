"use client";

import { useState } from "react";
import { Upload, X, Music, Video, FileAudio } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/context/toast-context";
import { logger } from "@/lib/logger";

interface MediaUploadProps {
  onUpload: (url: string) => void;
  defaultUrl?: string;
  bucket?: string;
  type: 'image' | 'audio' | 'video';
  label?: string;
}

export function MediaUpload({ onUpload, defaultUrl, bucket = 'stories', type, label }: MediaUploadProps) {
  const [url, setUrl] = useState<string | null>(defaultUrl || null);
  const [uploading, setUploading] = useState(false);
  const { error: toastError } = useToast();

  const acceptMap = {
      'image': 'image/*',
      'audio': 'audio/*',
      'video': 'video/*'
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select a file to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${type}s/${fileName}`;

      // Upload to Supabase
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get Public URL
      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
      
      setUrl(data.publicUrl);
      onUpload(data.publicUrl);

    } catch (error: unknown) {
      logger.error('Error uploading file:', error);
      toastError(error instanceof Error ? error.message : 'Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setUrl(null);
    onUpload("");
  };

  return (
    <div className="w-full">
      {url ? (
        <div className="relative w-full bg-[#222] rounded-lg overflow-hidden border border-[#333] group p-2">
            
          {type === 'image' && (
              <div className="relative aspect-video w-full overflow-hidden rounded">
                  <img src={url} alt="Uploaded" className="w-full h-full object-cover" />
              </div>
          )}
          
          {type === 'audio' && (
              <div className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                      <Music size={20} />
                  </div>
                  <audio controls src={url} className="flex-1 h-8" />
              </div>
          )}

           {type === 'video' && (
               <div className="relative aspect-video w-full overflow-hidden rounded">
                   <video controls src={url} className="w-full h-full object-cover" />
               </div>
           )}

          <button 
                type="button"
                onClick={removeFile}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
            >
                <X size={14} />
            </button>
        </div>
      ) : (
        <div className="relative h-24 w-full bg-[#111] border border-dashed border-[#333] rounded-lg hover:border-primary/50 transition-colors flex flex-col items-center justify-center cursor-pointer group">
           <input 
                type="file" 
                accept={acceptMap[type]}
                onChange={handleUpload}
                disabled={uploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            <div className="flex flex-col items-center gap-1 text-gray-500 group-hover:text-primary transition-colors">
                {uploading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary"></div>
                ) : (
                    <>
                        {type === 'image' && <Upload size={20} />}
                        {type === 'audio' && <FileAudio size={20} />}
                        {type === 'video' && <Video size={20} />}
                        <span className="font-mono text-[10px] uppercase tracking-wider">
                            {label || `Upload ${type}`}
                        </span>
                    </>
                )}
            </div>
        </div>
      )}
    </div>
  );
}

