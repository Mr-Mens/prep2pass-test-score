"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/url";

/** Browser Supabase client; safe to use for signup, login, logout, OAuth later. */
export function createSupabaseBrowserClient() {
  return createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey());
}
