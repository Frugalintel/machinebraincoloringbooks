"use client";

import { useState, useEffect } from "react";
import { Save, AlertTriangle, Globe, Store, CreditCard, Shield } from "lucide-react";
import { useToast } from "@/context/toast-context";
import { useSettings } from "@/context/settings-context";
import { GlobalDiscountSettings } from "@/lib/types";
import { logAdminAction } from "@/lib/admin-utils";
import { logger } from "@/lib/logger";

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
      } catch (err) {
        logger.error("Error saving settings:", err);
        toastError(err instanceof Error ? err.message : "Failed to save settings");
      } finally {
        setIsLoading(false);
      }
  };

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
            <h2 className="text-3xl font-heading font-bold mb-1">SETTINGS</h2>
            <p className="text-gray-500 font-mono text-sm">Configure your store preferences.</p>
        </div>
        <button 
            onClick={handleSave}
            disabled={isLoading || isSettingsLoading}
            className="flex items-center gap-2 bg-primary text-black px-6 py-3 rounded font-bold hover:bg-white transition-colors disabled:opacity-50"
        >
            {isLoading || isSettingsLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-black"></div>
            ) : (
                <Save size={18} />
            )}
            <span>SAVE SETTINGS</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Global Discount Card */}
          <div className="bg-[#111] border border-[#333] rounded-xl p-6 hover:border-gray-500 transition-colors">
              <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg">
                          <Globe size={20} />
                      </div>
                      <div>
                          <h3 className="font-bold text-white text-lg">Global Discount</h3>
                          <p className="text-xs text-gray-500">Store-wide price reduction</p>
                      </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={localDiscount.enabled}
                        onChange={(e) => setLocalDiscount({...localDiscount, enabled: e.target.checked})}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                  </label>
              </div>
              
              <div className={`space-y-4 transition-all duration-300 ${localDiscount.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                          <label className="text-xs font-mono uppercase tracking-widest text-gray-500">Percentage</label>
                          <div className="relative">
                              <input 
                                  type="number" 
                                  min="0" 
                                  max="100"
                                  value={localDiscount.percentage}
                                  onChange={(e) => setLocalDiscount({...localDiscount, percentage: parseInt(e.target.value) || 0})}
                                  className="w-full bg-[#222] border border-[#333] rounded px-4 py-2 focus:outline-none focus:border-primary text-white font-mono" 
                              />
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                          </div>
                      </div>
                      <div className="space-y-2">
                          <label className="text-xs font-mono uppercase tracking-widest text-gray-500">Label</label>
                          <input 
                              type="text" 
                              value={localDiscount.label}
                              onChange={(e) => setLocalDiscount({...localDiscount, label: e.target.value})}
                              className="w-full bg-[#222] border border-[#333] rounded px-4 py-2 focus:outline-none focus:border-primary text-white"
                              placeholder="BLACK FRIDAY" 
                          />
                      </div>
                  </div>
                  <p className="text-[10px] text-gray-500 pt-2 border-t border-[#222]">
                      <AlertTriangle size={10} className="inline mr-1 text-yellow-500" />
                      Overrides individual product discounts when active.
                  </p>
              </div>
          </div>

          {/* General Info Card */}
          <div className="bg-[#111] border border-[#333] rounded-xl p-6 hover:border-gray-500 transition-colors">
              <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                      <Store size={20} />
                  </div>
                  <div>
                      <h3 className="font-bold text-white text-lg">General Info</h3>
                      <p className="text-xs text-gray-500">Basic store details</p>
                  </div>
              </div>
              
              <div className="space-y-4">
                  <div className="space-y-2">
                      <label className="text-xs font-mono uppercase tracking-widest text-gray-500">Store Name</label>
                      <input type="text" defaultValue="Machine Brain" className="w-full bg-[#222] border border-[#333] rounded px-4 py-2 focus:outline-none focus:border-primary text-white" />
                  </div>
                  <div className="space-y-2">
                      <label className="text-xs font-mono uppercase tracking-widest text-gray-500">Support Email</label>
                      <input type="email" defaultValue="support@machinebrain.com" className="w-full bg-[#222] border border-[#333] rounded px-4 py-2 focus:outline-none focus:border-primary text-white" />
                  </div>
              </div>
          </div>

          {/* Store Configuration */}
          <div className="bg-[#111] border border-[#333] rounded-xl p-6 hover:border-gray-500 transition-colors">
              <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-green-500/10 text-green-500 rounded-lg">
                      <CreditCard size={20} />
                  </div>
                  <div>
                      <h3 className="font-bold text-white text-lg">Store Config</h3>
                      <p className="text-xs text-gray-500">Payment & Access</p>
                  </div>
              </div>
              
              <div className="space-y-6">
                  <div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg border border-[#222]">
                      <div>
                          <h4 className="font-bold text-sm text-white">Maintenance Mode</h4>
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest">Disable public access</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg border border-[#222]">
                      <div>
                          <h4 className="font-bold text-sm text-white">Mock Payments</h4>
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest">Test gateway enabled</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                  </div>
              </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-950/10 border border-red-900/30 rounded-xl p-6 hover:border-red-500/50 transition-colors">
              <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-red-500/10 text-red-500 rounded-lg">
                      <Shield size={20} />
                  </div>
                  <div>
                      <h3 className="font-bold text-red-500 text-lg">Danger Zone</h3>
                      <p className="text-xs text-red-400/60">Irreversible actions</p>
                  </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-red-950/20 border border-red-900/20 rounded-lg">
                  <div>
                      <h4 className="font-bold text-sm text-white">Reset Database</h4>
                      <p className="text-xs text-gray-400 mt-1">Clear all products and orders.</p>
                  </div>
                  <button className="px-4 py-2 bg-red-500/10 border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white rounded text-xs font-bold uppercase transition-colors">
                      Reset Data
                  </button>
              </div>
          </div>
      </div>
    </div>
  );
}
