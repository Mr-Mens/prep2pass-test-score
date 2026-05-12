import { Suspense } from "react";

import { AuthScreenChrome } from "@/components/auth/AuthScreenChrome";

import { SignupFlow } from "./SignupFlow";

function SignupLoading() {
  return (
    <div className="rounded-2xl border border-brand-200/90 bg-white p-10 text-center text-sm text-brand-600 shadow-card">
      Loading…
    </div>
  );
}

export default function SignupPage() {
  return (
    <AuthScreenChrome>
      <Suspense fallback={<SignupLoading />}>
        <SignupFlow />
      </Suspense>
    </AuthScreenChrome>
  );
}
