"use client";

import { useState, useEffect } from "react";
import { Trash2, Copy, ImageIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ImageUpload } from "@/components/image-upload";
import { useToast } from "@/context/toast-context";
import { logger } from "@/lib/logger";

interface StorageFile {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: Record<string, unknown>;
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
        if (error) logger.error("Error fetching images:", error);
    } catch (error) {
        logger.error("Error fetching media:", error);
    } finally {
        setIsLoading(false);
    }
  };

  const handleUpload = (url: string) => {
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
      } catch(error) {
          logger.error("Error deleting image:", error);
          toastError(error instanceof Error ? error.message : "Failed to delete image.");
      }
  }

  const copyUrl = (name: string) => {
      const { data } = supabase.storage.from('products').getPublicUrl(name);
      navigator.clipboard.writeText(data.publicUrl);
      success("URL copied to clipboard!");
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-heading font-bold mb-1">MEDIA LIBRARY</h2>
        <p className="text-gray-500 font-mono text-sm">Manage your uploaded assets.</p>
      </div>

      <div className="bg-[#111] border border-[#333] p-6 rounded-xl">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-black flex items-center justify-center text-xs font-bold"><ImageIcon size={14} /></span>
              Upload New Asset
          </h3>
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
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {images.length === 0 && (
                <div className="col-span-full p-20 text-center text-gray-500 bg-[#111] border border-[#333] rounded-xl border-dashed">
                    <ImageIcon size={48} className="mx-auto text-gray-700 mb-4" />
                    <p className="font-heading text-lg text-gray-400">No media found</p>
                    <p className="text-xs font-mono mt-2">Upload images to get started</p>
                </div>
            )}
            {images.map((img) => {
                const { data } = supabase.storage.from('products').getPublicUrl(img.name);
                return (
                    <div key={img.id} className="bg-[#111] border border-[#333] hover:border-gray-500 rounded-xl overflow-hidden group relative transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                        <div className="aspect-square bg-[#050505] relative">
                            {/* Image with subtle overlay */}
                            <div className="absolute inset-0 bg-[url('/textures/noise.svg')] opacity-10 pointer-events-none z-10"></div>
                            <img src={data.publicUrl} alt={img.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                            
                            {/* Actions Overlay */}
                            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 p-4 z-20">
                                <button 
                                    onClick={() => copyUrl(img.name)}
                                    className="px-3 py-1.5 bg-white text-black rounded text-[10px] font-bold uppercase tracking-wide flex items-center gap-2 hover:bg-gray-200 transition-colors w-full justify-center"
                                >
                                    <Copy size={12} /> Copy URL
                                </button>
                                <button 
                                    onClick={() => deleteImage(img.name)}
                                    className="px-3 py-1.5 bg-red-500/10 border border-red-500/50 text-red-500 rounded text-[10px] font-bold uppercase tracking-wide flex items-center gap-2 hover:bg-red-500/20 transition-colors w-full justify-center"
                                >
                                    <Trash2 size={12} /> Delete
                                </button>
                            </div>
                        </div>
                        <div className="p-3 border-t border-[#333] bg-[#1a1a1a]">
                            <p className="text-[10px] text-gray-400 truncate font-mono" title={img.name}>{img.name}</p>
                            <p className="text-[9px] text-gray-600 mt-1 uppercase tracking-wider font-mono">
                                {((Number(img.metadata?.size) || 0) / 1024).toFixed(1)} KB
                            </p>
                        </div>
                    </div>
                )
            })}
          </div>
      )}
    </div>
  );
}
