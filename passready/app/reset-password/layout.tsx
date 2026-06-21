import type { Metadata } from "next";

import { ROBOTS_PRIVATE } from "@/lib/seo/metadata";

export const metadata: Metadata = {
  robots: ROBOTS_PRIVATE,
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
