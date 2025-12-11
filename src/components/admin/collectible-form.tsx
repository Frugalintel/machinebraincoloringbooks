"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ArrowLeft, Save, Gem, Box, Sparkles } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Collectible, Achievement } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/context/toast-context";
import { logAdminAction } from "@/lib/admin-utils";
import { logger } from "@/lib/logger";
import { ImageUpload } from "@/components/image-upload";

// Dynamic import for Three.js to avoid SSR issues
const TrophyCanvas = dynamic(
  () => import('@/components/three').then((m) => m.TrophyCanvas),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[300px] bg-[#111] animate-pulse flex items-center justify-center rounded-lg">
        <div className="w-12 h-12 border-2 border-primary/30 rounded-full animate-spin border-t-primary" />
      </div>
    )
  }
);

interface CollectionSet {
  id: string;
  title: string;
}

interface CollectibleFormProps {
  initialData?: Collectible;
  isEditing?: boolean;
}

const RARITY_TIERS = [
    { id: 'Common', color: '#94a3b8', border: 'border-slate-500' },
    { id: 'Uncommon', color: '#22c55e', border: 'border-green-500' },
    { id: 'Rare', color: '#3b82f6', border: 'border-blue-500' },
    { id: 'Epic', color: '#a855f7', border: 'border-purple-500' },
    { id: 'Legendary', color: '#f97316', border: 'border-orange-500' },
];

export function CollectibleForm({ initialData, isEditing = false }: CollectibleFormProps) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [loading, setLoading] = useState(false);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [collectionSets, setCollectionSets] = useState<CollectionSet[]>([]);
  const [formData, setFormData] = useState<Partial<Collectible>>({
    name: "",
    lore: "",
    requirement: "",
    image_url: "",
    rarity: 'Common',
    type: "",
    generation: "",
    found_in: "",
    set_id: undefined,
    ...initialData
  });

  useEffect(() => {
    const fetchRelatedData = async () => {
      // Fetch achievements for linking
      const { data: achievementsData } = await supabase
        .from('achievements')
        .select('id, title')
        .order('title');
      if (achievementsData) setAchievements(achievementsData as Achievement[]);

      // Fetch collection sets
      const { data: setsData } = await supabase
        .from('collection_sets')
        .select('id, title')
        .order('title');
      if (setsData) setCollectionSets(setsData);
    };
    fetchRelatedData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === "" ? undefined : value
    }));
  };

  const handleImageUpload = (url: string) => {
    setFormData(prev => ({ ...prev, image_url: url }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Clean up the form data - remove empty strings and convert to proper types
      const cleanedData = {
        ...formData,
        set_id: formData.set_id || null,
      };

      if (isEditing && initialData?.id) {
        const { error } = await supabase
          .from('collectibles')
          .update(cleanedData)
          .eq('id', initialData.id);
        if (error) throw error;
        
        await logAdminAction(
            'update_collectible',
            'collectibles',
            initialData.id,
            { name: formData.name, changes: cleanedData }
        );

        success("Collectible updated!");
      } else {
        const { data, error } = await supabase
          .from('collectibles')
          .insert([cleanedData])
          .select('id')
          .single();
        if (error) throw error;
        
        await logAdminAction(
            'create_collectible',
            'collectibles',
            data.id,
            { name: formData.name }
        );
        
        success("Collectible created!");
      }
      router.push("/admin/collectibles");
      router.refresh();
    } catch (error) {
      logger.error("Failed to save collectible:", error);
      toastError("Failed to save collectible.");
    } finally {
      setLoading(false);
    }
  };

  const rarityColor = RARITY_TIERS.find(t => t.id === formData.rarity)?.color || '#94a3b8';

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/collectibles" className="p-2 rounded-full hover:bg-[#222] transition-colors">
            <ArrowLeft size={20} className="text-gray-400" />
        </Link>
        <div>
            <h1 className="text-3xl font-heading font-bold text-white">
                {isEditing ? "EDIT COLLECTIBLE" : "NEW COLLECTIBLE"}
            </h1>
            <p className="text-gray-500 font-mono text-sm">
                {isEditing ? "Update collectible details" : "Create a new digital artifact"}
            </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Form Fields */}
        <div className="space-y-6">
          <div className="space-y-4 bg-[#111] p-6 rounded-lg border border-[#333]">
            <h3 className="font-heading text-lg text-white flex items-center gap-2">
              <Gem size={18} className="text-primary" />
              Basic Info
            </h3>
            
            <div className="space-y-2">
                <label className="text-sm font-mono text-gray-400 uppercase">Name</label>
                <Input 
                    name="name"
                    value={formData.name} 
                    onChange={handleChange} 
                    placeholder="e.g. Quantum-Bulldog"
                    className="bg-[#222] border-[#333]"
                    required
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-mono text-gray-400 uppercase">Lore / Description</label>
                <textarea 
                    name="lore"
                    value={formData.lore || ""} 
                    onChange={handleChange} 
                    placeholder="The backstory of this artifact..."
                    rows={4}
                    className="flex min-h-[100px] w-full rounded-md border border-[#333] bg-[#222] px-3 py-2 text-sm text-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                />
            </div>

            <div className="space-y-2">
                <label className="text-sm font-mono text-gray-400 uppercase">Unlock Requirement</label>
                <Input 
                    name="requirement"
                    value={formData.requirement || ""} 
                    onChange={handleChange} 
                    placeholder="e.g. Complete 'First Splash' achievement"
                    className="bg-[#222] border-[#333]"
                />
            </div>
          </div>

          <div className="space-y-4 bg-[#111] p-6 rounded-lg border border-[#333]">
            <h3 className="font-heading text-lg text-white flex items-center gap-2">
              <Box size={18} className="text-primary" />
              Classification
            </h3>

            {/* Rarity Selector */}
            <div className="space-y-2">
                <label className="text-sm font-mono text-gray-400 uppercase">Rarity Tier</label>
                <div className="grid grid-cols-5 gap-1">
                    {RARITY_TIERS.map((tier) => (
                        <button
                            key={tier.id}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, rarity: tier.id as Collectible['rarity'] }))}
                            className={`text-[10px] uppercase font-bold py-2 rounded border transition-all ${
                                formData.rarity === tier.id 
                                ? `bg-white text-black border-white` 
                                : 'bg-[#222] text-gray-500 border-[#333] hover:border-gray-500'
                            }`}
                            style={{ color: formData.rarity === tier.id ? '#000' : tier.color }}
                        >
                            {tier.id.slice(0, 1)}
                        </button>
                    ))}
                </div>
                <p className="text-[10px] text-gray-500 text-right uppercase tracking-widest">{formData.rarity} Tier</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                  <label className="text-sm font-mono text-gray-400 uppercase">Type</label>
                  <Input 
                      name="type"
                      value={formData.type || ""} 
                      onChange={handleChange} 
                      placeholder="e.g. Companion, Vehicle"
                      className="bg-[#222] border-[#333]"
                  />
              </div>
              <div className="space-y-2">
                  <label className="text-sm font-mono text-gray-400 uppercase">Generation</label>
                  <Input 
                      name="generation"
                      value={formData.generation || ""} 
                      onChange={handleChange} 
                      placeholder="e.g. Gen-1, Mk-II"
                      className="bg-[#222] border-[#333]"
                  />
              </div>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-mono text-gray-400 uppercase">Found In / Location</label>
                <Input 
                    name="found_in"
                    value={formData.found_in || ""} 
                    onChange={handleChange} 
                    placeholder="e.g. Sector 7: Residential"
                    className="bg-[#222] border-[#333]"
                />
            </div>
          </div>

          <div className="space-y-4 bg-[#111] p-6 rounded-lg border border-[#333]">
            <h3 className="font-heading text-lg text-white flex items-center gap-2">
              <Sparkles size={18} className="text-primary" />
              Relationships
            </h3>

            <div className="space-y-2">
                <label className="text-sm font-mono text-gray-400 uppercase">Collection Set</label>
                <select 
                    name="set_id"
                    value={formData.set_id || ""} 
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-[#333] bg-[#222] px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                >
                    <option value="">No Set</option>
                    {collectionSets.map(set => (
                        <option key={set.id} value={set.id}>{set.title}</option>
                    ))}
                </select>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-mono text-gray-400 uppercase">Related Achievement</label>
                <select 
                    name="related_achievement_id"
                    value={(formData as Record<string, unknown>).related_achievement_id as string || ""} 
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-[#333] bg-[#222] px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                >
                    <option value="">No Linked Achievement</option>
                    {achievements.map(ach => (
                        <option key={ach.id} value={ach.id}>{ach.title}</option>
                    ))}
                </select>
                <p className="text-[10px] text-gray-600">Link to an achievement that unlocks this collectible</p>
            </div>
          </div>
        </div>

        {/* Right Column - Preview & Image */}
        <div className="space-y-6">
          <div className="space-y-4 bg-[#111] p-6 rounded-lg border border-[#333]">
            <h3 className="font-heading text-lg text-white">3D Trophy Preview</h3>
            <p className="text-xs text-gray-500 font-mono">Shows how this collectible will appear in the trophy room.</p>
            
            <div className="aspect-square bg-black/50 border border-[#222] rounded-lg overflow-hidden relative">
              <TrophyCanvas 
                size="large" 
                rarity={formData.rarity || 'Common'} 
                isInteractive={true}
                autoRotate={true}
              />
              
              {/* Rarity Badge Overlay */}
              <div className="absolute top-4 right-4 z-10">
                <span 
                  className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border bg-black/60 backdrop-blur-sm"
                  style={{ color: rarityColor, borderColor: rarityColor }}
                >
                  {formData.rarity}
                </span>
              </div>
            </div>
            
            <p className="text-[10px] text-gray-500 text-center">Drag to rotate • Scroll to zoom</p>
          </div>

          <div className="space-y-4 bg-[#111] p-6 rounded-lg border border-[#333]">
            <h3 className="font-heading text-lg text-white">Collectible Image</h3>
            <p className="text-xs text-gray-500 font-mono">Upload a 2D icon or preview image.</p>
            
            <div className="space-y-4">
              {formData.image_url && (
                <div className="relative w-full aspect-square max-w-[200px] mx-auto bg-[#222] rounded-lg overflow-hidden border border-[#333]">
                  <img 
                    src={formData.image_url} 
                    alt="Collectible preview" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <ImageUpload 
                onUpload={handleImageUpload}
                currentImage={formData.image_url}
              />
            </div>
          </div>

          {/* Card Preview */}
          <div className="space-y-4 bg-[#111] p-6 rounded-lg border border-[#333]">
            <h3 className="font-heading text-lg text-white">Card Preview</h3>
            
            <div 
              className="p-4 rounded-xl border transition-all"
              style={{ 
                borderColor: `${rarityColor}60`,
                background: `linear-gradient(135deg, ${rarityColor}10 0%, #111 50%, ${rarityColor}05 100%)`
              }}
            >
              <div className="flex items-start gap-4">
                <div 
                  className="w-14 h-14 rounded-xl flex shrink-0 items-center justify-center border-2"
                  style={{ 
                    backgroundColor: `${rarityColor}30`,
                    borderColor: `${rarityColor}60`,
                    color: rarityColor
                  }}
                >
                  {formData.image_url ? (
                    <img src={formData.image_url} alt="" className="w-10 h-10 object-cover rounded" />
                  ) : (
                    <Gem size={20} />
                  )}
                </div>
                
                <div className="min-w-0 flex-1">
                  <h3 className="font-heading font-bold text-sm mb-0.5 text-white">
                    {formData.name || "Untitled"}
                  </h3>
                  <p className="text-[10px] font-mono uppercase tracking-wide mb-1" style={{ color: rarityColor }}>
                    {formData.type || 'Artifact'}
                  </p>
                  <span 
                    className="inline-block text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border bg-black/30"
                    style={{ color: rarityColor, borderColor: rarityColor }}
                  >
                    {formData.rarity || 'Common'}
                  </span>
                </div>
              </div>

              <p className="text-xs text-gray-400 line-clamp-2 mt-3">
                {formData.lore || 'No lore available.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-[#333]">
        <Button 
            type="submit" 
            disabled={loading}
            className="bg-primary text-black hover:bg-white font-bold px-8"
        >
            {loading ? "SAVING..." : (
                <span className="flex items-center gap-2">
                    <Save size={18} />
                    {isEditing ? "UPDATE COLLECTIBLE" : "CREATE COLLECTIBLE"}
                </span>
            )}
        </Button>
      </div>
    </form>
  );
}
