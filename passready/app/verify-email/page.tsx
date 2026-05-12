import { Suspense } from "react";

import { AuthScreenChrome } from "@/components/auth/AuthScreenChrome";

import { VerifyEmailFlow } from "./VerifyEmailFlow";

function VerifyLoading() {
  return (
    <div className="rounded-2xl border border-teal-200/70 bg-white p-10 text-center text-sm text-brand-600 shadow-card">
      Loading…
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthScreenChrome>
      <Suspense fallback={<VerifyLoading />}>
        <VerifyEmailFlow />
      </Suspense>
    </AuthScreenChrome>
  );
}
