"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Trash2, Copy } from "lucide-react";
import { ImageUpload } from "@/components/image-upload";
import { useToast } from "@/context/toast-context";

interface StorageFile {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: Record<string, any>;
}

export default function MediaLibraryPage() {
  const [images, setImages] = useState<StorageFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { success, error: toastError } = useToast();

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    setIsLoading(true);
    try {
        const { data, error } = await supabase
            .storage
            .from('products')
            .list('', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });
        
        if (data) setImages(data);
        if (error) console.error("Error fetching images:", error);
    } catch (error) {
        console.error("Error:", error);
    } finally {
        setIsLoading(false);
    }
  };

  const handleUpload = (url: string) => {
      // Refresh list
      fetchImages();
      success("Image uploaded successfully.");
  };

  const deleteImage = async (name: string) => {
      if(!confirm("Delete this image?")) return;
      try {
          const { error } = await supabase.storage.from('products').remove([name]);
          if(error) throw error;
          setImages(images.filter(img => img.name !== name));
          success("Image deleted.");
      } catch(error: any) {
          console.error("Error deleting image:", error);
          toastError(error.message || "Failed to delete image.");
      }
  }

  const copyUrl = (name: string) => {
      const { data } = supabase.storage.from('products').getPublicUrl(name);
      navigator.clipboard.writeText(data.publicUrl);
      success("URL copied to clipboard!");
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-heading font-bold mb-1">MEDIA LIBRARY</h2>
        <p className="text-gray-500 font-mono text-sm">Manage your uploaded assets.</p>
      </div>

      <div className="bg-[#111] border border-[#333] p-6 rounded-lg mb-8">
          <h3 className="font-bold mb-4">Upload New Image</h3>
          <div className="max-w-md">
            <ImageUpload onUpload={handleUpload} />
          </div>
      </div>

      {isLoading ? (
          <div className="text-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-500 font-mono">Loading assets...</p>
          </div>
      ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {images.length === 0 && (
                <div className="col-span-full p-12 text-center text-gray-500 bg-[#111] border border-[#333] rounded-lg">
                    No images found. Upload one to get started.
                </div>
            )}
            {images.map((img) => {
                const { data } = supabase.storage.from('products').getPublicUrl(img.name);
                return (
                    <div key={img.id} className="bg-[#111] border border-[#333] rounded-lg overflow-hidden group relative">
                        <div className="aspect-square bg-[#222]">
                            <img src={data.publicUrl} alt={img.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                            <button 
                                onClick={() => copyUrl(img.name)}
                                className="text-white hover:text-primary text-xs flex items-center gap-1"
                            >
                                <Copy size={12} /> Copy URL
                            </button>
                            <button 
                                onClick={() => deleteImage(img.name)}
                                className="text-red-500 hover:text-red-400 text-xs flex items-center gap-1"
                            >
                                <Trash2 size={12} /> Delete
                            </button>
                        </div>
                        <div className="p-2 border-t border-[#333]">
                            <p className="text-[10px] text-gray-500 truncate font-mono">{img.name}</p>
                        </div>
                    </div>
                )
            })}
          </div>
      )}
    </div>
  );
}
