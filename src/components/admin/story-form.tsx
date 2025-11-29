"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Story, StoryNode } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/context/toast-context";
import { logAdminAction } from "@/lib/admin-utils";

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
    ...initialData
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditing && initialData?.id) {
        const { error } = await supabase
          .from('stories')
          .update(formData)
          .eq('id', initialData.id);
        if (error) throw error;
        
        await logAdminAction(
            'update_story',
            'stories',
            initialData.id,
            { title: formData.title, changes: formData }
        );

        success("Story updated!");
      } else {
        const { data, error } = await supabase
          .from('stories')
          .insert([formData])
          .select('id')
          .single();
        if (error) throw error;
        
        await logAdminAction(
            'create_story',
            'stories',
            data.id,
            { title: formData.title }
        );

        success("Story created!");
      }
      router.push("/admin/stories");
      router.refresh();
    } catch (error) {
      console.error(error);
      toastError("Failed to save story.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/stories" className="p-2 rounded-full hover:bg-[#222] transition-colors">
            <ArrowLeft size={20} className="text-gray-400" />
        </Link>
        <div>
            <h1 className="text-3xl font-heading font-bold text-white">
                {isEditing ? "EDIT STORY" : "NEW STORY"}
            </h1>
            <p className="text-gray-500 font-mono text-sm">
                {isEditing ? "Update interactive narrative" : "Create a new adventure"}
            </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
            <div className="bg-[#111] border border-[#333] p-6 rounded-lg space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-mono text-gray-400 uppercase">Title</label>
                    <Input 
                        name="title"
                        value={formData.title} 
                        onChange={handleChange} 
                        placeholder="The Mystery of..."
                        className="bg-[#222] border-[#333]"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-mono text-gray-400 uppercase">Synopsis</label>
                    <textarea 
                        name="synopsis"
                        value={formData.synopsis} 
                        onChange={handleChange} 
                        placeholder="Brief summary..."
                        className="flex min-h-[120px] w-full rounded-md border border-[#333] bg-[#222] px-3 py-2 text-sm text-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                        required
                    />
                </div>
            </div>

            {/* Node Editor Placeholder */}
            <div className="bg-[#111] border border-[#333] p-6 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-heading text-xl">Story Nodes</h3>
                    <div className="text-xs text-gray-500">Advanced Editor</div>
                </div>
                <div className="text-center py-12 border border-dashed border-[#333] rounded bg-[#1a1a1a]">
                    <p className="text-gray-500 mb-4">Node editor component would go here.</p>
                    <Button type="button" variant="outline" className="border-[#333] text-gray-400">
                        <Plus size={16} className="mr-2" /> Add Node
                    </Button>
                </div>
            </div>
        </div>

        <div className="space-y-6">
            <div className="bg-[#111] border border-[#333] p-6 rounded-lg space-y-4">
                <h3 className="font-heading text-lg">Settings</h3>
                <div className="flex items-center gap-2">
                    <input 
                        type="checkbox" 
                        id="is_published" 
                        name="is_published"
                        checked={formData.is_published}
                        onChange={(e) => setFormData({...formData, is_published: e.target.checked})}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="is_published" className="text-sm text-gray-300 select-none cursor-pointer">
                        Published
                    </label>
                </div>
            </div>

            <Button 
                type="submit" 
                disabled={loading}
                className="w-full bg-primary text-black hover:bg-white font-bold h-12"
            >
                {loading ? "SAVING..." : (
                    <span className="flex items-center gap-2">
                        <Save size={18} />
                        {isEditing ? "UPDATE STORY" : "CREATE STORY"}
                    </span>
                )}
            </Button>
        </div>
      </div>
    </form>
  );
}
