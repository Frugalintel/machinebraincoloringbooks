"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Trophy, Brush, Star, Zap, Code, Lock, Medal, Crown, Gem, Rocket, Sword, Shield, Map, Heart, Smile } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Achievement, Product } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/context/toast-context";
import { logAdminAction } from "@/lib/admin-utils";
import { logger } from "@/lib/logger";

interface AchievementFormProps {
  initialData?: Achievement;
  isEditing?: boolean;
}

const RARITY_TIERS = [
    { id: 'Common', color: '#94a3b8', border: 'border-slate-500' },
    { id: 'Uncommon', color: '#22c55e', border: 'border-green-500' },
    { id: 'Rare', color: '#3b82f6', border: 'border-blue-500' },
    { id: 'Epic', color: '#a855f7', border: 'border-purple-500' },
    { id: 'Legendary', color: '#eab308', border: 'border-yellow-500' },
];

const ICON_OPTIONS = [
    { id: 'trophy', icon: Trophy },
    { id: 'medal', icon: Medal },
    { id: 'crown', icon: Crown },
    { id: 'star', icon: Star },
    { id: 'gem', icon: Gem },
    { id: 'zap', icon: Zap },
    { id: 'rocket', icon: Rocket },
    { id: 'sword', icon: Sword },
    { id: 'shield', icon: Shield },
    { id: 'map', icon: Map },
    { id: 'brush', icon: Brush },
    { id: 'code', icon: Code },
    { id: 'lock', icon: Lock },
    { id: 'heart', icon: Heart },
    { id: 'smile', icon: Smile },
];

const TRIGGER_TYPES = [
    { value: "purchase_count", label: "Total Purchases (Count)" },
    { value: "purchase_total", label: "Total Spent ($)" },
    { value: "purchase_product", label: "Buy Specific Product" },
    { value: "purchase_category", label: "Buy from Category" },
    { value: "code_count", label: "Enter Codes (Count)" },
    { value: "book_codes_complete", label: "Complete Book Codes" },
    { value: "collectible_count", label: "Unlock Collectibles (Count)" },
    { value: "set_complete", label: "Complete Collectible Sets" },
    { value: "story_unlocked", label: "Unlock Stories (Count)" },
    { value: "story_complete", label: "Complete Stories (Count)" },
    { value: "account_age_days", label: "Account Age (Days)" },
    { value: "secret_code", label: "Enter Secret Code" },
    { value: "manual", label: "Manual / Other" },
];

export function AchievementForm({ initialData, isEditing = false }: AchievementFormProps) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState<Partial<Achievement>>({
    title: "",
    description: "",
    icon: "trophy",
    target_value: 1,
    is_secret: false,
    trigger_type: "manual",
    trigger_config: {},
    rarity: 'Common',
    custom_color: "",
    ...initialData
  });

  useEffect(() => {
    const fetchProducts = async () => {
        const { data } = await supabase.from('products').select('id, title');
        if (data) setProducts(data as Product[]);
    };
    fetchProducts();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
               type === 'number' ? parseInt(value) : value
    }));
  };

  const handleConfigChange = (key: string, value: string | number | boolean) => {
      setFormData(prev => ({
          ...prev,
          trigger_config: { ...prev.trigger_config, [key]: value }
      }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditing && initialData?.id) {
        const { error } = await supabase
          .from('achievements')
          .update(formData)
          .eq('id', initialData.id);
        if (error) throw error;
        
        await logAdminAction(
            'update_achievement',
            'achievements',
            initialData.id,
            { title: formData.title, changes: formData }
        );

        success("Achievement updated!");
      } else {
        const { data, error } = await supabase
          .from('achievements')
          .insert([formData])
          .select('id')
          .single();
        if (error) throw error;
        
        await logAdminAction(
            'create_achievement',
            'achievements',
            data.id,
            { title: formData.title }
        );
        
        success("Achievement created!");
      }
      router.push("/admin/achievements");
      router.refresh();
    } catch (error) {
      logger.error("Failed to save achievement:", error);
      toastError("Failed to save achievement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/achievements" className="p-2 rounded-full hover:bg-[#222] transition-colors">
            <ArrowLeft size={20} className="text-gray-400" />
        </Link>
        <div>
            <h1 className="text-3xl font-heading font-bold text-white">
                {isEditing ? "EDIT ACHIEVEMENT" : "NEW ACHIEVEMENT"}
            </h1>
            <p className="text-gray-500 font-mono text-sm">
                {isEditing ? "Update achievement details" : "Create a new unlockable badge"}
            </p>
        </div>
      </div>

      <div className="space-y-4 bg-[#111] p-6 rounded-lg border border-[#333]">
        {/* Basic Info */}
        <div className="space-y-2">
            <label className="text-sm font-mono text-gray-400 uppercase">Title</label>
            <Input 
                name="title"
                value={formData.title} 
                onChange={handleChange} 
                placeholder="e.g. Master Collector"
                className="bg-[#222] border-[#333]"
                required
            />
        </div>

        <div className="space-y-2">
            <label className="text-sm font-mono text-gray-400 uppercase">Description</label>
            <textarea 
                name="description"
                value={formData.description} 
                onChange={handleChange} 
                placeholder="e.g. Collect all items in the starter set."
                className="flex min-h-[80px] w-full rounded-md border border-[#333] bg-[#222] px-3 py-2 text-sm text-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                required
            />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
                {/* Rarity Selector */}
                <div className="space-y-2">
                    <label className="text-sm font-mono text-gray-400 uppercase">Rarity Tier</label>
                    <div className="grid grid-cols-5 gap-1">
                        {RARITY_TIERS.map((tier) => (
                            <button
                                key={tier.id}
                                type="button"
                                onClick={() => handleChange({ target: { name: 'rarity', value: tier.id } } as any)}
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

                <div className="space-y-2">
                    <label className="text-sm font-mono text-gray-400 uppercase">Icon Type</label>
                    <div className="grid grid-cols-5 gap-2">
                        {ICON_OPTIONS.map((opt) => (
                            <button
                                key={opt.id}
                                type="button"
                                onClick={() => handleChange({ target: { name: 'icon', value: opt.id } } as any)}
                                className={`aspect-square flex items-center justify-center rounded border transition-all ${
                                    formData.icon === opt.id 
                                    ? 'bg-primary text-black border-primary' 
                                    : 'bg-[#222] text-gray-400 border-[#333] hover:border-gray-500 hover:text-white'
                                }`}
                            >
                                <opt.icon size={20} />
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-mono text-gray-400 uppercase">Target Value</label>
                        <Input 
                            type="number"
                            name="target_value"
                            value={formData.target_value} 
                            onChange={handleChange}
                            min={1}
                            className="bg-[#222] border-[#333]"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-mono text-gray-400 uppercase">Custom Color</label>
                        <div className="flex gap-2">
                            <input 
                                type="color" 
                                value={formData.custom_color || "#ffffff"}
                                onChange={(e) => handleChange({ target: { name: 'custom_color', value: e.target.value } } as any)}
                                className="h-10 w-10 p-0 border-0 rounded overflow-hidden cursor-pointer"
                            />
                            <Input 
                                type="text"
                                value={formData.custom_color || ""}
                                onChange={(e) => handleChange({ target: { name: 'custom_color', value: e.target.value } } as any)}
                                placeholder="#FFFFFF"
                                className="bg-[#222] border-[#333] font-mono uppercase"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Live Preview */}
            <div className="space-y-2">
                <label className="text-sm font-mono text-gray-400 uppercase">Unlock Notification Preview</label>
                <div className="bg-black/50 border border-[#333] p-8 rounded-lg flex items-center justify-center min-h-[300px] bg-[url('/textures/noise.svg')] bg-opacity-5 relative overflow-hidden">
                    
                    {/* Simulated Game UI Background */}
                    <div className="absolute inset-0 pointer-events-none opacity-20" 
                         style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                    </div>

                    <div 
                        className={`
                            relative overflow-hidden rounded-lg p-4 shadow-2xl flex items-center gap-4 w-full max-w-sm transform hover:scale-105 transition-all duration-500 group
                            bg-[#1a1a1a] border
                        `}
                        style={{
                            borderColor: formData.custom_color || RARITY_TIERS.find(t => t.id === formData.rarity)?.color || '#fff',
                            boxShadow: `0 0 30px ${formData.custom_color || RARITY_TIERS.find(t => t.id === formData.rarity)?.color || '#fff'}20`
                        }}
                    >
                        {/* Premium Glow Effect for High Rarity */}
                        {(formData.rarity === 'Epic' || formData.rarity === 'Legendary') && (
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                        )}
                        
                        {/* Side Accent Bar */}
                        <div 
                            className="absolute top-0 left-0 w-1 h-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                            style={{ backgroundColor: formData.custom_color || RARITY_TIERS.find(t => t.id === formData.rarity)?.color || '#fff' }}
                        ></div>
                        
                        <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center border shrink-0 relative z-10"
                            style={{ 
                                backgroundColor: `${formData.custom_color || RARITY_TIERS.find(t => t.id === formData.rarity)?.color || '#fff'}20`,
                                borderColor: `${formData.custom_color || RARITY_TIERS.find(t => t.id === formData.rarity)?.color || '#fff'}40`,
                                color: formData.custom_color || RARITY_TIERS.find(t => t.id === formData.rarity)?.color || '#fff'
                            }}
                        >
                            {(() => {
                                const Icon = ICON_OPTIONS.find(i => i.id === formData.icon)?.icon || Trophy;
                                return <Icon size={24} />;
                            })()}
                        </div>
                        
                        <div className="min-w-0 flex-1">
                            <h4 
                                className="text-[10px] font-mono uppercase tracking-widest mb-0.5 flex items-center justify-between"
                                style={{ color: formData.custom_color || RARITY_TIERS.find(t => t.id === formData.rarity)?.color || '#fff' }}
                            >
                                <span>Achievement Unlocked</span>
                                <span className="opacity-50">{formData.rarity}</span>
                            </h4>
                            <p className="text-white font-bold text-base truncate font-heading tracking-wide">{formData.title || "Untitled"}</p>
                            <p className="text-xs text-gray-400 truncate">{formData.description || "Description..."}</p>
                        </div>
                    </div>
                </div>
                <p className="text-[10px] text-gray-500 text-center">This is how it will appear to players in-game.</p>
            </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
            <input 
                type="checkbox" 
                id="is_secret" 
                name="is_secret"
                checked={formData.is_secret}
                onChange={(e) => setFormData({...formData, is_secret: e.target.checked})}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="is_secret" className="text-sm text-gray-300 select-none cursor-pointer">
                Secret Achievement (Hidden until unlocked)
            </label>
        </div>
      </div>

      {/* Trigger Configuration */}
      <div className="space-y-4 bg-[#111] p-6 rounded-lg border border-[#333]">
        <h3 className="font-heading text-xl text-white">Unlock Logic</h3>
        
        <div className="space-y-2">
            <label className="text-sm font-mono text-gray-400 uppercase">Trigger Type</label>
            <select 
                name="trigger_type"
                value={formData.trigger_type} 
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-[#333] bg-[#222] px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
            >
                {TRIGGER_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                ))}
            </select>
        </div>

        {/* Dynamic Fields based on Trigger */}
        {formData.trigger_type === 'purchase_product' && (
            <div className="space-y-2">
                <label className="text-sm font-mono text-gray-400 uppercase">Required Product</label>
                <select 
                    value={formData.trigger_config?.product_id || ""}
                    onChange={(e) => handleConfigChange('product_id', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-[#333] bg-[#222] px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                >
                    <option value="">Select a product...</option>
                    {products.map(p => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                </select>
            </div>
        )}

        {formData.trigger_type === 'purchase_category' && (
             <div className="space-y-2">
                <label className="text-sm font-mono text-gray-400 uppercase">Category</label>
                <Input 
                    value={formData.trigger_config?.category || ""}
                    onChange={(e) => handleConfigChange('category', e.target.value)}
                    placeholder="e.g. HOLIDAY, SCI-FI"
                    className="bg-[#222] border-[#333]"
                />
            </div>
        )}

        {formData.trigger_type === 'secret_code' && (
             <div className="space-y-2">
                <label className="text-sm font-mono text-gray-400 uppercase">Secret Code</label>
                <Input 
                    value={formData.trigger_config?.code || ""}
                    onChange={(e) => handleConfigChange('code', e.target.value)}
                    placeholder="e.g. KONAMI"
                    className="bg-[#222] border-[#333]"
                />
            </div>
        )}

         {/* Default Count/Amount Config */}
         {['purchase_count', 'purchase_total', 'code_count', 'collectible_count', 'set_complete', 'story_unlocked', 'story_complete', 'account_age_days'].includes(formData.trigger_type || "") && (
             <div className="p-4 bg-[#1a1a1a] rounded text-gray-400 text-sm font-mono">
                This achievement will trigger when the {formData.trigger_type?.replace('_', ' ')} reaches <strong>{formData.target_value}</strong>.
             </div>
         )}
      </div>

      <div className="flex justify-end pt-4">
        <Button 
            type="submit" 
            disabled={loading}
            className="bg-primary text-black hover:bg-white font-bold px-8"
        >
            {loading ? "SAVING..." : (
                <span className="flex items-center gap-2">
                    <Save size={18} />
                    {isEditing ? "UPDATE ACHIEVEMENT" : "CREATE ACHIEVEMENT"}
                </span>
            )}
        </Button>
      </div>
    </form>
  );
}
