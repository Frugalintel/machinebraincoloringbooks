"use client";

import { useState, useEffect, use } from "react";
import { Save, ArrowLeft, Loader2, User, ShoppingCart, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CampaignSettings, CampaignTheme } from "@/lib/types";
import { useToast } from "@/context/toast-context";
import { CAMPAIGN_TEMPLATES } from "@/lib/campaign-templates";
import { logger } from "@/lib/logger";

// Default settings for new/fallback
const DEFAULT_CAMPAIGN: CampaignSettings = {
  isActive: false,
  name: "New Campaign",
  discount: {
    enabled: false,
    type: 'percentage',
    value: 0,
    scope: 'global'
  },
  banner: {
    enabled: false,
    text: "Special Offer!",
    link: "/store",
    backgroundColor: "#e63946",
    textColor: "#ffffff"
  },
  theme: CAMPAIGN_TEMPLATES.default,
  featuredProductId: undefined
};

export default function CampaignEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { success, error: toastError } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [campaign, setCampaign] = useState<CampaignSettings>(DEFAULT_CAMPAIGN);

  useEffect(() => {
    fetchCampaign();
  }, [id]);

  const fetchCampaign = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      if (data) {
        // Merge DB columns and JSON settings into full CampaignSettings object
        setCampaign({
          ...DEFAULT_CAMPAIGN,
          ...data.settings,
          name: data.name,
          isActive: data.is_active
        });
      }
    } catch (error) {
      logger.error("Error fetching campaign:", error);
      toastError("Failed to load campaign");
      router.push('/admin/discounts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Split full object into columns and settings JSON
      const { name, isActive, ...settings } = campaign;
      
      const { error } = await supabase
        .from('campaigns')
        .update({
          name,
          is_active: isActive,
          settings: settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      
      success("Campaign saved successfully");
    } catch (error) {
      logger.error("Error saving campaign:", error);
      toastError(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyTemplate = (template: CampaignTheme) => {
    setCampaign(prev => ({
      ...prev,
      theme: template,
      banner: {
        ...prev.banner,
        backgroundColor: template.colors.accent || prev.banner.backgroundColor,
        textColor: template.colors.background === '#000000' ? '#ffffff' : '#000000'
      }
    }));
  };

  if (isLoading) {
    return (
        <div className="flex h-[50vh] items-center justify-center">
            <Loader2 className="animate-spin text-primary" size={32} />
        </div>
    );
  }

  return (
    <div className="container mx-auto pb-20 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pt-4">
            <div className="flex items-center gap-4">
                <Link href="/admin/discounts" className="p-2 hover:bg-[#222] rounded-full transition-colors text-gray-400 hover:text-white">
                    <ArrowLeft size={24} />
                </Link>
                <div>
                    <h1 className="text-3xl font-heading font-bold text-white">Edit Campaign</h1>
                    <p className="text-gray-400 font-mono text-xs uppercase tracking-widest mt-1">
                        {campaign.name}
                    </p>
                </div>
            </div>
            <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 bg-primary text-black px-6 py-3 rounded font-bold hover:bg-white transition-colors disabled:opacity-50"
            >
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                <span>SAVE CHANGES</span>
            </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Form Controls */}
            <div className="lg:col-span-2 space-y-8">
                
                {/* 1. Basic Info */}
                <div className="bg-[#111] border border-[#333] rounded-xl p-6">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary text-black flex items-center justify-center text-xs font-bold">1</span>
                        Basic Information
                    </h3>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-mono uppercase tracking-widest text-gray-500">Campaign Name</label>
                            <input 
                                type="text" 
                                value={campaign.name}
                                onChange={(e) => setCampaign({...campaign, name: e.target.value})}
                                className="w-full bg-[#222] border border-[#333] rounded px-4 py-3 text-white focus:outline-none focus:border-primary text-lg font-bold"
                                placeholder="Summer Sale 2025"
                            />
                        </div>
                    </div>
                </div>

                {/* 2. Visual Theme */}
                <div className="bg-[#111] border border-[#333] rounded-xl p-6">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary text-black flex items-center justify-center text-xs font-bold">2</span>
                        Visual Theme
                    </h3>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {Object.entries(CAMPAIGN_TEMPLATES).map(([key, template]) => (
                            <button
                                key={key}
                                onClick={() => handleApplyTemplate(template)}
                                className={`relative group p-3 rounded-lg border text-left transition-all ${
                                    campaign.theme?.name === template.name 
                                    ? 'border-primary bg-[#222] ring-1 ring-primary' 
                                    : 'border-[#333] bg-[#1a1a1a] hover:border-gray-500'
                                }`}
                            >
                                <div className="aspect-video w-full rounded mb-2 overflow-hidden border border-white/10" style={{ backgroundColor: template.colors.background }}>
                                    <div className="w-full h-full flex items-center justify-center">
                                        <div className="text-[10px] font-bold" style={{ color: template.colors.primary }}>Abc</div>
                                    </div>
                                </div>
                                <div className="text-xs font-bold text-white truncate">{template.name}</div>
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <label className="text-xs font-mono uppercase tracking-widest text-gray-500">Texture</label>
                            <select
                                value={campaign.theme?.texture || 'none'}
                                onChange={(e) => setCampaign({
                                    ...campaign,
                                    theme: { ...campaign.theme!, texture: e.target.value as any }
                                })}
                                className="w-full bg-[#222] border border-[#333] rounded px-4 py-2 text-white focus:outline-none focus:border-primary"
                            >
                                <option value="none">None</option>
                                <option value="noise">Grainy Noise</option>
                                <option value="grid">Cyber Grid</option>
                                <option value="dots">Halftone Dots</option>
                                <option value="scanlines">CRT Scanlines</option>
                            </select>
                         </div>
                         <div className="space-y-2">
                            <label className="text-xs font-mono uppercase tracking-widest text-gray-500">Animation</label>
                            <select
                                value={campaign.theme?.animation || 'none'}
                                onChange={(e) => setCampaign({
                                    ...campaign,
                                    theme: { ...campaign.theme!, animation: e.target.value as any }
                                })}
                                className="w-full bg-[#222] border border-[#333] rounded px-4 py-2 text-white focus:outline-none focus:border-primary"
                            >
                                <option value="none">None</option>
                                <option value="marquee">Marquee Scroll</option>
                                <option value="pulse">Pulse Breath</option>
                                <option value="glitch">Cyber Glitch</option>
                            </select>
                         </div>
                    </div>
                </div>

                {/* 3. Banner Settings */}
                <div className="bg-[#111] border border-[#333] rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-primary text-black flex items-center justify-center text-xs font-bold">3</span>
                            Banner Strip
                        </h3>
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-mono uppercase text-gray-500">Enabled</label>
                            <button 
                                onClick={() => setCampaign({...campaign, banner: {...campaign.banner, enabled: !campaign.banner.enabled}})}
                                className={`w-10 h-6 rounded-full transition-colors relative ${campaign.banner.enabled ? 'bg-primary' : 'bg-[#333]'}`}
                            >
                                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-black transition-transform ${campaign.banner.enabled ? 'translate-x-4' : ''}`} />
                            </button>
                        </div>
                    </div>

                    {campaign.banner.enabled ? <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                             <div className="space-y-2">
                                <label className="text-xs font-mono uppercase tracking-widest text-gray-500">Banner Text</label>
                                <input 
                                    type="text" 
                                    value={campaign.banner.text}
                                    onChange={(e) => setCampaign({...campaign, banner: {...campaign.banner, text: e.target.value}})}
                                    className="w-full bg-[#222] border border-[#333] rounded px-4 py-2 text-white focus:outline-none focus:border-primary"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-mono uppercase tracking-widest text-gray-500">Background Image URL</label>
                                <input 
                                    type="text" 
                                    value={campaign.banner.backgroundImage || ""}
                                    onChange={(e) => setCampaign({...campaign, banner: {...campaign.banner, backgroundImage: e.target.value}})}
                                    className="w-full bg-[#222] border border-[#333] rounded px-4 py-2 text-white text-xs font-mono focus:outline-none focus:border-primary"
                                    placeholder="https://..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-mono uppercase tracking-widest text-gray-500">Pattern</label>
                                    <select
                                        value={campaign.banner.pattern || 'none'}
                                        onChange={(e) => setCampaign({...campaign, banner: {...campaign.banner, pattern: e.target.value as any}})}
                                        className="w-full bg-[#222] border border-[#333] rounded px-4 py-2 text-white focus:outline-none focus:border-primary"
                                    >
                                        <option value="none">None</option>
                                        <option value="caution">Caution Lines</option>
                                        <option value="grid">Grid Mesh</option>
                                        <option value="dots">Polka Dots</option>
                                        <option value="gradient">Subtle Gradient</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-mono uppercase tracking-widest text-gray-500">Colors</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="color" 
                                            value={campaign.banner.backgroundColor}
                                            onChange={(e) => setCampaign({...campaign, banner: {...campaign.banner, backgroundColor: e.target.value}})}
                                            className="h-10 w-full rounded cursor-pointer border-0 p-0"
                                            title="Background"
                                        />
                                        <input 
                                            type="color" 
                                            value={campaign.banner.textColor}
                                            onChange={(e) => setCampaign({...campaign, banner: {...campaign.banner, textColor: e.target.value}})}
                                            className="h-10 w-full rounded cursor-pointer border-0 p-0"
                                            title="Text"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div> : null}
                </div>

                {/* 4. Global Discount */}
                <div className="bg-[#111] border border-[#333] rounded-xl p-6">
                     <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-primary text-black flex items-center justify-center text-xs font-bold">4</span>
                            Store-wide Discount
                        </h3>
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-mono uppercase text-gray-500">Enabled</label>
                            <button 
                                onClick={() => setCampaign({...campaign, discount: {...campaign.discount, enabled: !campaign.discount.enabled}})}
                                className={`w-10 h-6 rounded-full transition-colors relative ${campaign.discount.enabled ? 'bg-primary' : 'bg-[#333]'}`}
                            >
                                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-black transition-transform ${campaign.discount.enabled ? 'translate-x-4' : ''}`} />
                            </button>
                        </div>
                    </div>

                    {campaign.discount.enabled ? <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                            <div className="space-y-2">
                                <label className="text-xs font-mono uppercase tracking-widest text-gray-500">Value</label>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="number" 
                                        value={campaign.discount.value}
                                        onChange={(e) => setCampaign({...campaign, discount: {...campaign.discount, value: Number(e.target.value)}})}
                                        className="w-full bg-[#222] border border-[#333] rounded px-4 py-2 text-white focus:outline-none focus:border-primary"
                                    />
                                    <span className="font-bold text-gray-400">%</span>
                                </div>
                            </div>
                        </div> : null}
                </div>
            </div>

            {/* Right Column: Live Preview */}
            <div className="lg:col-span-1">
                <div className="sticky top-8 space-y-4">
                    <h3 className="text-xs font-mono uppercase tracking-widest text-gray-500">Live Preview</h3>
                    
                    {/* Preview Container */}
                    <div className="w-full border border-[#333] rounded-xl overflow-hidden bg-black relative shadow-2xl">
                         {/* CSS Injection */}
                         <style jsx>{`
                            @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
                            @keyframes glitch { 0% { transform: translate(0); } 20% { transform: translate(-2px, 2px); } 40% { transform: translate(-2px, -2px); } 60% { transform: translate(2px, 2px); } 80% { transform: translate(2px, -2px); } 100% { transform: translate(0); } }
                            .animate-marquee { animation: marquee 10s linear infinite; white-space: nowrap; display: inline-block; min-width: 100%; }
                            .animate-glitch { animation: glitch 0.5s cubic-bezier(.25, .46, .45, .94) infinite; }
                            .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
                            @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
                            .pattern-caution { background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.1) 10px, rgba(0,0,0,0.1) 20px); }
                            .pattern-grid { background-image: linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px); background-size: 10px 10px; }
                            .pattern-dots { background-image: radial-gradient(rgba(255,255,255,0.2) 1px, transparent 1px); background-size: 8px 8px; }
                            .pattern-gradient { background-image: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent); }
                        `}</style>

                        {/* Banner */}
                        {campaign.banner.enabled ? <div 
                                className={`w-full py-1 text-center text-[10px] font-bold font-heading uppercase tracking-widest relative z-20 overflow-hidden ${
                                    campaign.theme?.animation === 'pulse' ? 'animate-pulse' : ''
                                } ${campaign.banner.pattern ? `pattern-${campaign.banner.pattern}` : ''}`}
                                style={{
                                    backgroundColor: campaign.banner.backgroundColor,
                                    color: campaign.banner.textColor,
                                    backgroundImage: campaign.banner.backgroundImage ? `url(${campaign.banner.backgroundImage})` : undefined,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                }}
                            >
                                {campaign.banner.backgroundImage ? <div className="absolute inset-0 bg-black/40 -z-10"></div> : null}
                                <div className={
                                    campaign.theme?.animation === 'marquee' ? 'animate-marquee' : 
                                    campaign.theme?.animation === 'glitch' ? 'animate-glitch' : ''
                                }>
                                    {campaign.banner.text}
                                </div>
                            </div> : null}

                        {/* Mock Navbar */}
                        <div className="h-12 bg-black/80 backdrop-blur-sm border-b border-[#222] flex items-center justify-between px-4 relative z-10">
                            <div className="font-heading font-bold text-white text-sm">MACHINE BRAIN</div>
                            <div className="flex gap-2">
                                <div className="w-4 h-4 rounded-full bg-[#222] flex items-center justify-center"><User size={8} /></div>
                            </div>
                        </div>

                        {/* Mock Hero */}
                        <div className="h-48 bg-[#050505] relative flex items-center justify-center overflow-hidden"
                            style={{ backgroundColor: campaign.theme?.colors.background }}
                        >
                            {/* Texture Overlay */}
                            {campaign.theme?.texture === 'noise' && <div className="absolute inset-0 bg-[url('/textures/noise.svg')] opacity-20"></div>}
                            {campaign.theme?.texture === 'grid' && <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px]"></div>}
                            
                            <div className="text-center z-10">
                                <div className="text-xs mb-1 tracking-widest font-mono" style={{ color: campaign.theme?.colors.primary }}>
                                    {campaign.name.toUpperCase()}
                                </div>
                                <div className="text-2xl font-heading font-bold text-white uppercase" style={{ fontFamily: campaign.theme?.fonts?.heading }}>
                                    EXPLORE
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}

