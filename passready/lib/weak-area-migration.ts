import { WEAK_AREA_OPTIONS, type WeakAreaId } from "./constants";

/** Manoeuvre checkbox ids (all map to skill group "Manoeuvres"). */
export const MANOEUVRE_WEAK_AREA_IDS = [
  "forwardBayParking",
  "reverseBayParking",
  "pullUpOnRightReverse",
  "parallelParking",
] as const satisfies readonly WeakAreaId[];

export type ManoeuvreWeakAreaId = (typeof MANOEUVRE_WEAK_AREA_IDS)[number];

const VALID_IDS = new Set<string>(WEAK_AREA_OPTIONS.map((o) => o.id));

/** Legacy ids from older assessments before manoeuvres were split. */
const LEGACY_TO_NEW: Record<string, WeakAreaId[]> = {
  manoeuvres: ["pullUpOnRightReverse"],
  bayParking: ["forwardBayParking"],
};

/**
 * Map deprecated weak-area ids to current ids. Drops unknown strings.
 * Idempotent for already-migrated payloads.
 */
export function migrateWeakAreaIds(raw: readonly string[]): WeakAreaId[] {
  const out = new Set<WeakAreaId>();
  for (const id of raw) {
    if (VALID_IDS.has(id)) {
      out.add(id as WeakAreaId);
      continue;
    }
    const mapped = LEGACY_TO_NEW[id];
    if (mapped) {
      mapped.forEach((m) => out.add(m));
    }
  }
  return Array.from(out);
}

export function isManoeuvreWeakArea(id: WeakAreaId): id is ManoeuvreWeakAreaId {
  return (MANOEUVRE_WEAK_AREA_IDS as readonly string[]).includes(id);
}
