"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { CampaignSettings } from "@/lib/types";
import { CAMPAIGN_TEMPLATES } from "@/lib/campaign-templates";

// Default settings
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

type SettingsContextType = {
  campaign: CampaignSettings;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
  updateCampaign: (settings: CampaignSettings) => Promise<{ error: any }>;
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [campaign, setCampaign] = useState<CampaignSettings>(DEFAULT_CAMPAIGN);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'global_discount') // Keeping the same key for migration simplicity or rename key in DB? 
                                      // Let's stick to 'global_discount' key but structure it as CampaignSettings.
                                      // If the old structure is there, we need to adapt it.
        .single();
      
      if (data && data.value) {
        // Migration check: if old structure, adapt it
        if ('percentage' in data.value && !('discount' in data.value)) {
             const old = data.value as any;
             setCampaign({
                 ...DEFAULT_CAMPAIGN,
                 isActive: old.enabled,
                 name: old.label || "Legacy Campaign",
                 discount: {
                     enabled: old.enabled,
                     type: 'percentage',
                     value: old.percentage,
                     scope: 'global'
                 },
                 banner: {
                     ...DEFAULT_CAMPAIGN.banner,
                     enabled: old.enabled, // Assume banner on if discount on for legacy
                     text: `${old.label || 'Special Offer'} • ${old.percentage}% OFF`,
                 }
             });
        } else {
            // Ensure theme defaults if missing from saved data
            setCampaign({
                ...DEFAULT_CAMPAIGN,
                ...data.value,
                theme: data.value.theme || CAMPAIGN_TEMPLATES.default
            });
        }
      } else if (error && error.code !== 'PGRST116') {
        console.error("Error fetching settings:", error);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    
    const channel = supabase
      .channel('settings_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'system_settings', filter: "key=eq.global_discount" }, 
        (payload) => {
          if (payload.new && (payload.new as any).value) {
             const val = (payload.new as any).value;
             // Apply same migration logic here if needed, but presumably updates will come from new UI
             if ('percentage' in val && !('discount' in val)) {
                 setCampaign({
                     ...DEFAULT_CAMPAIGN,
                     isActive: val.enabled,
                     name: val.label,
                     discount: { enabled: val.enabled, type: 'percentage', value: val.percentage, scope: 'global' },
                     banner: { ...DEFAULT_CAMPAIGN.banner, enabled: val.enabled, text: `${val.label} • ${val.percentage}% OFF` }
                 });
             } else {
                 setCampaign({
                     ...DEFAULT_CAMPAIGN,
                     ...val,
                     theme: val.theme || CAMPAIGN_TEMPLATES.default
                 });
             }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSettings]);

  const updateCampaign = async (settings: CampaignSettings) => {
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({ 
          key: 'global_discount', 
          value: settings,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      setCampaign(settings);
      return { error: null };
    } catch (error) {
      console.error("Error updating settings:", error);
      return { error };
    }
  };

  const value = useMemo(() => ({
    campaign,
    // Alias for backward compatibility if components use globalDiscount
    globalDiscount: { 
        enabled: campaign.isActive && campaign.discount.enabled, 
        percentage: campaign.discount.value, 
        label: campaign.name 
    },
    isLoading,
    refreshSettings: fetchSettings,
    updateCampaign
  }), [campaign, isLoading, fetchSettings]);

  // Temporary type assertion to satisfy the interface while we migrate components
  return (
    <SettingsContext.Provider value={value as any}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
