"use client";

import { useState, useEffect } from "react";
import { Save, AlertTriangle } from "lucide-react";
import { useToast } from "@/context/toast-context";
import { useSettings } from "@/context/settings-context";
import { GlobalDiscountSettings } from "@/lib/types";
import { logAdminAction } from "@/lib/admin-utils";

export default function SettingsPage() {
  const { success, error: toastError } = useToast();
  const { globalDiscount, updateGlobalDiscount, isLoading: isSettingsLoading } = useSettings();
  
  const [isLoading, setIsLoading] = useState(false);
  const [localDiscount, setLocalDiscount] = useState<GlobalDiscountSettings>({
    enabled: false,
    percentage: 0,
    label: ""
  });

  useEffect(() => {
    if (globalDiscount) {
      setLocalDiscount(globalDiscount);
    }
  }, [globalDiscount]);
  
  const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      
      try {
        const { error } = await updateGlobalDiscount(localDiscount);
        if (error) throw error;
        
        await logAdminAction(
            'update_global_settings',
            'settings',
            null,
            { changes: localDiscount }
        );

        success("Settings saved successfully.");
      } catch (err: any) {
        console.error("Error saving settings:", err);
        toastError(err.message || "Failed to save settings");
      } finally {
        setIsLoading(false);
      }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-heading font-bold mb-1">SETTINGS</h2>
        <p className="text-gray-500 font-mono text-sm">Configure your store preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
              <h3 className="font-bold text-white mb-2">Global Discount</h3>
              <p className="text-xs text-gray-500">Apply a store-wide discount to all products.</p>
          </div>
          
          <div className="md:col-span-2">
              <div className="bg-[#111] border border-[#333] p-6 rounded-lg space-y-6">
                  <div className="flex items-center justify-between">
                      <div>
                          <h4 className="font-bold text-sm">Enable Discount</h4>
                          <p className="text-xs text-gray-500">Activate global price reduction</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={localDiscount.enabled}
                            onChange={(e) => setLocalDiscount({...localDiscount, enabled: e.target.checked})}
                            className="sr-only peer" 
                          />
                          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                  </div>
                  
                  {localDiscount.enabled && (
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#222]">
                        <div className="space-y-2">
                            <label className="text-xs font-mono uppercase tracking-widest text-gray-500">Percentage (%)</label>
                            <input 
                                type="number" 
                                min="0" 
                                max="100"
                                value={localDiscount.percentage}
                                onChange={(e) => setLocalDiscount({...localDiscount, percentage: parseInt(e.target.value) || 0})}
                                className="w-full bg-[#222] border border-[#333] rounded px-4 py-2 focus:outline-none focus:border-primary text-white" 
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-mono uppercase tracking-widest text-gray-500">Label (e.g. BLACK FRIDAY)</label>
                            <input 
                                type="text" 
                                value={localDiscount.label}
                                onChange={(e) => setLocalDiscount({...localDiscount, label: e.target.value})}
                                className="w-full bg-[#222] border border-[#333] rounded px-4 py-2 focus:outline-none focus:border-primary text-white" 
                            />
                        </div>
                    </div>
                  )}
              </div>
          </div>
      </div>

      <div className="h-[1px] bg-[#222]"></div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
              <h3 className="font-bold text-white mb-2">General Information</h3>
              <p className="text-xs text-gray-500">Basic store details and SEO settings.</p>
          </div>
          
          <div className="md:col-span-2">
              <div className="bg-[#111] border border-[#333] p-6 rounded-lg space-y-6">
                  <div className="space-y-2">
                      <label className="text-xs font-mono uppercase tracking-widest text-gray-500">Store Name</label>
                      <input type="text" defaultValue="Machine Brain" className="w-full bg-[#222] border border-[#333] rounded px-4 py-2 focus:outline-none focus:border-primary text-white" />
                  </div>
                  <div className="space-y-2">
                      <label className="text-xs font-mono uppercase tracking-widest text-gray-500">Contact Email</label>
                      <input type="email" defaultValue="support@machinebrain.com" className="w-full bg-[#222] border border-[#333] rounded px-4 py-2 focus:outline-none focus:border-primary text-white" />
                  </div>
              </div>
          </div>
      </div>

      <div className="h-[1px] bg-[#222]"></div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
              <h3 className="font-bold text-white mb-2">Store Configuration</h3>
              <p className="text-xs text-gray-500">Manage currency, shipping, and taxes.</p>
          </div>
          
          <div className="md:col-span-2">
              <div className="bg-[#111] border border-[#333] p-6 rounded-lg space-y-6">
                  <div className="flex items-center justify-between">
                      <div>
                          <h4 className="font-bold text-sm">Maintenance Mode</h4>
                          <p className="text-xs text-gray-500">Disable store for visitors</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                      <div>
                          <h4 className="font-bold text-sm">Mock Payments</h4>
                          <p className="text-xs text-gray-500">Use test gateway for checkout</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                  </div>
              </div>
          </div>
      </div>

      <div className="h-[1px] bg-[#222]"></div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
              <h3 className="font-bold text-red-500 mb-2">Danger Zone</h3>
              <p className="text-xs text-gray-500">Irreversible actions.</p>
          </div>
          
          <div className="md:col-span-2">
              <div className="bg-red-900/10 border border-red-900/30 p-6 rounded-lg space-y-6">
                  <div className="flex items-center gap-4">
                      <AlertTriangle className="text-red-500" />
                      <div className="flex-1">
                          <h4 className="font-bold text-sm text-red-500">Reset Database</h4>
                          <p className="text-xs text-red-400/70">Clear all products and orders. This cannot be undone.</p>
                      </div>
                      <button className="px-4 py-2 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded text-xs font-bold uppercase transition-colors">
                          Reset Data
                      </button>
                  </div>
              </div>
          </div>
      </div>

      <div className="flex justify-end pt-8">
          <button 
            onClick={handleSave}
            disabled={isLoading || isSettingsLoading}
            className="flex items-center gap-2 bg-primary text-black px-8 py-3 rounded font-bold hover:bg-white transition-colors disabled:opacity-50"
          >
              {isLoading || isSettingsLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-black"></div>
              ) : (
                  <Save size={18} />
              )}
              <span>SAVE SETTINGS</span>
          </button>
      </div>
    </div>
  );
}
