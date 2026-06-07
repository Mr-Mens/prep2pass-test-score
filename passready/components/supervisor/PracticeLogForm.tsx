"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/Button";
import { WEAK_AREA_OPTIONS } from "@/lib/constants";
import { SUPERVISOR_ROAD_TYPES } from "@/lib/supervisor/safety-guidance";

type Props = {
  recentLogs: Array<{
    id: string;
    practiced_on: string;
    duration_minutes: number;
    road_type: string;
    confidence_rating: number;
    notes: string | null;
    skills_practised: string[];
  }>;
};

export function PracticeLogForm({ recentLogs }: Props) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const [practicedOn, setPracticedOn] = useState(today);
  const [durationMinutes, setDurationMinutes] = useState("45");
  const [roadType, setRoadType] = useState<string>(SUPERVISOR_ROAD_TYPES[0]!);
  const [skills, setSkills] = useState<string[]>([]);
  const [confidenceRating, setConfidenceRating] = useState(3);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleSkill(id: string) {
    setSkills((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/supervisor/practice-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          practicedOn,
          durationMinutes: Number(durationMinutes),
          roadType,
          skillsPractised: skills.map((id) => WEAK_AREA_OPTIONS.find((o) => o.id === id)?.label ?? id),
          confidenceRating,
          notes: notes.trim() || null,
        }),
      });
      const data = (await res.json()) as { success?: boolean; error?: { message?: string } };
      if (!res.ok || !data.success) {
        setError(data.error?.message ?? "Could not save this session.");
        return;
      }
      setNotes("");
      setSkills([]);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={(e) => void onSubmit(e)} className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm ring-1 ring-brand-50">
        <h2 className="font-heading text-lg font-semibold text-brand-950">Log a practice session</h2>
        <p className="mt-2 text-sm text-brand-600">Record private practice to spot patterns and plan what to work on next.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-brand-900" htmlFor="pl-date">
              Date
            </label>
            <input
              id="pl-date"
              type="date"
              className="mt-1 block min-h-[48px] w-full rounded-xl border border-brand-200 px-4 py-3 text-sm"
              value={practicedOn}
              onChange={(e) => setPracticedOn(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-brand-900" htmlFor="pl-duration">
              Duration (minutes)
            </label>
            <input
              id="pl-duration"
              type="number"
              min={1}
              max={480}
              className="mt-1 block min-h-[48px] w-full rounded-xl border border-brand-200 px-4 py-3 text-sm"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-brand-900" htmlFor="pl-road">
              Road type
            </label>
            <select
              id="pl-road"
              className="mt-1 block min-h-[48px] w-full rounded-xl border border-brand-200 px-4 py-3 text-sm"
              value={roadType}
              onChange={(e) => setRoadType(e.target.value)}
            >
              {SUPERVISOR_ROAD_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        <fieldset className="mt-6">
          <legend className="text-sm font-medium text-brand-900">Skills practised</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {WEAK_AREA_OPTIONS.slice(0, 10).map((opt) => {
              const active = skills.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggleSkill(opt.id)}
                  className={`min-h-[44px] rounded-full border px-3 py-2 text-xs font-semibold transition ${
                    active
                      ? "border-teal-600 bg-teal-50 text-teal-900"
                      : "border-brand-200 bg-white text-brand-700 hover:border-teal-200"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="mt-6">
          <label className="text-sm font-medium text-brand-900">Confidence rating</label>
          <div className="mt-3 flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setConfidenceRating(n)}
                className={`flex h-12 w-12 items-center justify-center rounded-xl border text-sm font-semibold transition ${
                  confidenceRating === n
                    ? "border-teal-600 bg-teal-600 text-white"
                    : "border-brand-200 bg-white text-brand-800 hover:border-teal-200"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-brand-500">1 = very unsure · 5 = very confident</p>
        </div>

        <div className="mt-6">
          <label className="text-sm font-medium text-brand-900" htmlFor="pl-notes">
            Notes
          </label>
          <textarea
            id="pl-notes"
            rows={3}
            className="mt-1 block w-full rounded-xl border border-brand-200 px-4 py-3 text-sm"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What went well? What should you revisit next time?"
          />
        </div>

        {error ? (
          <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
            {error}
          </p>
        ) : null}

        <Button type="submit" variant="conversion" className="mt-6 min-h-[50px] w-full sm:w-auto" disabled={busy}>
          {busy ? "Saving…" : "Save practice session"}
        </Button>
      </form>

      <section className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm ring-1 ring-brand-50">
        <h2 className="font-heading text-lg font-semibold text-brand-950">Practice history</h2>
        {recentLogs.length === 0 ? (
          <p className="mt-4 text-sm text-brand-600">No sessions logged yet. Add your first entry above.</p>
        ) : (
          <ul className="mt-4 divide-y divide-brand-100">
            {recentLogs.map((log) => (
              <li key={log.id} className="py-4 first:pt-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-brand-950">
                      {new Date(log.practiced_on).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    <p className="mt-1 text-sm text-brand-600">
                      {log.duration_minutes} min · {log.road_type} · Confidence {log.confidence_rating}/5
                    </p>
                    {log.skills_practised.length > 0 ? (
                      <p className="mt-2 text-xs text-brand-500">{log.skills_practised.join(" · ")}</p>
                    ) : null}
                    {log.notes ? <p className="mt-2 text-sm leading-relaxed text-brand-700">{log.notes}</p> : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
