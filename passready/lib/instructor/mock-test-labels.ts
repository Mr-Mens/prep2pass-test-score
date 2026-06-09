import { ALL_FAULT_SECTIONS } from "@/lib/instructor/mock-test-rows";

const rowLabelByCompositeId = (() => {
  const m = new Map<string, string>();
  for (const sec of ALL_FAULT_SECTIONS) {
    for (const r of sec.rows) {
      m.set(`${sec.key}:${r.id}`, `${sec.title}: ${r.label}`);
    }
  }
  return m;
})();

export function formatFaultRowCompositeId(compositeId: string): string {
  return rowLabelByCompositeId.get(compositeId) ?? compositeId;
}
