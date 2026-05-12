import { Suspense } from "react";

import { AuthScreenChrome } from "@/components/auth/AuthScreenChrome";

import { LoginFlow } from "./LoginFlow";

function LoginLoading() {
  return (
    <div className="rounded-2xl border border-brand-200/90 bg-white p-10 text-center text-sm text-brand-600 shadow-card">
      Loading…
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthScreenChrome>
      <Suspense fallback={<LoginLoading />}>
        <LoginFlow />
      </Suspense>
    </AuthScreenChrome>
  );
}
