"use client";

import { useRouter } from "next/navigation";
import { AuthPanel } from "@/components/auth-panel";
import { useAuthForm, type AuthAttempt } from "@/components/use-auth-form";
import type { AuthEntry } from "@/lib/auth-ui";
import { STORAGE_KEYS } from "@/lib/constants";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

/** `entry` is parsed on the server, so the first paint is already the right state. */
export function AuthPageClient({ entry }: { entry: AuthEntry }) {
  const router = useRouter();
  const form = useAuthForm({
    initialMode: entry.mode,
    initialEmail: entry.email,
    configured: isSupabaseConfigured,
  });

  const attempt: AuthAttempt = async (mode, email, password) => {
    localStorage.setItem(STORAGE_KEYS.LAST_PROVIDER, "email");

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return { kind: "error", error };
      // Refresh router to update server components with new auth state
      router.refresh();
      router.push(entry.next);
      return { kind: "done" };
    }

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { kind: "error", error };
    if (data.user?.email && !data.session) return { kind: "check" };
    router.refresh();
    router.push(entry.next);
    return { kind: "done" };
  };

  return (
    <AuthPanel
      context="page"
      view={form.view}
      code={entry.code}
      onModeChange={form.changeMode}
      values={form.values}
      onValueChange={form.setValue}
      onSubmit={form.submitWith(attempt)}
      loading={form.loading}
      configured={isSupabaseConfigured}
      fieldErrors={form.fieldErrors}
      formError={form.formError}
    />
  );
}
