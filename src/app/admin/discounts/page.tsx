"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  X,
  RefreshCw,
  Loader2,
  Tag,
  LayoutTemplate,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { PromoCode, Product, CampaignSettings } from "@/lib/types";
import { useToast } from "@/context/toast-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { logAdminAction } from "@/lib/admin-utils";
import { CampaignCard } from "@/components/admin/campaign-card";
import { logger } from "@/lib/logger";

export default function DiscountsPage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState("campaigns");
  const [isLoading, setIsLoading] = useState(true);

  // Campaign State
  const [campaigns, setCampaigns] = useState<
    {
      id: string;
      name: string;
      is_active: boolean;
      settings: Record<string, unknown>;
      created_at: string;
    }[]
  >([]);
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);

  // Promo Code State
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [isCreatingCode, setIsCreatingCode] = useState(false);
  const [newCode, setNewCode] = useState<Partial<PromoCode>>({
    code: "",
    discount_percent: 10,
    usage_limit: 100,
    is_active: true,
    valid_until: "",
  });

  useEffect(() => {
    fetchData();

    // Subscribe to campaign changes (e.g. if activated from another window)
    const channel = supabase
      .channel("admin_discounts_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "campaigns" },
        fetchData,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    await Promise.all([fetchCampaigns(), fetchCodes()]);
    setIsLoading(false);
  };

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      logger.error("Error fetching campaigns:", error);
    }
  };

  const fetchCodes = async () => {
    try {
      const { data, error } = await supabase
        .from("promo_codes")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setCodes(data);
    } catch (error) {
      logger.error("Error fetching codes:", error);
    }
  };

  // --- Campaign Actions ---

  const handleCreateCampaign = async () => {
    setIsCreatingCampaign(true);
    try {
      const { data, error } = await supabase
        .from("campaigns")
        .insert([
          {
            name: "New Campaign",
            is_active: false,
            settings: {
              theme: {
                name: "Default",
                colors: { background: "#000", primary: "#fff", text: "#fff" },
              },
            },
          },
        ])
        .select()
        .single();

      if (error) throw error;

      success("Campaign created!");
      router.push(`/admin/discounts/${data.id}`);
    } catch (error) {
      logger.error("Error creating campaign:", error);
      toastError(
        error instanceof Error ? error.message : "Failed to create campaign",
      );
    } finally {
      setIsCreatingCampaign(false);
    }
  };

  const handleActivateCampaign = async (id: string) => {
    try {
      // Use the RPC function to ensure atomic switch
      const { error } = await supabase.rpc("activate_campaign", {
        target_campaign_id: id,
      });
      if (error) throw error;

      await fetchCampaigns(); // Refresh list to update UI
      success("Campaign activated!");
    } catch (error) {
      logger.error("Error activating campaign:", error);
      // Fallback if RPC doesn't exist yet (for safety during migration)
      await fallbackActivate(id);
    }
  };

  const fallbackActivate = async (id: string) => {
    // Manual implementation of activation if RPC fails
    await supabase
      .from("campaigns")
      .update({ is_active: false })
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Deactivate all
    await supabase.from("campaigns").update({ is_active: true }).eq("id", id);
    await fetchCampaigns();
    success("Campaign activated (fallback)");
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm("Are you sure? This cannot be undone.")) return;
    try {
      const { error } = await supabase.from("campaigns").delete().eq("id", id);
      if (error) throw error;

      setCampaigns(campaigns.filter((c) => c.id !== id));
      success("Campaign deleted.");
    } catch (error) {
      toastError(
        error instanceof Error ? error.message : "Failed to delete campaign",
      );
    }
  };

  // --- Promo Code Actions ---

  const generateRandomCode = () => {
    const prefix = "SALE";
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    setNewCode((prev) => ({ ...prev, code: `${prefix}${randomPart}` }));
  };

  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from("promo_codes")
        .insert([newCode])
        .select();

      if (error) throw error;
      await logAdminAction("create_promo_code", "promo_codes", data[0].id, {
        code: newCode.code,
      });
      if (data) setCodes([...data, ...codes]);
      setIsCreatingCode(false);
      setNewCode({
        code: "",
        discount_percent: 10,
        usage_limit: 100,
        is_active: true,
      });
      success("Promo code created successfully.");
    } catch (error) {
      toastError(
        error instanceof Error ? error.message : "Failed to create code",
      );
    }
  };

  const toggleCodeStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("promo_codes")
        .update({ is_active: !currentStatus })
        .eq("id", id);
      if (error) throw error;
      setCodes(
        codes.map((c) =>
          c.id === id ? { ...c, is_active: !currentStatus } : c,
        ),
      );
      success(`Promo code ${!currentStatus ? "activated" : "disabled"}.`);
    } catch (error) {
      toastError("Failed to update status.");
    }
  };

  const deleteCode = async (id: string) => {
    if (!confirm("Delete this promo code?")) return;
    try {
      const { error } = await supabase
        .from("promo_codes")
        .delete()
        .eq("id", id);
      if (error) throw error;
      setCodes(codes.filter((c) => c.id !== id));
      success("Promo code deleted.");
    } catch (error) {
      toastError("Failed to delete code.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-heading font-bold mb-1">DISCOUNTS</h2>
          <p className="text-fg-muted font-mono text-sm">
            Manage campaigns and promo codes.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-surface-1 border border-line mb-6">
          <TabsTrigger
            value="campaigns"
            className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-ink font-mono uppercase tracking-wider text-xs"
          >
            <LayoutTemplate size={14} /> Global Campaigns
          </TabsTrigger>
          <TabsTrigger
            value="codes"
            className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-ink font-mono uppercase tracking-wider text-xs"
          >
            <Tag size={14} /> Promo Codes
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="campaigns"
          className="space-y-6 animate-in fade-in slide-in-from-bottom-4"
        >
          {/* Action Bar */}
          <div className="flex justify-end">
            <button
              onClick={handleCreateCampaign}
              disabled={isCreatingCampaign}
              className="flex items-center gap-2 bg-primary text-ink px-4 py-2 rounded font-bold hover:bg-cream transition-colors disabled:opacity-50"
            >
              {isCreatingCampaign ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <Plus size={16} />
              )}
              <span>NEW CAMPAIGN</span>
            </button>
          </div>

          {isLoading && campaigns.length === 0 ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-20 bg-surface-1 border border-line rounded-xl border-dashed">
              <LayoutTemplate
                size={48}
                className="mx-auto text-fg-faint mb-4"
              />
              <h3 className="text-lg font-bold text-fg-muted">
                No Campaigns Found
              </h3>
              <p className="text-fg-faint text-sm mt-2 mb-6">
                Create your first marketing campaign to get started.
              </p>
              <button
                onClick={handleCreateCampaign}
                className="text-primary hover:underline text-sm font-mono uppercase"
              >
                Create Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  id={campaign.id}
                  name={campaign.name}
                  isActive={campaign.is_active}
                  settings={
                    {
                      ...(campaign.settings as Omit<
                        CampaignSettings,
                        "name" | "isActive"
                      >),
                      name: campaign.name,
                      isActive: campaign.is_active,
                    } as CampaignSettings
                  }
                  onActivate={handleActivateCampaign}
                  onDelete={handleDeleteCampaign}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent
          value="codes"
          className="animate-in fade-in slide-in-from-bottom-4"
        >
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setIsCreatingCode(true)}
              className="flex items-center justify-center gap-2 bg-primary text-ink px-6 py-3 rounded font-bold hover:bg-cream transition-colors"
            >
              <Plus size={18} />
              <span>NEW CODE</span>
            </button>
          </div>

          {isCreatingCode ? (
            <div className="bg-surface-1 border border-line p-6 rounded-lg mb-6 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-xl">Create New Code</h3>
                <button onClick={() => setIsCreatingCode(false)}>
                  <X size={20} />
                </button>
              </div>
              <form
                onSubmit={handleCreateCode}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end"
              >
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-widest text-fg-muted">
                    Code Name
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={newCode.code}
                      onChange={(e) =>
                        setNewCode({
                          ...newCode,
                          code: e.target.value.toUpperCase(),
                        })
                      }
                      className="w-full bg-surface-2 border border-line rounded px-4 py-2 font-mono uppercase focus:outline-none focus:border-primary"
                      placeholder="SUMMER2025"
                    />
                    <button
                      type="button"
                      onClick={generateRandomCode}
                      className="p-2 bg-surface-2 border border-line rounded hover:text-cream text-fg-muted"
                      title="Generate Random"
                    >
                      <RefreshCw size={18} />
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-widest text-fg-muted">
                    Discount %
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="100"
                    value={newCode.discount_percent}
                    onChange={(e) =>
                      setNewCode({
                        ...newCode,
                        discount_percent: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-surface-2 border border-line rounded px-4 py-2 focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-widest text-fg-muted">
                    Usage Limit
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newCode.usage_limit}
                    onChange={(e) =>
                      setNewCode({
                        ...newCode,
                        usage_limit: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-surface-2 border border-line rounded px-4 py-2 focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-mono uppercase tracking-widest text-fg-muted">
                    Valid Until
                  </label>
                  <input
                    type="date"
                    value={newCode.valid_until || ""}
                    onChange={(e) =>
                      setNewCode({ ...newCode, valid_until: e.target.value })
                    }
                    className="w-full bg-surface-2 border border-line rounded px-4 py-2 focus:outline-none focus:border-primary text-cream scheme-dark"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-cream text-ink font-bold px-4 py-2 rounded h-10 hover:bg-gray-200 uppercase tracking-wider"
                >
                  Create Code
                </button>
              </form>
            </div>
          ) : null}

          {/* Promo Codes List (Existing Layout) */}
          <div className="hidden md:block bg-surface-1 border border-line rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-1 text-fg-muted font-mono text-xs uppercase tracking-widest">
                <tr>
                  <th className="p-4 font-normal">Code</th>
                  <th className="p-4 font-normal">Discount</th>
                  <th className="p-4 font-normal">Usage</th>
                  <th className="p-4 font-normal">Expires</th>
                  <th className="p-4 font-normal">Status</th>
                  <th className="p-4 font-normal text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#333]">
                {codes.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-fg-muted">
                      No promo codes active.
                    </td>
                  </tr>
                )}
                {codes.map((code) => (
                  <tr
                    key={code.id}
                    className="hover:bg-surface-1 transition-colors"
                  >
                    <td className="p-4 font-mono font-bold text-lg">
                      {code.code}
                    </td>
                    <td className="p-4 text-success font-bold">
                      {code.discount_percent}% OFF
                    </td>
                    <td className="p-4 font-mono text-sm text-fg-muted">
                      {code.usage_count} / {code.usage_limit || "∞"}
                    </td>
                    <td className="p-4 font-mono text-sm text-fg-muted">
                      {code.valid_until
                        ? new Date(code.valid_until).toLocaleDateString()
                        : "Never"}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() =>
                          toggleCodeStatus(code.id, code.is_active)
                        }
                        className={`text-[10px] uppercase border px-2 py-1 rounded font-bold transition-colors ${
                          code.is_active
                            ? "border-success text-success bg-green-900/10"
                            : "border-danger text-danger bg-danger-wash"
                        }`}
                      >
                        {code.is_active ? "Active" : "Disabled"}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => deleteCode(code.id)}
                        className="p-2 hover:bg-danger-wash rounded text-fg-muted hover:text-danger transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Stack */}
          <div className="md:hidden space-y-4">
            {codes.map((code) => (
              <div
                key={code.id}
                className="relative bg-surface-1 border-2 border-dashed border-line rounded-lg p-4 space-y-4 overflow-hidden group"
              >
                <div className="absolute top-1/2 -left-3 w-6 h-6 bg-background rounded-full transform -translate-y-1/2 border-r-2 border-dashed border-line"></div>
                <div className="absolute top-1/2 -right-3 w-6 h-6 bg-background rounded-full transform -translate-y-1/2 border-l-2 border-dashed border-line"></div>

                <div className="flex justify-between items-start pl-2 pr-2">
                  <div>
                    <div className="font-mono font-bold text-2xl text-cream tracking-widest">
                      {code.code}
                    </div>
                    <div className="text-success font-bold text-sm uppercase">
                      {code.discount_percent}% OFF TICKET
                    </div>
                  </div>
                  <button
                    onClick={() => toggleCodeStatus(code.id, code.is_active)}
                    className={`text-[10px] uppercase border px-2 py-1 rounded font-bold ${
                      code.is_active
                        ? "border-success text-success bg-green-900/10"
                        : "border-danger text-danger bg-danger-wash"
                    }`}
                  >
                    {code.is_active ? "Active" : "Disabled"}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono text-fg-muted border-t-2 border-dotted border-line pt-3 pl-2 pr-2">
                  <div>
                    <span className="block text-[9px] uppercase tracking-widest mb-1 text-fg-faint">
                      Usage Limit
                    </span>
                    <span className="text-cream">{code.usage_count}</span> /{" "}
                    {code.usage_limit || "∞"}
                  </div>
                  <div className="text-right">
                    <span className="block text-[9px] uppercase tracking-widest mb-1 text-fg-faint">
                      Valid Until
                    </span>
                    {code.valid_until
                      ? new Date(code.valid_until).toLocaleDateString()
                      : "Forever"}
                  </div>
                </div>

                <button
                  onClick={() => deleteCode(code.id)}
                  className="w-full flex items-center justify-center gap-2 p-2 bg-danger-wash hover:bg-danger-wash text-danger rounded text-xs font-bold uppercase transition-colors border border-danger/20"
                >
                  <Trash2 size={14} /> Tear Up Ticket
                </button>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
