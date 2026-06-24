"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/Button";
import { formatPenceGbp } from "@/lib/commercial/constants";

type PayoutRequestRow = {
  id: string;
  instructor_id: string;
  instructor_email: string | null;
  amount: number;
  status: "requested" | "approved" | "paid" | "rejected";
  requested_at: string;
  processed_at: string | null;
  notes: string | null;
};

type Props = {
  adminKey: string;
};

export function AdminPayoutRequestsPanel({ adminKey }: Props) {
  const [rows, setRows] = useState<PayoutRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/payout-requests", {
        headers: { "x-admin-access-key": adminKey },
      });
      const json = (await res.json()) as { success?: boolean; requests?: PayoutRequestRow[]; error?: { message?: string } };
      if (!json.success || !json.requests) {
        setError(json.error?.message ?? "Could not load payout requests.");
        setRows([]);
        return;
      }
      setRows(json.requests);
    } finally {
      setLoading(false);
    }
  }, [adminKey]);

  useEffect(() => {
    void load();
  }, [load]);

  async function updateStatus(id: string, status: PayoutRequestRow["status"]) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch("/api/admin/payout-requests", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-access-key": adminKey,
        },
        body: JSON.stringify({ id, status }),
      });
      const json = (await res.json()) as { success?: boolean; error?: { message?: string } };
      if (!json.success) {
        setError(json.error?.message ?? "Could not update payout request.");
        return;
      }
      await load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="rounded-2xl border border-brand-200/80 bg-white p-6 shadow-card ring-1 ring-black/[0.02]">
      <h2 className="font-heading text-xl font-semibold text-brand-950">Instructor payout requests</h2>
      <p className="mt-2 text-sm text-brand-600">
        Manual payout queue for Phase 1 referral commissions. Mark requests paid after bank transfer.
      </p>

      {loading ? <p className="mt-4 text-sm text-brand-600">Loading…</p> : null}
      {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}

      {!loading && rows.length === 0 ? (
        <p className="mt-4 text-sm text-brand-600">No payout requests yet.</p>
      ) : null}

      <div className="mt-6 space-y-4">
        {rows.map((row) => (
          <div key={row.id} className="rounded-xl border border-brand-100 bg-brand-50/30 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-medium text-brand-950">{formatPenceGbp(row.amount)}</p>
                <p className="text-sm text-brand-600">{row.instructor_email ?? row.instructor_id}</p>
                <p className="mt-1 text-xs text-brand-500">
                  Requested {new Date(row.requested_at).toLocaleString("en-GB")} · Status: {row.status}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {row.status === "requested" ? (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={busyId === row.id}
                      onClick={() => void updateStatus(row.id, "approved")}
                    >
                      Approve
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={busyId === row.id}
                      onClick={() => void updateStatus(row.id, "rejected")}
                    >
                      Reject
                    </Button>
                  </>
                ) : null}
                {row.status === "approved" || row.status === "requested" ? (
                  <Button
                    type="button"
                    disabled={busyId === row.id}
                    onClick={() => void updateStatus(row.id, "paid")}
                  >
                    Mark paid
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
