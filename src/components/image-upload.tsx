"use client";

import { useState } from "react";
import { Upload, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/context/toast-context";

interface ImageUploadProps {
  onUpload: (url: string) => void;
  defaultImage?: string;
  bucket?: string;
}

export function ImageUpload({ onUpload, defaultImage, bucket = 'products' }: ImageUploadProps) {
  const [image, setImage] = useState<string | null>(defaultImage || null);
  const [uploading, setUploading] = useState(false);
  const { error: toastError } = useToast();

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to Supabase
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get Public URL
      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
      
      setImage(data.publicUrl);
      onUpload(data.publicUrl);

    } catch (error: any) {
      console.error('Error uploading image:', error);
      toastError(error.message || 'Error uploading image');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setImage(null);
    onUpload("");
  };

  return (
    <div className="w-full">
      {image ? (
        <div className="relative aspect-video w-full bg-[#222] rounded-lg overflow-hidden border border-[#333] group">
          <img src={image} alt="Uploaded" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button 
                type="button"
                onClick={removeImage}
                className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
            >
                <X size={20} />
            </button>
          </div>
        </div>
      ) : (
        <div className="relative aspect-video w-full bg-[#111] border-2 border-dashed border-[#333] rounded-lg hover:border-primary/50 transition-colors flex flex-col items-center justify-center cursor-pointer group">
           <input 
                type="file" 
                accept="image/*"
                onChange={handleUpload}
                disabled={uploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            <div className="flex flex-col items-center gap-2 text-gray-500 group-hover:text-primary transition-colors">
                {uploading ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                ) : (
                    <>
                        <Upload size={32} />
                        <span className="font-mono text-sm uppercase tracking-wider">
                            {uploading ? "Uploading..." : "Upload Image"}
                        </span>
                    </>
                )}
            </div>
        </div>
      )}
    </div>
  );
}
