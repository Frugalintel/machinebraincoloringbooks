"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { PromoCode, CampaignSettings, CampaignTheme, Product } from "@/lib/types";
import { Plus, Trash2, X, AlertTriangle, Save, Wand2, Search } from "lucide-react";
import { useToast } from "@/context/toast-context";
import { useSettings } from "@/context/settings-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CAMPAIGN_TEMPLATES } from "@/lib/campaign-templates";
import { logAdminAction } from "@/lib/admin-utils";

export default function DiscountsPage() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const { success, error: toastError } = useToast();
  const { campaign, updateCampaign, isLoading: isSettingsLoading } = useSettings();
  
  // Local campaign state for editing
  const [localCampaign, setLocalCampaign] = useState<CampaignSettings>(campaign);

  // Sync local state when campaign loads
  useEffect(() => {
    if (campaign) {
        setLocalCampaign(campaign);
    }
  }, [campaign]);

  // New code state
  const [newCode, setNewCode] = useState<Partial<PromoCode>>({
      code: "",
      discount_percent: 10,
      usage_limit: 100,
      is_active: true
  });

  useEffect(() => {
    fetchCodes();
    fetchProducts();
  }, []);

  const fetchCodes = async () => {
    setIsLoading(true);
    try {
        const { data, error } = await supabase
            .from('promo_codes')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (data) setCodes(data);
        if (error) console.error("Error", error);
    } catch (error) {
        console.error("Error fetching codes:", error);
    } finally {
        setIsLoading(false);
    }
  };

  const fetchProducts = async () => {
      try {
          const { data, error } = await supabase
            .from('products')
            .select('id, title, subtitle')
            .eq('is_published', true)
            .order('title', { ascending: true });
          
          if (data) setProducts(data as Product[]);
      } catch (error) {
          console.error("Error fetching products:", error);
      }
  };

  const handleCreateCode = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          const { data, error } = await supabase
            .from('promo_codes')
            .insert([newCode])
            .select();
          
          if (error) throw error;
          
          await logAdminAction(
              'create_promo_code',
              'promo_codes',
              data[0].id,
              { code: newCode.code, discount: newCode.discount_percent }
          );

          if (data) setCodes([...data, ...codes]);
          setIsCreating(false);
          setNewCode({ code: "", discount_percent: 10, usage_limit: 100, is_active: true });
          success("Promo code created successfully.");
      } catch (error: any) {
          console.error("Error creating code:", error);
          toastError(error.message || "Failed to create code");
      }
  };

  const toggleCodeStatus = async (id: string, currentStatus: boolean) => {
      try {
          const { error } = await supabase
            .from('promo_codes')
            .update({ is_active: !currentStatus })
            .eq('id', id);
          
          if (error) throw error;
          
          const code = codes.find(c => c.id === id);
          await logAdminAction(
              !currentStatus ? 'activate_promo_code' : 'deactivate_promo_code',
              'promo_codes',
              id,
              { code: code?.code }
          );

          setCodes(codes.map(c => c.id === id ? { ...c, is_active: !currentStatus } : c));
          success(`Promo code ${!currentStatus ? 'activated' : 'disabled'}.`);
      } catch (error) {
          console.error("Error updating status:", error);
          toastError("Failed to update status.");
      }
  };
  
  const deleteCode = async (id: string) => {
      if(!confirm("Delete this promo code?")) return;
      try {
          const code = codes.find(c => c.id === id);
          const { error } = await supabase.from('promo_codes').delete().eq('id', id);
          if (error) throw error;
          
          await logAdminAction(
              'delete_promo_code',
              'promo_codes',
              id,
              { code: code?.code }
          );

          setCodes(codes.filter(c => c.id !== id));
          success("Promo code deleted.");
      } catch (error) {
          console.error("Error deleting code:", error);
          toastError("Failed to delete code.");
      }
  }

  const handleSaveCampaign = async () => {
      const { error } = await updateCampaign(localCampaign);
      if (error) {
          toastError("Failed to save campaign settings.");
      } else {
          await logAdminAction(
              'update_campaign',
              'settings',
              null,
              { name: localCampaign.name, active: localCampaign.isActive }
          );
          success("Campaign updated successfully.");
      }
  };

  const applyTemplate = (templateKey: string) => {
      const template = CAMPAIGN_TEMPLATES[templateKey];
      if (!template) return;

      setLocalCampaign(prev => ({
          ...prev,
          name: template.text.heroTitle,
          theme: template,
          banner: {
              ...prev.banner,
              text: `${template.text.heroTitle} • ${template.text.heroTag}`,
              backgroundColor: template.colors.primary,
              textColor: template.colors.text
          }
      }));
      success(`Applied ${templateKey.replace('_', ' ')} template.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h2 className="text-3xl font-heading font-bold mb-1">DISCOUNTS</h2>
            <p className="text-gray-500 font-mono text-sm">Manage campaigns and promo codes.</p>
        </div>
      </div>

      <Tabs defaultValue="campaigns" className="w-full">
        <TabsList className="bg-[#111] border border-[#333] mb-6">
            <TabsTrigger value="campaigns" className="data-[state=active]:bg-primary data-[state=active]:text-black font-mono uppercase tracking-wider text-xs">Global Campaigns</TabsTrigger>
            <TabsTrigger value="codes" className="data-[state=active]:bg-primary data-[state=active]:text-black font-mono uppercase tracking-wider text-xs">Promo Codes</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            
            {/* Campaign Overview */}
            <div className="bg-[#111] border border-[#333] p-6 rounded-lg">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            Store Campaign
                            {localCampaign.isActive && <span className="text-[10px] bg-green-900/20 text-green-500 px-2 py-0.5 rounded border border-green-900/50 uppercase tracking-widest">Active</span>}
                        </h3>
                        <p className="text-gray-500 text-sm mt-1">Configure global sales and banners.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={localCampaign.isActive}
                            onChange={(e) => setLocalCampaign({...localCampaign, isActive: e.target.checked})}
                            className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-mono uppercase tracking-widest text-gray-500">Campaign Name</label>
                            <input 
                                type="text" 
                                value={localCampaign.name}
                                onChange={(e) => setLocalCampaign({...localCampaign, name: e.target.value})}
                                className="w-full bg-[#222] border border-[#333] rounded px-4 py-2 text-white focus:outline-none focus:border-primary"
                                placeholder="Summer Sale"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-mono uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                <Wand2 size={12} className="text-primary" /> Template Preset
                            </label>
                            <select 
                                onChange={(e) => applyTemplate(e.target.value)}
                                className="w-full bg-[#222] border border-[#333] rounded px-4 py-2 text-white focus:outline-none focus:border-primary"
                                defaultValue=""
                            >
                                <option value="" disabled>Select a holiday template...</option>
                                {Object.keys(CAMPAIGN_TEMPLATES).map((key) => (
                                    <option key={key} value={key}>
                                        {key.replace(/_/g, ' ').toUpperCase()}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-mono uppercase tracking-widest text-gray-500 flex items-center gap-2">
                            <Search size={12} className="text-primary" /> Featured Product (Hero)
                        </label>
                        <select 
                            value={localCampaign.featuredProductId || ""}
                            onChange={(e) => setLocalCampaign({...localCampaign, featuredProductId: e.target.value || undefined})}
                            className="w-full bg-[#222] border border-[#333] rounded px-4 py-2 text-white focus:outline-none focus:border-primary"
                        >
                            <option value="">Default (Newest / Holiday)</option>
                            {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.title} {p.subtitle ? `- ${p.subtitle}` : ''}
                                </option>
                            ))}
                        </select>
                        <p className="text-[10px] text-gray-500">This product will be highlighted in the Hero section when the campaign is active.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Discount Settings */}
                <div className="bg-[#111] border border-[#333] p-6 rounded-lg space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-[#222]">
                        <h4 className="font-heading text-lg">Discount Rules</h4>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <span className={`text-xs font-mono uppercase ${localCampaign.discount.enabled ? 'text-white' : 'text-gray-600'}`}>Enable</span>
                            <input 
                                type="checkbox"
                                className="accent-primary"
                                checked={localCampaign.discount.enabled}
                                onChange={(e) => setLocalCampaign({
                                    ...localCampaign, 
                                    discount: { ...localCampaign.discount, enabled: e.target.checked }
                                })}
                            />
                        </label>
                    </div>

                    <div className={`space-y-4 transition-opacity ${localCampaign.discount.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-mono uppercase tracking-widest text-gray-500">Type</label>
                                <select 
                                    value={localCampaign.discount.type}
                                    onChange={(e) => setLocalCampaign({
                                        ...localCampaign,
                                        discount: { ...localCampaign.discount, type: e.target.value as 'percentage' | 'fixed' }
                                    })}
                                    className="w-full bg-[#222] border border-[#333] rounded px-4 py-2 text-white focus:outline-none focus:border-primary"
                                >
                                    <option value="percentage">Percentage (%)</option>
                                    <option value="fixed">Fixed Amount ($)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-mono uppercase tracking-widest text-gray-500">Value</label>
                                <input 
                                    type="number"
                                    min="0"
                                    value={localCampaign.discount.value}
                                    onChange={(e) => setLocalCampaign({
                                        ...localCampaign,
                                        discount: { ...localCampaign.discount, value: parseFloat(e.target.value) || 0 }
                                    })}
                                    className="w-full bg-[#222] border border-[#333] rounded px-4 py-2 text-white focus:outline-none focus:border-primary"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-mono uppercase tracking-widest text-gray-500">Scope</label>
                            <div className="grid grid-cols-3 gap-2">
                                {['global', 'category', 'collection'].map((scope) => (
                                    <button
                                        key={scope}
                                        onClick={() => setLocalCampaign({
                                            ...localCampaign,
                                            discount: { ...localCampaign.discount, scope: scope as any }
                                        })}
                                        className={`px-2 py-2 text-[10px] font-mono uppercase border rounded transition-colors ${
                                            localCampaign.discount.scope === scope
                                            ? 'bg-primary text-black border-primary font-bold'
                                            : 'bg-[#222] text-gray-400 border-[#333] hover:border-gray-500'
                                        }`}
                                    >
                                        {scope}
                                    </button>
                                ))}
                            </div>
                            {localCampaign.discount.scope !== 'global' && (
                                <p className="text-[10px] text-yellow-500 pt-1">
                                    <AlertTriangle size={10} className="inline mr-1" />
                                    Target selection coming soon. Currently applies globally.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Banner Settings */}
                <div className="bg-[#111] border border-[#333] p-6 rounded-lg space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-[#222]">
                        <h4 className="font-heading text-lg">Banner Configuration</h4>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <span className={`text-xs font-mono uppercase ${localCampaign.banner.enabled ? 'text-white' : 'text-gray-600'}`}>Enable</span>
                            <input 
                                type="checkbox"
                                className="accent-primary"
                                checked={localCampaign.banner.enabled}
                                onChange={(e) => setLocalCampaign({
                                    ...localCampaign, 
                                    banner: { ...localCampaign.banner, enabled: e.target.checked }
                                })}
                            />
                        </label>
                    </div>

                    <div className={`space-y-4 transition-opacity ${localCampaign.banner.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                        <div className="space-y-2">
                            <label className="text-xs font-mono uppercase tracking-widest text-gray-500">Banner Text</label>
                            <input 
                                type="text" 
                                value={localCampaign.banner.text}
                                onChange={(e) => setLocalCampaign({
                                    ...localCampaign,
                                    banner: { ...localCampaign.banner, text: e.target.value }
                                })}
                                className="w-full bg-[#222] border border-[#333] rounded px-4 py-2 text-white focus:outline-none focus:border-primary"
                                placeholder="Black Friday Sale • 50% OFF"
                            />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-mono uppercase tracking-widest text-gray-500">Background Color</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="color" 
                                        value={localCampaign.banner.backgroundColor}
                                        onChange={(e) => setLocalCampaign({
                                            ...localCampaign,
                                            banner: { ...localCampaign.banner, backgroundColor: e.target.value }
                                        })}
                                        className="h-10 w-10 p-0 border-0 rounded overflow-hidden cursor-pointer"
                                    />
                                    <input 
                                        type="text" 
                                        value={localCampaign.banner.backgroundColor}
                                        onChange={(e) => setLocalCampaign({
                                            ...localCampaign,
                                            banner: { ...localCampaign.banner, backgroundColor: e.target.value }
                                        })}
                                        className="flex-1 bg-[#222] border border-[#333] rounded px-3 py-2 text-xs font-mono"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-mono uppercase tracking-widest text-gray-500">Text Color</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="color" 
                                        value={localCampaign.banner.textColor}
                                        onChange={(e) => setLocalCampaign({
                                            ...localCampaign,
                                            banner: { ...localCampaign.banner, textColor: e.target.value }
                                        })}
                                        className="h-10 w-10 p-0 border-0 rounded overflow-hidden cursor-pointer"
                                    />
                                    <input 
                                        type="text" 
                                        value={localCampaign.banner.textColor}
                                        onChange={(e) => setLocalCampaign({
                                            ...localCampaign,
                                            banner: { ...localCampaign.banner, textColor: e.target.value }
                                        })}
                                        className="flex-1 bg-[#222] border border-[#333] rounded px-3 py-2 text-xs font-mono"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-mono uppercase tracking-widest text-gray-500">Link URL</label>
                            <input 
                                type="text" 
                                value={localCampaign.banner.link}
                                onChange={(e) => setLocalCampaign({
                                    ...localCampaign,
                                    banner: { ...localCampaign.banner, link: e.target.value }
                                })}
                                className="w-full bg-[#222] border border-[#333] rounded px-4 py-2 text-white focus:outline-none focus:border-primary"
                            />
                        </div>

                        <div className="space-y-2 pt-2 border-t border-[#222]">
                            <label className="text-xs font-mono uppercase tracking-widest text-gray-500 flex justify-between">
                                <span>Advanced CSS (Optional)</span>
                                <span className="text-[9px] bg-[#222] px-1 rounded text-primary">MAX CUSTOM</span>
                            </label>
                            <textarea 
                                value={localCampaign.banner.customCss || ''}
                                onChange={(e) => setLocalCampaign({
                                    ...localCampaign,
                                    banner: { ...localCampaign.banner, customCss: e.target.value }
                                })}
                                className="w-full bg-[#222] border border-[#333] rounded px-4 py-2 text-white font-mono text-xs focus:outline-none focus:border-primary min-h-[80px]"
                                placeholder="background: linear-gradient(90deg, red, blue); font-weight: 900;"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button 
                    onClick={handleSaveCampaign}
                    disabled={isSettingsLoading}
                    className="flex items-center gap-2 bg-primary text-black px-8 py-3 rounded font-bold hover:bg-white transition-colors disabled:opacity-50"
                >
                    {isSettingsLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-black"></div>
                    ) : (
                        <Save size={18} />
                    )}
                    <span>SAVE CAMPAIGN</span>
                </button>
            </div>
        </TabsContent>

        <TabsContent value="codes" className="animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-end mb-4">
                <button 
                    onClick={() => setIsCreating(true)}
                    className="flex items-center justify-center gap-2 bg-primary text-black px-6 py-3 rounded font-bold hover:bg-white transition-colors"
                >
                    <Plus size={18} />
                    <span>NEW CODE</span>
                </button>
            </div>

            {isCreating && (
                <div className="bg-[#111] border border-[#333] p-6 rounded-lg mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-xl">Create New Code</h3>
                        <button onClick={() => setIsCreating(false)}><X size={20} /></button>
                    </div>
                    <form onSubmit={handleCreateCode} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-2">
                            <label className="text-xs font-mono uppercase tracking-widest text-gray-500">Code Name</label>
                            <input 
                                type="text" 
                                required
                                value={newCode.code}
                                onChange={e => setNewCode({...newCode, code: e.target.value.toUpperCase()})}
                                className="w-full bg-[#222] border border-[#333] rounded px-4 py-2 font-mono uppercase"
                                placeholder="SUMMER2025"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-mono uppercase tracking-widest text-gray-500">Discount %</label>
                            <input 
                                type="number" 
                                required
                                min="1" max="100"
                                value={newCode.discount_percent}
                                onChange={e => setNewCode({...newCode, discount_percent: parseInt(e.target.value) || 0})}
                                className="w-full bg-[#222] border border-[#333] rounded px-4 py-2"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-mono uppercase tracking-widest text-gray-500">Usage Limit</label>
                            <input 
                                type="number" 
                                min="0"
                                value={newCode.usage_limit}
                                onChange={e => setNewCode({...newCode, usage_limit: parseInt(e.target.value) || 0})}
                                className="w-full bg-[#222] border border-[#333] rounded px-4 py-2"
                            />
                        </div>
                        <button type="submit" className="bg-white text-black font-bold px-4 py-2 rounded h-10 hover:bg-gray-200">
                            CREATE
                        </button>
                    </form>
                </div>
            )}

            {isLoading ? (
                <div className="text-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-500 font-mono">Loading discounts...</p>
                </div>
            ) : (
                <div className="bg-[#111] border border-[#333] rounded-lg overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#1a1a1a] text-gray-500 font-mono text-xs uppercase tracking-widest">
                            <tr>
                                <th className="p-4 font-normal">Code</th>
                                <th className="p-4 font-normal">Discount</th>
                                <th className="p-4 font-normal">Usage</th>
                                <th className="p-4 font-normal">Status</th>
                                <th className="p-4 font-normal text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#333]">
                            {codes.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500">No promo codes active.</td>
                                </tr>
                            )}
                            {codes.map((code) => (
                                <tr key={code.id} className="hover:bg-[#1a1a1a] transition-colors">
                                    <td className="p-4 font-mono font-bold text-lg">{code.code}</td>
                                    <td className="p-4 text-green-500 font-bold">{code.discount_percent}% OFF</td>
                                    <td className="p-4 font-mono text-sm text-gray-400">
                                        {code.usage_count} / {code.usage_limit || '∞'}
                                    </td>
                                    <td className="p-4">
                                        <button 
                                            onClick={() => toggleCodeStatus(code.id, code.is_active)}
                                            className={`text-[10px] uppercase border px-2 py-1 rounded font-bold transition-colors ${
                                                code.is_active 
                                                ? 'border-green-900 text-green-500 bg-green-900/10' 
                                                : 'border-red-900 text-red-500 bg-red-900/10'
                                            }`}
                                        >
                                            {code.is_active ? 'Active' : 'Disabled'}
                                        </button>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button 
                                            onClick={() => deleteCode(code.id)}
                                            className="p-2 hover:bg-red-900/20 rounded text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
