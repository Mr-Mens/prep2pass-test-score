import type { Metadata } from "next";

import { LinkLearnerForm } from "@/components/supervisor/LinkLearnerForm";
import { SupervisorDisclaimers } from "@/components/supervisor/SupervisorDisclaimers";
import { getLinkedLearnerForParent, requireParentSession } from "@/lib/server/supervisor-page-auth";

export const metadata: Metadata = {
  title: "Link learner · Parent supervisor",
  description: "Connect your Prep2Pass parent account to your learner.",
};

export default async function SupervisorLinkLearnerPage() {
  const user = await requireParentSession();
  const link = await getLinkedLearnerForParent(user.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-brand-950">Link learner</h1>
        <p className="mt-2 text-sm text-brand-600">
          Connect your account to your learner&apos;s Prep2Pass profile to view their progress and reports here.
        </p>
      </header>

      {link ? (
        <section className="rounded-2xl border border-teal-200 bg-teal-50/60 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">Current link</p>
          <p className="mt-2 font-semibold text-brand-950">{link.learner_name ?? link.learner_email}</p>
          <p className="text-sm text-brand-600">{link.learner_email}</p>
          <p className="mt-2 text-sm text-brand-700">
            Status:{" "}
            <span className="font-semibold capitalize">{link.status === "linked" ? "Connected" : link.status}</span>
          </p>
        </section>
      ) : null}

      <LinkLearnerForm />
      <SupervisorDisclaimers compact />
    </div>
  );
}
