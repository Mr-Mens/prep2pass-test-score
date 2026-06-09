"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Notification = {
  id: string;
  kind: string;
  title: string;
  body: string;
  action_payload: Record<string, unknown>;
  created_at: string;
};

export function LearnerNotificationsPanel() {
  const router = useRouter();
  const [items, setItems] = useState<Notification[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/learner/notifications", { credentials: "include" });
        const json = (await res.json()) as { success?: boolean; notifications?: Notification[] };
        if (json.success && json.notifications) setItems(json.notifications);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  async function respond(notificationId: string, action: "accept" | "decline") {
    setBusyId(notificationId);
    try {
      const res = await fetch(`/api/learner/notifications/${notificationId}/respond`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = (await res.json()) as { success?: boolean };
      if (json.success) {
        setItems((prev) => prev.filter((n) => n.id !== notificationId));
        router.refresh();
      }
    } finally {
      setBusyId(null);
    }
  }

  if (!loaded || items.length === 0) return null;

  return (
    <section className="rounded-2xl border border-teal-200/80 bg-teal-50/50 p-5 shadow-sm ring-1 ring-teal-100">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-teal-800">Notifications</h2>
      <ul className="mt-4 space-y-4">
        {items.map((n) => (
          <li key={n.id} className="rounded-xl border border-white/80 bg-white p-4 shadow-sm">
            <p className="font-semibold text-brand-950">{n.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-brand-700">{n.body}</p>
            {n.kind === "instructor_pupil_invite" ? (
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  disabled={busyId === n.id}
                  onClick={() => void respond(n.id, "accept")}
                  className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:opacity-50"
                >
                  Accept
                </button>
                <button
                  type="button"
                  disabled={busyId === n.id}
                  onClick={() => void respond(n.id, "decline")}
                  className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-brand-200 bg-white px-4 text-sm font-semibold text-brand-800 transition hover:bg-brand-50 disabled:opacity-50"
                >
                  Decline
                </button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
