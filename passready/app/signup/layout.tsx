import type { Metadata } from "next";

import { PRODUCT } from "@/lib/constants";
import { ROBOTS_PRIVATE } from "@/lib/seo/metadata";

export const metadata: Metadata = {
  title: `Join ${PRODUCT.name}`,
  description: `Create your ${PRODUCT.name} account. Accept your instructor invitation and start your learner dashboard.`,
  openGraph: {
    title: `Join ${PRODUCT.name}`,
    description: `Your instructor invited you to ${PRODUCT.name}.`,
    siteName: PRODUCT.name,
  },
  robots: ROBOTS_PRIVATE,
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
