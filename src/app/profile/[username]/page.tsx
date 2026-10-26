"use client";

import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Settings,
  Box,
  Terminal,
  Trophy,
  Shield,
  Lock,
  Scan,
  Plus,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SystemLoading } from "@/components/system-loading";
import { useAuth } from "@/context/auth-context";
import { useGame } from "@/context/game-context";
import { AchievementCard } from "@/components/achievements/achievement-card";
import type { CollectibleItem } from "@/lib/game-data";
import {
  loadLedger,
  profileProgressFromLedger,
  type ScanLedgerSnapshot,
} from "@/lib/scan-ledger";
import { supabase } from "@/lib/supabase";

// Dynamic import for 3D trophy canvas
const TrophyCanvas = dynamic(
  () => import("@/components/three").then((m) => m.TrophyCanvas),
  { ssr: false },
);

export default function ProfilePage() {
  const { username } = useParams();
  const router = useRouter();
  const { user, signOut, openAuthModal, isLoading, signingOut } = useAuth();
  const {
    collectionSets,
    achievements,
    activeAchievementIds,
    collectibleTimestamps,
    isLoading: gameLoading,
  } = useGame();
  const [ledger, setLedger] = useState<ScanLedgerSnapshot | null>(null);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  const leavingForHome = useRef(false);
  useEffect(() => {
    if (signingOut) leavingForHome.current = true;
  }, [signingOut]);

  useEffect(() => {
    const userId = user?.id;
    if (!userId) return;
    let cancelled = false;
    void loadLedger(supabase, userId)
      .then((next) => {
        if (cancelled) return;
        setLedger(next);
        setLoadedFor(userId);
      })
      .catch(() => {
        if (cancelled) return;
        setLedger(null);
        setLoadedFor(userId);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    // signingOut flips back to false while replace("/") is still in flight.
    if (isLoading || signingOut || leavingForHome.current) return;
    if (username === "me" && !user) {
      router.replace("/auth?next=/profile/me");
    }
  }, [isLoading, router, signingOut, username, user]);

  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      router.refresh();
      if (!user && username === "me" && !leavingForHome.current) {
        router.replace("/auth?next=/profile/me");
      }
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [router, username, user]);

  if (isLoading || (username === "me" && !user)) {
    return <SystemLoading variant="account" label="Loading profile" />;
  }

  const isCurrentUser = username === "me" || (user && username === user.id);
  const displayName =
    isCurrentUser && user
      ? `USER_${user.initials}`
      : username === "me"
        ? "GUEST"
        : username;
  const displayEmail = isCurrentUser && user ? user.email : "access@restricted";

  // Filter achievements to only show active ones (up to 5)
  const displayedAchievements = achievements.filter((ach) =>
    activeAchievementIds.includes(ach.id),
  );
  const statsReady =
    loadedFor === (user?.id ?? null) && loadedFor !== null && !gameLoading;
  const collectedCount = collectionSets.reduce(
    (acc, set) => acc + set.collected.length,
    0,
  );
  const remainingCount = collectionSets.reduce(
    (acc, set) => acc + (set.total - set.collected.length),
    0,
  );
  const collectionRank =
    collectedCount >= 10
      ? "Legendary Collector"
      : collectedCount >= 5
        ? "Epic Collector"
        : "Novice Collector";
  const ledgerProgress = profileProgressFromLedger(ledger);
  const statValue = (value: number) => (statsReady ? String(value) : "—");
  const loadoutCount = statsReady ? `${activeAchievementIds.length}/5` : "—/5";

  return (
    <main id="main" className="min-h-screen bg-background text-cream font-sans">
      {/* Header Banner */}
      <div className="h-64 md:h-80 bg-background relative overflow-hidden border-b border-line">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#222,black)] opacity-50"></div>
        {/* Grid Lines */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        ></div>
      </div>

      <div className="container mx-auto px-4 md:px-6 -mt-32 relative z-10 pb-20">
        <div className="flex flex-col md:flex-row items-end gap-8 mb-12">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative group"
          >
            <Avatar className="w-40 h-40 border-4 border-background rounded-none shadow-xl relative z-10 bg-surface-2">
              <AvatarImage src="" /> {/* No image for now, force fallback */}
              <AvatarFallback className="bg-surface-2 text-4xl font-heading text-fg-muted rounded-none ">
                {isCurrentUser && user ? user.initials : "MB"}
              </AvatarFallback>
            </Avatar>
            {/* Decorative Frame */}
            <div className="absolute -inset-2 border border-line pointer-events-none z-0"></div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 border-r border-b border-primary/50 pointer-events-none"></div>

            {isCurrentUser ? (
              <div className="absolute bottom-2 right-2 bg-cream text-ink p-2 hover:bg-cream transition-colors cursor-pointer z-20 border border-ink">
                <Settings className="w-4 h-4" />
              </div>
            ) : null}
          </motion.div>

          <div className="flex-1 mb-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-2">
              <h1 className="font-display text-title leading-none min-w-0 break-words">
                {displayName}
              </h1>
              <span className="self-start md:self-auto font-label bg-cream/10 text-primary border border-primary/30 px-2 py-1 uppercase tracking-widest">
                Auth Level:{" "}
                {isCurrentUser && user ? "1 (Verified)" : "0 (Guest)"}
              </span>
              {isCurrentUser && user ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    void signOut();
                  }}
                  className="self-start rounded-none border-line font-label uppercase tracking-widest hover:border-cream hover:text-cream"
                >
                  Sign out
                </Button>
              ) : null}
            </div>
            <p className="text-fg-muted font-sans max-w-xl text-sm md:text-base uppercase tracking-wide flex items-center gap-2">
              <Terminal size={12} /> Unit {user ? user.id.slice(-4) : "0000"} //
              Sector 9 // Status: Active
            </p>
          </div>

          <div
            className="flex gap-8 mb-6 text-center border-l border-line pl-8 hidden md:flex"
            aria-busy={statsReady ? undefined : true}
          >
            <div>
              <p className="font-heading text-3xl font-bold text-cream">
                {statValue(ledgerProgress.plateCount)}
              </p>
              <p className=" text-fg-muted tracking-widest uppercase font-label">
                Plates
              </p>
            </div>
            <div>
              <p className="font-heading text-3xl font-bold text-cream">
                {statValue(ledgerProgress.bookCount)}
              </p>
              <p className=" text-fg-muted tracking-widest uppercase font-label">
                Books
              </p>
            </div>
            <div>
              <p className="font-heading text-3xl font-bold text-cream">
                {statValue(ledgerProgress.pendingCount)}
              </p>
              <p className=" text-fg-muted tracking-widest uppercase font-label">
                Pending
              </p>
            </div>
          </div>
        </div>

        {/* --- FUN FIRST: ACHIEVEMENTS & COLLECTIBLES --- */}
        {user ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-24">
            {/* Achievements Section */}
            <div className="space-y-8">
              <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
                <h2 className="font-heading text-2xl text-cream tracking-wide flex min-w-0 items-center gap-3">
                  <Trophy className="text-primary" /> Active Missions
                </h2>
                <Link href="/achievements" className="max-w-full min-w-0">
                  <Button
                    variant="ghost"
                    className="h-auto max-w-full min-w-0 shrink whitespace-normal py-2 font-label uppercase tracking-widest hover:text-primary hover:bg-transparent"
                  >
                    Manage Loadout ({loadoutCount}){" "}
                    <Settings size={12} className="ml-2 shrink-0" />
                  </Button>
                </Link>
              </div>

              <div className="grid gap-4">
                {displayedAchievements.length > 0 ? (
                  displayedAchievements.map((ach) => (
                    <AchievementCard
                      key={ach.id}
                      achievement={ach}
                      variant="profile"
                    />
                  ))
                ) : (
                  <div className="p-8 border border-dashed border-line text-center">
                    <p className="text-fg-muted font-mono text-xs uppercase mb-4">
                      No active missions selected
                    </p>
                    <Link href="/achievements">
                      <Button
                        variant="outline"
                        className=" font-label uppercase tracking-widest"
                      >
                        <Plus size={12} className="mr-2" /> Select Missions
                      </Button>
                    </Link>
                  </div>
                )}

                {/* Prompt to add more if slots available */}
                {displayedAchievements.length < 5 && (
                  <Link
                    href="/achievements"
                    className="block p-4 border border-dashed border-line text-center hover:border-line-strong hover:bg-background transition-all group cursor-pointer opacity-50 hover:opacity-100"
                  >
                    <div className="flex items-center justify-center gap-2 text-fg-muted group-hover:text-cream font-mono text-xs uppercase tracking-widest">
                      <Plus size={14} /> Add Mission Slot
                    </div>
                  </Link>
                )}
              </div>
            </div>

            {/* Collectibles Showcase */}
            <div className="space-y-8">
              <div className="flex items-center justify-between border-b border-line pb-4">
                <h2 className="font-heading text-2xl text-cream tracking-wide flex items-center gap-3">
                  <Box className="text-primary" /> Digital Collection
                </h2>
                <Link href="/trophy-room">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 font-label uppercase tracking-widest rounded-none border-line hover:border-primary hover:text-primary"
                  >
                    Enter Codes <Scan className="ml-2 w-3 h-3" />
                  </Button>
                </Link>
              </div>

              {/* Featured Trophy Showcase */}
              <div className="border border-line bg-gradient-to-b from-background to-background p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-amber-500 to-transparent"></div>

                <div className="flex items-center gap-2 text-primary font-label uppercase tracking-widest mb-4 relative z-10">
                  <Sparkles size={12} />
                  <span>Featured Trophy</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center relative z-10">
                  {/* 3D Trophy Viewport */}
                  <div className="relative aspect-square max-w-[200px] mx-auto bg-background border border-line overflow-hidden">
                    <TrophyCanvas
                      size="small"
                      rarity={
                        collectionSets.reduce(
                          (acc, set) => acc + set.collected.length,
                          0,
                        ) >= 10
                          ? "Legendary"
                          : collectionSets.reduce(
                                (acc, set) => acc + set.collected.length,
                                0,
                              ) >= 5
                            ? "Epic"
                            : "Common"
                      }
                      autoRotate={true}
                      isInteractive={false}
                    />
                  </div>

                  {/* Trophy Stats */}
                  <div className="space-y-4">
                    <div>
                      <p className=" text-fg-muted uppercase tracking-widest font-label mb-1">
                        Collection Rank
                      </p>
                      <p className="font-heading text-xl text-cream ">
                        {gameLoading ? "—" : collectionRank}
                      </p>
                    </div>
                    <div className="flex gap-4">
                      <div>
                        <p className="font-heading text-2xl text-primary">
                          {gameLoading ? "—" : collectedCount}
                        </p>
                        <p className=" text-fg-muted uppercase tracking-widest font-label">
                          Collected
                        </p>
                      </div>
                      <div>
                        <p className="font-heading text-2xl text-fg-faint">
                          {gameLoading ? "—" : remainingCount}
                        </p>
                        <p className=" text-fg-muted uppercase tracking-widest font-label">
                          Remaining
                        </p>
                      </div>
                    </div>
                    <Link href="/trophy-room">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-10 font-label uppercase tracking-widest rounded-none border-primary/50 text-primary hover:bg-cream hover:text-ink"
                      >
                        <Trophy size={14} className="mr-2" /> View Trophy Room
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

              {ledger?.books.length ? (
                <div className="grid gap-6">
                  {ledger.books.map((book) => {
                    const filled = book.plates.filter(
                      (cell) => cell !== "empty" && cell !== "now",
                    ).length;
                    const progress = book.plateCount
                      ? (filled / book.plateCount) * 100
                      : 0;
                    return (
                      <div
                        key={book.id}
                        className="border border-line bg-background p-4 relative group hover:border-line-strong transition-colors"
                      >
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-heading text-lg text-cream ">
                            {book.title}
                          </h3>
                          <span className="font-mono text-xs text-primary">
                            {filled}/{book.plateCount}
                          </span>
                        </div>
                        <div className="h-1 bg-surface-2 w-full mb-2">
                          <div
                            style={{ width: `${progress}%` }}
                            className="h-full bg-cream/80"
                          ></div>
                        </div>
                        {book.pendingCount > 0 ? (
                          <p className="font-label uppercase tracking-widest text-fg-muted">
                            {book.pendingCount} pending
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : null}

              <div className="grid gap-6">
                {collectionSets.map((set) => {
                  const progress = (set.collected.length / set.total) * 100;
                  return (
                    <div
                      key={set.id}
                      className="border border-line bg-background p-4 relative group hover:border-line-strong transition-colors"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-heading text-lg text-cream ">
                          {set.title}
                        </h3>
                        <span className="font-mono text-xs text-primary">
                          {set.collected.length}/{set.total}
                        </span>
                      </div>
                      {/* Progress Bar */}
                      <div className="h-1 bg-surface-2 w-full mb-4">
                        <div
                          style={{ width: `${progress}%` }}
                          className="h-full bg-cream/80"
                        ></div>
                      </div>

                      {/* Mini Grid of Items */}
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {set.items.map((item: CollectibleItem) => {
                          const isCollected = set.collected.includes(item.id);
                          return (
                            <div
                              key={item.id}
                              className={`w-12 h-12 flex-shrink-0 border ${isCollected ? "border-primary/30 bg-background" : "border-line bg-background"} flex items-center justify-center relative overflow-hidden`}
                            >
                              {isCollected ? (
                                <TrophyCanvas
                                  size="small"
                                  rarity={item.rarity}
                                  autoRotate={true}
                                  isInteractive={false}
                                  unlockedAt={
                                    collectibleTimestamps[item.id]?.unlockedAt
                                  }
                                  lastPolishedAt={
                                    collectibleTimestamps[item.id]
                                      ?.lastPolishedAt
                                  }
                                />
                              ) : (
                                <Lock size={10} className="text-fg-faint" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-24 p-12 border border-line bg-background relative overflow-hidden text-center group">
            {/* Locked State Visuals */}
            <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
              <Lock className="w-64 h-64 text-fg-muted" />
            </div>

            <div className="relative z-10 max-w-lg mx-auto">
              <Lock className="w-12 h-12 text-primary mx-auto mb-6" />
              <h2 className="font-heading text-3xl text-cream mb-4 tracking-wide">
                Access Restricted
              </h2>
              <p className="text-fg-muted font-mono text-sm uppercase tracking-widest mb-8 leading-relaxed">
                Classified data. Identify yourself to access achievement records
                and collection status.
              </p>
              <Button
                onClick={() => openAuthModal("login")}
                className="bg-cream text-ink hover:bg-cream font-heading tracking-widest px-8 py-6 rounded-none text-lg"
              >
                Authenticate User
              </Button>
            </div>
          </div>
        )}

        {/* --- MAINTENANCE SECTION: ORDERS & SETTINGS --- */}
        <div id="orders" className="border-t border-line pt-12">
          <h2 className="font-heading text-xl text-fg-muted tracking-widest mb-8 flex items-center gap-2">
            <Shield size={16} /> Account Maintenance
          </h2>

          {user ? (
            <Tabs defaultValue="history" className="w-full">
              <TabsList className="w-full bg-transparent border-b border-line p-0 h-auto justify-start rounded-none gap-8 mb-8 flex-wrap md:flex-nowrap">
                <TabsTrigger
                  value="history"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-line-strong data-[state=active]:bg-transparent data-[state=active]:text-cream text-fg-faint font-heading text-sm px-0 pb-2 tracking-widest hover:text-fg-muted transition-colors flex-1 md:flex-none text-left justify-start"
                >
                  Order History
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-line-strong data-[state=active]:bg-transparent data-[state=active]:text-cream text-fg-faint font-heading text-sm px-0 pb-2 tracking-widest hover:text-fg-muted transition-colors flex-1 md:flex-none text-left justify-start"
                >
                  System Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="history" className="mt-0">
                <div className="border border-line bg-background">
                  {/* Table Header */}
                  <div className="grid grid-cols-4 p-4 border-b border-line text-fg-muted uppercase tracking-widest font-label bg-background">
                    <div>Order ID</div>
                    <div>Date</div>
                    <div>Status</div>
                    <div className="text-right">Total</div>
                  </div>

                  {/* Order Rows */}
                  <div className="p-8 text-center text-fg-muted font-mono text-sm uppercase tracking-widest border-b border-line">
                    No orders found
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="settings">
                <div className="max-w-xl border border-line bg-background p-8 relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-fg-muted to-transparent"></div>
                  <h3 className="font-heading text-2xl text-cream mb-8 flex items-center gap-3">
                    <Terminal size={20} className="text-fg-muted" /> Account
                    Data
                  </h3>
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <label className=" uppercase tracking-widest text-fg-muted font-label">
                        Username / ID
                      </label>
                      <div className="p-4 bg-background border border-line text-fg-secondary font-mono text-sm flex justify-between items-center">
                        {displayName}
                        <div className="w-2 h-2 bg-success rounded-full"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className=" uppercase tracking-widest text-fg-muted font-label">
                        Email Address
                      </label>
                      <div className="p-4 bg-background border border-line text-fg-secondary font-mono text-sm">
                        {displayEmail}
                      </div>
                    </div>
                    <div className="pt-4 border-t border-line">
                      <Button className="bg-cream text-ink hover:bg-cream hover:text-ink font-heading tracking-[0.2em] text-lg px-8 py-6 rounded-none w-full border border-transparent hover:border-ink transition-all">
                        Save Changes
                      </Button>

                      <div className="mt-4">
                        <Button
                          variant="outline"
                          onClick={signOut}
                          className="w-full border border-danger/50 text-danger hover:bg-danger-strong hover:text-cream font-heading tracking-widest h-12 rounded-none"
                        >
                          Sign out
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="p-8 border border-line bg-background text-center text-fg-muted font-mono text-sm uppercase tracking-widest">
              Log in to access account maintenance
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
