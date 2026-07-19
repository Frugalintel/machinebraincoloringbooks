"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Copy,
  Eye,
  Clock,
  Hash,
  BarChart,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Story, StoryNode } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/context/toast-context";
import { logAdminAction } from "@/lib/admin-utils";
import { MediaUpload } from "@/components/media-upload";
import { logger } from "@/lib/logger";
import { StoryNodeEditor } from "@/components/admin/story-node-editor";
import { StoryRequirementsEditor } from "@/components/admin/story-requirements-editor";
import { StoryRewardsEditor } from "@/components/admin/story-rewards-editor";
import { ADVENTURES_COPY } from "@/lib/story-utils";

interface StoryFormProps {
  initialData?: Story;
  isEditing?: boolean;
}

export function StoryForm({ initialData, isEditing = false }: StoryFormProps) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Story>>({
    title: "",
    synopsis: "",
    content: [],
    requirements: [],
    rewards: [],
    is_published: false,
    cover_url: "",
    code_needed: "",
    difficulty: 1,
    estimated_minutes: 15,
    tags: [],
    ...initialData,
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleNodesChange = (newNodes: StoryNode[]) => {
    setFormData((prev) => ({
      ...prev,
      content: newNodes,
    }));
  };

  const handleDuplicate = async () => {
    if (!initialData) return;
    if (!confirm("Create a copy of this story?")) return;

    setLoading(true);
    try {
      const { id: _id, created_at: _created_at, ...rest } = initialData;
      const newStory = {
        ...rest,
        title: `${rest.title} (Copy)`,
        is_published: false,
      };

      const { data, error } = await supabase
        .from("stories")
        .insert([newStory])
        .select("id")
        .single();
      if (error) throw error;

      success("Story duplicated!");
      router.push(`/admin/stories/${data.id}`);
    } catch (err) {
      logger.error("Failed to duplicate story:", err);
      toastError("Failed to duplicate story");
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = () => {
    if (isEditing && initialData?.id) {
      window.open(`/stories/${initialData.id}`, "_blank");
    } else {
      toastError("Save story first to preview");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditing && initialData?.id) {
        const { error } = await supabase
          .from("stories")
          .update(formData)
          .eq("id", initialData.id);
        if (error) throw error;

        await logAdminAction("update_story", "stories", initialData.id, {
          title: formData.title,
          changes: formData,
        });

        success("Story updated!");
      } else {
        const { data, error } = await supabase
          .from("stories")
          .insert([formData])
          .select("id")
          .single();
        if (error) throw error;

        await logAdminAction("create_story", "stories", data.id, {
          title: formData.title,
        });

        success("Story created!");
        if (!isEditing) {
          router.push(`/admin/stories/${data.id}`); // Go to edit mode
          return;
        }
      }
      router.refresh();
    } catch (error) {
      logger.error("Failed to save story:", error);
      toastError("Failed to save story.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-6xl mx-auto space-y-8 pb-20 md:pb-0"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-start md:items-center gap-4">
          <Link
            href="/admin/stories"
            className="p-2 rounded-full hover:bg-[#222] transition-colors shrink-0 mt-1 md:mt-0"
          >
            <ArrowLeft size={20} className="text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-white leading-tight uppercase">
              {isEditing ? "EDIT ADVENTURE" : "NEW ADVENTURE"}
            </h1>
            <p className="text-gray-500 font-mono text-xs md:text-sm">
              {isEditing
                ? "Update interactive narrative"
                : "Create a new adventure"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {isEditing ? (
            <>
              <Button
                type="button"
                onClick={handlePreview}
                variant="outline"
                className="flex-1 md:flex-none border-[#333] hover:bg-[#222] text-xs"
              >
                <Eye size={14} className="mr-2" /> Preview
              </Button>
              <Button
                type="button"
                onClick={handleDuplicate}
                variant="outline"
                className="flex-1 md:flex-none border-[#333] hover:bg-[#222] text-xs"
              >
                <Copy size={14} className="mr-2" /> Copy
              </Button>
            </>
          ) : null}
          <Button
            type="submit"
            disabled={loading}
            className="bg-primary text-black hover:bg-white font-bold flex-1 md:flex-none w-full md:w-auto"
          >
            {loading ? (
              "SAVING..."
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Save size={18} />
                {isEditing ? "UPDATE" : "CREATE"}
              </span>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Metadata & Settings */}
        <div className="space-y-6">
          {/* Live Card Preview */}
          <div className="space-y-2">
            <h3 className="text-xs font-mono uppercase tracking-widest text-gray-500">
              Card Preview
            </h3>
            <div className="group relative bg-[#111] border border-[#333] hover:border-gray-500 rounded-xl overflow-hidden shadow-2xl mx-auto w-[280px]">
              <div className="aspect-[4/3] relative w-full overflow-hidden bg-[#050505]">
                <div className="absolute inset-0 bg-[url('/textures/noise.svg')] opacity-20 mix-blend-overlay z-10 pointer-events-none"></div>

                {formData.cover_url ? (
                  <img
                    src={formData.cover_url}
                    alt={formData.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-90"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-black">
                    <Clock size={48} className="text-white/20" />
                  </div>
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-[#111]/60 to-transparent z-20"></div>

                {/* Content Info */}
                <div className="absolute bottom-0 left-0 right-0 p-5 z-30">
                  <div className="mb-3">
                    <h3 className="font-heading text-xl font-bold text-white leading-tight mb-1 truncate">
                      {formData.title || "Adventure Title"}
                    </h3>
                    <p className="text-xs text-gray-400 line-clamp-2">
                      {formData.synopsis || "Synopsis preview..."}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/10 pt-3">
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <Clock size={12} />
                      <span className="text-[10px] font-mono uppercase tracking-wider">
                        {formData.estimated_minutes || 15} MIN
                      </span>
                    </div>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, idx) => (
                        <div
                          key={idx}
                          className={`w-1 h-2 rounded-sm ${idx < (formData.difficulty || 1) ? "bg-primary" : "bg-[#333]"}`}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {/* Status Badge Preview */}
              <div className="absolute top-3 right-3 z-30 flex flex-col items-end gap-2">
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-1 rounded backdrop-blur-md border shadow-sm ${
                    formData.is_published
                      ? "bg-green-500/20 text-green-400 border-green-500/30"
                      : "bg-black/60 text-gray-400 border-white/10"
                  }`}
                >
                  {formData.is_published ? "Published" : "Draft"}
                </span>
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-1 rounded backdrop-blur-md border shadow-sm bg-primary/10 text-primary border-primary/30`}
                >
                  {ADVENTURES_COPY.badge}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-[#111] border border-[#333] p-6 rounded-lg space-y-6">
            <h3 className="font-heading text-lg border-b border-[#333] pb-2 mb-4">
              Meta Information
            </h3>

            <div className="space-y-2">
              <label className="text-xs font-mono text-gray-400 uppercase">
                Cover Image
              </label>
              <MediaUpload
                type="image"
                label="Upload Cover"
                defaultUrl={formData.cover_url}
                onUpload={(url) =>
                  setFormData((prev) => ({ ...prev, cover_url: url }))
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-gray-400 uppercase">
                Unlock Code
              </label>
              <div className="relative">
                <Hash
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />
                <Input
                  name="code_needed"
                  value={formData.code_needed || ""}
                  onChange={handleChange}
                  placeholder="SECRET_CODE"
                  className="bg-[#222] border-[#333] pl-9 font-mono uppercase"
                />
              </div>
              <p className="text-[10px] text-gray-500">
                Code needed to unlock (if no product requirement).
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-mono text-gray-400 uppercase">
                  Difficulty (1-5)
                </label>
                <div className="relative">
                  <BarChart
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                  />
                  <Input
                    type="number"
                    name="difficulty"
                    min={1}
                    max={5}
                    value={formData.difficulty}
                    onChange={handleChange}
                    className="bg-[#222] border-[#333] pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-mono text-gray-400 uppercase">
                  Duration (Min)
                </label>
                <div className="relative">
                  <Clock
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                  />
                  <Input
                    type="number"
                    name="estimated_minutes"
                    value={formData.estimated_minutes}
                    onChange={handleChange}
                    className="bg-[#222] border-[#333] pl-9"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-[#333]">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_published"
                  name="is_published"
                  checked={formData.is_published}
                  onChange={(e) =>
                    setFormData({ ...formData, is_published: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label
                  htmlFor="is_published"
                  className="text-sm text-gray-300 select-none cursor-pointer font-bold"
                >
                  Published & Live
                </label>
              </div>
            </div>
          </div>

          <div className="bg-[#111] border border-[#333] p-6 rounded-lg space-y-4">
            <h3 className="font-heading text-lg border-b border-[#333] pb-2">
              Access & Rewards
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-mono text-gray-400 uppercase mb-2 block">
                  Requirements to Unlock
                </label>
                <StoryRequirementsEditor
                  requirements={formData.requirements || []}
                  onChange={(reqs) =>
                    setFormData((prev) => ({ ...prev, requirements: reqs }))
                  }
                />
              </div>

              <div>
                <label className="text-xs font-mono text-gray-400 uppercase mb-2 block">
                  Completion Rewards
                </label>
                <StoryRewardsEditor
                  rewards={formData.rewards || []}
                  onChange={(rewards) =>
                    setFormData((prev) => ({ ...prev, rewards: rewards }))
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Content Editor */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#111] border border-[#333] p-6 rounded-lg space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-mono text-gray-400 uppercase">
                Title
              </label>
              <Input
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="The Mystery of..."
                className="bg-[#222] border-[#333] text-lg font-heading"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-mono text-gray-400 uppercase">
                Synopsis
              </label>
              <textarea
                name="synopsis"
                value={formData.synopsis}
                onChange={handleChange}
                placeholder="Brief summary..."
                className="flex min-h-[80px] w-full rounded-md border border-[#333] bg-[#222] px-3 py-2 text-sm text-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                required
              />
            </div>
          </div>

          {/* Node Editor */}
          <div className="bg-[#111] border border-[#333] rounded-lg overflow-hidden">
            <div className="p-4 border-b border-[#333] bg-[#1a1a1a]">
              <h3 className="font-heading text-xl">Adventure Content</h3>
            </div>

            <div className="p-4">
              <StoryNodeEditor
                nodes={formData.content || []}
                onChange={handleNodesChange}
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
