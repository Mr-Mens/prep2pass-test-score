import { Suspense } from "react";

import { VerifyEmailFlow } from "./VerifyEmailFlow";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-16 text-center text-brand-600">Loading…</div>}>
      <VerifyEmailFlow />
    </Suspense>
  );
}
