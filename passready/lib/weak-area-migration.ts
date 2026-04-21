import { WEAK_AREA_OPTIONS, type WeakAreaId } from "./product-skill-map";

export {
  isManoeuvreWeakArea,
  MANOEUVRE_WEAK_AREA_IDS,
  type ManoeuvreWeakAreaId,
} from "./product-skill-map";

const VALID_IDS = new Set<string>(WEAK_AREA_OPTIONS.map((o) => o.id));

/** Legacy ids from older assessments (pre–Ready to Pass style mapping). */
const LEGACY_TO_NEW: Record<string, WeakAreaId[]> = {
  manoeuvres: ["pullUpOnRightReverse"],
  bayParking: ["forwardBayParking"],
  observations: ["mirrors"],
  clutchControl: ["movingOffSafely"],
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
