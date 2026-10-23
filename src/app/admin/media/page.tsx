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
      const { data, error } = await supabase.storage.from("products").list("", {
        limit: 100,
        sortBy: { column: "created_at", order: "desc" },
      });

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
    if (!confirm("Delete this image?")) return;
    try {
      const { error } = await supabase.storage.from("products").remove([name]);
      if (error) throw error;
      setImages(images.filter((img) => img.name !== name));
      success("Image deleted.");
    } catch (error) {
      logger.error("Error deleting image:", error);
      toastError(
        error instanceof Error ? error.message : "Failed to delete image.",
      );
    }
  };

  const copyUrl = (name: string) => {
    const { data } = supabase.storage.from("products").getPublicUrl(name);
    navigator.clipboard.writeText(data.publicUrl);
    success("URL copied to clipboard!");
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-heading font-bold mb-1">MEDIA LIBRARY</h2>
        <p className="text-fg-muted font-mono text-sm">
          Manage your uploaded assets.
        </p>
      </div>

      <div className="bg-surface-1 border border-line p-6 rounded-xl">
        <h3 className="font-bold text-cream mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-cream text-ink flex items-center justify-center text-xs font-bold">
            <ImageIcon size={14} />
          </span>
          Upload New Asset
        </h3>
        <div className="max-w-md">
          <ImageUpload onUpload={handleUpload} />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-fg-muted font-mono">Loading assets...</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {images.length === 0 && (
            <div className="col-span-full p-20 text-center text-fg-muted bg-surface-1 border border-line rounded-xl border-dashed">
              <ImageIcon size={48} className="mx-auto text-fg-faint mb-4" />
              <p className="font-heading text-lg text-fg-muted">
                No media found
              </p>
              <p className="text-xs font-mono mt-2">
                Upload images to get started
              </p>
            </div>
          )}
          {images.map((img) => {
            const { data } = supabase.storage
              .from("products")
              .getPublicUrl(img.name);
            return (
              <div
                key={img.id}
                className="bg-surface-1 border border-line hover:border-line-strong rounded-xl overflow-hidden group relative transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              >
                <div className="aspect-square bg-background relative">
                  {/* Image with subtle overlay */}
                  <img
                    src={data.publicUrl}
                    alt={img.name}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  />

                  {/* Actions Overlay */}
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 p-4 z-20">
                    <button
                      onClick={() => copyUrl(img.name)}
                      className="px-3 py-1.5 bg-cream text-ink rounded text-[10px] font-bold uppercase tracking-wide flex items-center gap-2 hover:bg-gray-200 transition-colors w-full justify-center"
                    >
                      <Copy size={12} /> Copy URL
                    </button>
                    <button
                      onClick={() => deleteImage(img.name)}
                      className="px-3 py-1.5 bg-danger/10 border border-danger/50 text-danger rounded text-[10px] font-bold uppercase tracking-wide flex items-center gap-2 hover:bg-danger/20 transition-colors w-full justify-center"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
                <div className="p-3 border-t border-line bg-surface-1">
                  <p
                    className=" text-fg-muted truncate font-label"
                    title={img.name}
                  >
                    {img.name}
                  </p>
                  <p className=" text-fg-faint mt-1 uppercase tracking-wider font-label">
                    {((Number(img.metadata?.size) || 0) / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
