"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Story, Product, Achievement } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Plus, X } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/context/toast-context";

import { StoryNodeEditor } from "@/components/admin/story-node-editor";

interface StoryFormProps {
  initialData?: Story;
  isEditing?: boolean;
}

export function StoryForm({ initialData, isEditing = false }: StoryFormProps) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  
  const [formData, setFormData] = useState<Partial<Story>>({
    title: "",
    synopsis: "",
    cover_url: "",
    content: [],
    requirements: [],
    rewards: [],
    code_needed: "",
    is_published: false,
    ...initialData
  });

  useEffect(() => {
    const fetchData = async () => {
        const { data: prodData } = await supabase.from('products').select('id, title');
        const { data: achData } = await supabase.from('achievements').select('id, title');
        if (prodData) setProducts(prodData as Product[]);
        if (achData) setAchievements(achData as Achievement[]);
    };
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addRequirement = (type: 'product' | 'achievement') => {
    setFormData(prev => ({
        ...prev,
        requirements: [...(prev.requirements || []), { type, id: "", name: "" }]
    }));
  };

  const updateRequirement = (index: number, field: string, value: string) => {
    const newReqs = [...(formData.requirements || [])];
    newReqs[index] = { ...newReqs[index], [field]: value };
    
    // Auto-fill name if ID changes
    if (field === 'id') {
        const list = newReqs[index].type === 'product' ? products : achievements;
        const item = list.find(i => i.id === value);
        if (item) newReqs[index].name = item.title;
    }
    
    setFormData(prev => ({ ...prev, requirements: newReqs }));
  };

  const removeRequirement = (index: number) => {
    setFormData(prev => ({
        ...prev,
        requirements: prev.requirements?.filter((_, i) => i !== index)
    }));
  };

  const addReward = (type: 'discount' | 'product' | 'achievement') => {
    setFormData(prev => ({
        ...prev,
        rewards: [...(prev.rewards || []), { type, description: "" }]
    }));
  };

  const updateReward = (index: number, field: string, value: string | number) => {
    const newRewards = [...(formData.rewards || [])];
    newRewards[index] = { ...newRewards[index], [field]: value };
    setFormData(prev => ({ ...prev, rewards: newRewards }));
  };

  const removeReward = (index: number) => {
    setFormData(prev => ({
        ...prev,
        rewards: prev.rewards?.filter((_, i) => i !== index)
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
        success("Story updated!");
      } else {
        const { error } = await supabase
          .from('stories')
          .insert([formData]);
        if (error) throw error;
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
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/stories" className="p-2 rounded-full hover:bg-[#222] transition-colors">
            <ArrowLeft size={20} className="text-gray-400" />
        </Link>
        <div>
            <h1 className="text-3xl font-heading font-bold text-white">
                {isEditing ? "EDIT STORY" : "NEW STORY"}
            </h1>
            <p className="text-gray-500 font-mono text-sm">
                {isEditing ? "Update interactive story details" : "Create a new adventure"}
            </p>
        </div>
        <div className="ml-auto flex gap-4">
             <Button 
                type="submit" 
                disabled={loading}
                className="bg-primary text-black hover:bg-white font-bold px-8"
            >
                {loading ? "SAVING..." : (
                    <span className="flex items-center gap-2">
                        <Save size={18} />
                        SAVE STORY
                    </span>
                )}
            </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-[#111] border border-[#333] mb-6">
            <TabsTrigger value="general">General Info</TabsTrigger>
            <TabsTrigger value="requirements">Requirements</TabsTrigger>
            <TabsTrigger value="rewards">Rewards</TabsTrigger>
            <TabsTrigger value="content">Story Content</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6 bg-[#111] p-6 rounded-lg border border-[#333]">
            <div className="space-y-2">
                <label className="text-sm font-mono text-gray-400 uppercase">Title</label>
                <Input 
                    name="title"
                    value={formData.title} 
                    onChange={handleChange} 
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
                    className="flex min-h-[100px] w-full rounded-md border border-[#333] bg-[#222] px-3 py-2 text-sm text-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                    required
                />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-mono text-gray-400 uppercase">Cover Image URL</label>
                <Input 
                    name="cover_url"
                    value={formData.cover_url} 
                    onChange={handleChange} 
                    className="bg-[#222] border-[#333]"
                    placeholder="https://..."
                />
            </div>
            <div className="flex items-center gap-2 pt-2">
                <input 
                    type="checkbox" 
                    id="is_published" 
                    name="is_published"
                    checked={formData.is_published}
                    onChange={(e) => setFormData({...formData, is_published: e.target.checked})}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="is_published" className="text-sm text-gray-300 select-none cursor-pointer">
                    Publish Story (Visible to users)
                </label>
            </div>
        </TabsContent>

        <TabsContent value="requirements" className="space-y-6 bg-[#111] p-6 rounded-lg border border-[#333]">
            <div className="space-y-2 mb-6 pb-6 border-b border-[#333]">
                <label className="text-sm font-mono text-gray-400 uppercase">Required Code (Optional)</label>
                <p className="text-xs text-gray-500 mb-2">If set, users must enter this code to unlock the story.</p>
                <Input 
                    name="code_needed"
                    value={formData.code_needed || ""} 
                    onChange={handleChange} 
                    className="bg-[#222] border-[#333]"
                    placeholder="e.g. SECRET-123"
                />
            </div>

             <div className="flex gap-4 mb-4">
                <Button type="button" onClick={() => addRequirement('product')} variant="outline" className="border-[#333] hover:bg-[#222]">
                    <Plus size={16} className="mr-2" /> Require Product
                </Button>
                <Button type="button" onClick={() => addRequirement('achievement')} variant="outline" className="border-[#333] hover:bg-[#222]">
                    <Plus size={16} className="mr-2" /> Require Achievement
                </Button>
            </div>

            {formData.requirements?.length === 0 && (
                <p className="text-gray-500 text-sm font-mono text-center py-8">No requirements set. Story is open to everyone.</p>
            )}

            <div className="space-y-4">
                {formData.requirements?.map((req, idx) => (
                    <div key={idx} className="flex items-center gap-4 bg-[#222] p-4 rounded border border-[#333]">
                        <span className="text-xs font-mono uppercase bg-[#333] px-2 py-1 rounded text-gray-300 w-24 text-center">{req.type}</span>
                        
                        <select 
                            value={req.id} 
                            onChange={(e) => updateRequirement(idx, 'id', e.target.value)}
                            className="flex-1 h-10 rounded-md border border-[#333] bg-[#1a1a1a] px-3 text-sm text-white focus:outline-none focus:border-primary"
                        >
                            <option value="">Select Item...</option>
                            {(req.type === 'product' ? products : achievements).map(item => (
                                <option key={item.id} value={item.id}>{item.title}</option>
                            ))}
                        </select>

                        <button type="button" onClick={() => removeRequirement(idx)} className="text-gray-500 hover:text-red-500">
                            <X size={18} />
                        </button>
                    </div>
                ))}
            </div>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-6 bg-[#111] p-6 rounded-lg border border-[#333]">
            <div className="flex gap-4 mb-4">
                <Button type="button" onClick={() => addReward('discount')} variant="outline" className="border-[#333] hover:bg-[#222]">
                    <Plus size={16} className="mr-2" /> Add Discount
                </Button>
                <Button type="button" onClick={() => addReward('achievement')} variant="outline" className="border-[#333] hover:bg-[#222]">
                    <Plus size={16} className="mr-2" /> Add Achievement Reward
                </Button>
                {/* Product/Bundle rewards could be added similarly */}
            </div>

            {formData.rewards?.length === 0 && (
                <p className="text-gray-500 text-sm font-mono text-center py-8">No rewards set.</p>
            )}

             <div className="space-y-4">
                {formData.rewards?.map((reward, idx) => (
                    <div key={idx} className="flex flex-col gap-4 bg-[#222] p-4 rounded border border-[#333]">
                        <div className="flex justify-between items-center">
                             <span className="text-xs font-mono uppercase bg-[#333] px-2 py-1 rounded text-gray-300">{reward.type}</span>
                             <button type="button" onClick={() => removeReward(idx)} className="text-gray-500 hover:text-red-500">
                                <X size={18} />
                            </button>
                        </div>
                        
                        {reward.type === 'discount' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-500">Amount (%)</label>
                                    <Input 
                                        type="number" 
                                        value={reward.amount || ""} 
                                        onChange={(e) => updateReward(idx, 'amount', parseInt(e.target.value))}
                                        className="bg-[#1a1a1a] border-[#333]"
                                        placeholder="e.g. 20"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-500">Description</label>
                                    <Input 
                                        value={reward.description || ""} 
                                        onChange={(e) => updateReward(idx, 'description', e.target.value)}
                                        className="bg-[#1a1a1a] border-[#333]"
                                        placeholder="e.g. 20% off next purchase"
                                    />
                                </div>
                            </div>
                        )}

                        {reward.type === 'achievement' && (
                             <div className="space-y-1">
                                <label className="text-xs text-gray-500">Achievement to Unlock</label>
                                <select 
                                    value={reward.id || ""} 
                                    onChange={(e) => {
                                        updateReward(idx, 'id', e.target.value);
                                        updateReward(idx, 'description', achievements.find(a => a.id === e.target.value)?.title || "Achievement Unlock");
                                    }}
                                    className="w-full h-10 rounded-md border border-[#333] bg-[#1a1a1a] px-3 text-sm text-white focus:outline-none focus:border-primary"
                                >
                                    <option value="">Select Achievement...</option>
                                    {achievements.map(item => (
                                        <option key={item.id} value={item.id}>{item.title}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-6 bg-[#111] p-6 rounded-lg border border-[#333]">
            <StoryNodeEditor 
                nodes={formData.content || []} 
                onChange={(newNodes) => setFormData(prev => ({ ...prev, content: newNodes }))}
            />
        </TabsContent>
      </Tabs>
    </form>
  );
}

