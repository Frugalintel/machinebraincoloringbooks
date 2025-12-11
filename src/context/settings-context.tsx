"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { CampaignSettings, GlobalDiscountSettings } from "@/lib/types";
import { CAMPAIGN_TEMPLATES } from "@/lib/campaign-templates";
import { logger } from "@/lib/logger";

// Default settings
const DEFAULT_CAMPAIGN: CampaignSettings = {
  isActive: false,
  name: "Default Campaign",
  discount: {
    enabled: false,
    type: 'percentage',
    value: 0,
    scope: 'global'
  },
  banner: {
    enabled: false,
    text: "Welcome to Machine Brain",
    link: "/store",
    backgroundColor: "#e63946",
    textColor: "#ffffff"
  },
  theme: CAMPAIGN_TEMPLATES.default,
  featuredProductId: undefined
};

type SettingsContextType = {
  campaign: CampaignSettings;
  globalDiscount: GlobalDiscountSettings;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
  updateCampaign: (settings: CampaignSettings) => Promise<{ error: string | null }>;
  updateGlobalDiscount: (settings: GlobalDiscountSettings) => Promise<{ error: string | null }>;
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [campaign, setCampaign] = useState<CampaignSettings>(DEFAULT_CAMPAIGN);
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      // 1. Try to fetch the active campaign from the new 'campaigns' table
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      
      if (data) {
        setActiveCampaignId(data.id);
        // Merge DB columns and JSON settings
        setCampaign({
            ...DEFAULT_CAMPAIGN,
            ...data.settings,
            name: data.name,
            isActive: true 
        });
      } else {
         // Fallback: Check if we still have the old 'system_settings' (migration fallback)
         // Or just use default.
         // Let's try to read system_settings just in case the migration hasn't run yet
         // to avoid breaking the site completely during transition.
         const { data: legacyData } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'global_discount')
            .single();

         if (legacyData && legacyData.value) {
             // Legacy adaptation logic
             const old = legacyData.value as { enabled?: boolean; percentage?: number; label?: string; isActive?: boolean; name?: string };
             setCampaign({
                 ...DEFAULT_CAMPAIGN,
                 // Map legacy properties to current structure
                 isActive: old.enabled ?? old.isActive ?? false,
                 name: old.label ?? old.name ?? "Campaign",
             });
         } else {
             setCampaign(DEFAULT_CAMPAIGN);
         }
      }
    } catch (error) {
      logger.error("Error fetching settings:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    
    // Subscribe to changes in 'campaigns' table
    const channel = supabase
      .channel('campaigns_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'campaigns' }, 
        () => {
          fetchSettings(); // Refresh if any campaign changes (especially active status)
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSettings]);

  const updateCampaign = async (settings: CampaignSettings) => {
    // This context method is now mostly for the legacy 'updateGlobalDiscount' flow
    // or if a component tries to update the *active* campaign directly.
    // Ideally, we should use the specific campaign editor.
    // For compatibility, if we have an activeCampaignId, update it.
    
    try {
        if (activeCampaignId) {
            const { name, isActive, ...jsonSettings } = settings;
            const { error } = await supabase
                .from('campaigns')
                .update({
                    name,
                    is_active: isActive,
                    settings: jsonSettings,
                    updated_at: new Date().toISOString()
                })
                .eq('id', activeCampaignId);
            return { error: error?.message || null };
        } else {
            logger.warn("No active campaign to update via context.");
            return { error: "No active campaign" };
        }
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Unknown error" };
    }
  };

  const updateGlobalDiscount = async (settings: GlobalDiscountSettings) => {
    const newCampaign: CampaignSettings = {
      ...campaign,
      isActive: settings.enabled,
      name: settings.label,
      discount: {
        ...campaign.discount,
        enabled: settings.enabled,
        value: settings.percentage
      }
    };
    return updateCampaign(newCampaign);
  };

  const value = useMemo(() => ({
    campaign,
    globalDiscount: { 
        enabled: campaign.isActive && campaign.discount.enabled, 
        percentage: campaign.discount.value, 
        label: campaign.name 
    },
    isLoading,
    refreshSettings: fetchSettings,
    updateCampaign,
    updateGlobalDiscount
  }), [campaign, isLoading, fetchSettings]);

  return (
    <SettingsContext.Provider value={value}>
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
