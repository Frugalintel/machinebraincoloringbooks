"use client";

import { useState } from "react";
import { Save, AlertTriangle } from "lucide-react";
import { useToast } from "@/context/toast-context";

export default function SettingsPage() {
  const { success } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSave = (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      
      // Mock save
      setTimeout(() => {
          setIsLoading(false);
          success("Settings saved successfully.");
      }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-heading font-bold mb-1">SETTINGS</h2>
        <p className="text-gray-500 font-mono text-sm">Configure your store preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
              <h3 className="font-bold text-white mb-2">General Information</h3>
              <p className="text-xs text-gray-500">Basic store details and SEO settings.</p>
          </div>
          
          <div className="md:col-span-2">
              <div className="bg-[#111] border border-[#333] p-6 rounded-lg space-y-6">
                  <div className="space-y-2">
                      <label className="text-xs font-mono uppercase tracking-widest text-gray-500">Store Name</label>
                      <input type="text" defaultValue="Machine Brain" className="w-full bg-[#222] border border-[#333] rounded px-4 py-2 focus:outline-none focus:border-primary" />
                  </div>
                  <div className="space-y-2">
                      <label className="text-xs font-mono uppercase tracking-widest text-gray-500">Contact Email</label>
                      <input type="email" defaultValue="support@machinebrain.com" className="w-full bg-[#222] border border-[#333] rounded px-4 py-2 focus:outline-none focus:border-primary" />
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
            disabled={isLoading}
            className="flex items-center gap-2 bg-primary text-black px-8 py-3 rounded font-bold hover:bg-white transition-colors disabled:opacity-50"
          >
              {isLoading ? (
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

