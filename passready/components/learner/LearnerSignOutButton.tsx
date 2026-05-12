"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LearnerSignOutButton() {
  async function handle() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.assign("/");
  }

  return (
    <button
      type="button"
      onClick={() => void handle()}
      className="flex min-h-[52px] w-full items-center justify-center rounded-2xl border border-red-100 bg-white px-5 text-base font-semibold text-red-800 shadow-sm transition hover:bg-red-50"
    >
      Sign out
    </button>
  );
}
