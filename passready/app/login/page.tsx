import { Suspense } from "react";

import { LoginFlow } from "./LoginFlow";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-16 text-center text-brand-600">Loading…</div>}>
      <LoginFlow />
    </Suspense>
  );
}
