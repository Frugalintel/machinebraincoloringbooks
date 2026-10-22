"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Trophy,
  Brush,
  Star,
  Zap,
  Code,
  Lock,
  LayoutGrid,
  List,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Achievement } from "@/lib/types";
import { useToast } from "@/context/toast-context";
import { logAdminAction } from "@/lib/admin-utils";
import { logger } from "@/lib/logger";
import { getRarityStyles } from "@/lib/achievement-utils";

// Helper to map icon string to component
const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case "brush":
      return <Brush size={20} />;
    case "star":
      return <Star size={20} />;
    case "zap":
      return <Zap size={20} />;
    case "code":
      return <Code size={20} />;
    case "lock":
      return <Lock size={20} />;
    case "trophy":
    default:
      return <Trophy size={20} />;
  }
};

export default function AdminAchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { success, error: toastError } = useToast();

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setAchievements(data);
      }
    } catch (error) {
      logger.error("Error fetching achievements:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (achievement: Achievement) => {
    if (!confirm("Are you sure you want to delete this achievement?")) return;

    try {
      const { error } = await supabase
        .from("achievements")
        .delete()
        .eq("id", achievement.id);
      if (error) throw error;

      await logAdminAction(
        "delete_achievement",
        "achievements",
        achievement.id,
        { title: achievement.title },
      );

      setAchievements(achievements.filter((p) => p.id !== achievement.id));
      success("Achievement deleted successfully.");
    } catch (err) {
      toastError("Failed to delete achievement.");
      logger.error("Error deleting achievement:", err);
    }
  };

  const filteredAchievements = achievements.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-heading font-bold mb-1">ACHIEVEMENTS</h2>
          <p className="text-fg-muted font-mono text-sm">
            Manage unlockable player badges.
          </p>
        </div>
        <Link
          href="/admin/achievements/new"
          className="flex items-center justify-center gap-2 bg-cream text-ink px-6 py-3 rounded font-bold hover:bg-cream transition-colors"
        >
          <Plus size={18} />
          <span>ADD ACHIEVEMENT</span>
        </Link>
      </div>

      <div className="bg-surface-1 border border-line p-4 rounded-lg flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted"
            size={18}
          />
          <input
            type="text"
            placeholder="Search achievements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-2 border border-line rounded py-2 pl-10 pr-4 text-cream focus:outline-none focus:border-primary"
          />
        </div>
        <div className="flex items-center gap-2 bg-surface-2 p-1 rounded border border-line">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded ${viewMode === "grid" ? "bg-surface-3 text-cream" : "text-fg-muted hover:text-cream"}`}
            title="Grid View"
          >
            <LayoutGrid size={18} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded ${viewMode === "list" ? "bg-surface-3 text-cream" : "text-fg-muted hover:text-cream"}`}
            title="List View"
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-fg-muted font-mono">Loading achievements...</p>
        </div>
      ) : (
        <>
          {filteredAchievements.length === 0 && (
            <div className="col-span-full p-20 text-center text-fg-muted bg-surface-1 border border-line rounded-lg border-dashed">
              <Trophy size={48} className="mx-auto text-fg-faint mb-4" />
              <p className="font-heading text-lg text-fg-muted">
                No achievements found
              </p>
            </div>
          )}

          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredAchievements.map((achievement) => {
                const styles = getRarityStyles(achievement.rarity);
                return (
                  <div
                    key={achievement.id}
                    className={`group relative border rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 ${styles.bg} ${styles.border} ${styles.glow}`}
                  >
                    {/* Colored Accent Bar */}
                    <div
                      className={`absolute top-0 left-0 w-full h-1 ${styles.accent}`}
                    ></div>

                    <Link
                      href={`/admin/achievements/${achievement.id}`}
                      className="block h-full p-4 pt-5 pb-14"
                    >
                      <div className="flex items-start gap-4">
                        {/* Compact Icon Box */}
                        <div
                          className={`w-14 h-14 rounded-xl flex shrink-0 items-center justify-center border-2 ${styles.icon}`}
                        >
                          {getIconComponent(achievement.icon)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3
                            className={`font-heading font-bold text-sm mb-0.5 truncate pr-6 ${styles.titleColor}`}
                          >
                            {achievement.title}
                          </h3>
                          <p
                            className={` font-label uppercase tracking-wide mb-1 ${styles.text}`}
                          >
                            {achievement.trigger_type?.replace("_", " ")}
                          </p>
                          <span
                            className={`inline-block text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${styles.text} border-current bg-background/40`}
                          >
                            {achievement.rarity || "Common"}
                          </span>
                        </div>

                        {achievement.is_secret ? (
                          <div className="absolute top-5 right-4">
                            <span title="Secret">
                              <Lock size={12} className="text-signal" />
                            </span>
                          </div>
                        ) : null}
                      </div>

                      <p className="text-xs text-fg-muted line-clamp-2 mt-3 min-h-[2.5em]">
                        {achievement.description}
                      </p>

                      <div className="flex items-center justify-between pt-3 border-t border-cream/10 mt-3">
                        <span className=" text-fg-muted font-label uppercase">
                          Target
                        </span>
                        <span
                          className={`text-sm font-bold font-mono ${styles.text}`}
                        >
                          {achievement.target_value}
                        </span>
                      </div>
                    </Link>

                    {/* Actions Footer - Slides up on hover */}
                    <div className="absolute bottom-0 left-0 right-0 bg-surface-1 border-t border-line p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-200 flex justify-end items-center z-40">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/achievements/${achievement.id}`}
                          className="p-2 hover:bg-surface-3 rounded text-fg-muted hover:text-cream transition-colors"
                        >
                          <Edit size={16} />
                        </Link>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleDelete(achievement);
                          }}
                          className="p-2 hover:bg-danger-wash rounded text-fg-muted hover:text-danger transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-surface-1 border border-line rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-surface-1 text-fg-muted font-mono text-xs uppercase tracking-widest">
                    <tr>
                      <th className="p-4 font-normal">Icon</th>
                      <th className="p-4 font-normal">Title</th>
                      <th className="p-4 font-normal">Description</th>
                      <th className="p-4 font-normal">Trigger</th>
                      <th className="p-4 font-normal">Rarity</th>
                      <th className="p-4 font-normal text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#333]">
                    {filteredAchievements.map((achievement) => {
                      const styles = getRarityStyles(achievement.rarity);

                      return (
                        <tr
                          key={achievement.id}
                          className="group hover:bg-surface-1 transition-colors"
                        >
                          <td className="p-4">
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center border ${styles.icon.replace("text-", "text-opacity-80 ")}`}
                            >
                              {getIconComponent(achievement.icon)}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="font-heading font-bold text-cream text-sm">
                              {achievement.title}
                            </div>
                            {achievement.is_secret ? (
                              <span className="text-[9px] uppercase text-signal tracking-wider">
                                Secret
                              </span>
                            ) : null}
                          </td>
                          <td className="p-4 max-w-xs">
                            <p className="text-xs text-fg-muted truncate">
                              {achievement.description}
                            </p>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="text-xs text-cream font-mono uppercase">
                                {achievement.trigger_type?.replace("_", " ")}
                              </span>
                              <span className=" text-fg-muted font-label">
                                Target: {achievement.target_value}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span
                              className={`text-[10px] uppercase font-bold px-2 py-1 rounded border bg-opacity-10 ${styles.text} border-current`}
                            >
                              {achievement.rarity || "Common"}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Link
                                href={`/admin/achievements/${achievement.id}`}
                                className="p-2 hover:bg-surface-3 rounded text-fg-muted hover:text-cream transition-colors"
                              >
                                <Edit size={16} />
                              </Link>
                              <button
                                onClick={() => handleDelete(achievement)}
                                className="p-2 hover:bg-danger-wash rounded text-fg-muted hover:text-danger transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
