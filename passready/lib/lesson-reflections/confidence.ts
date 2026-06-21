import type { LessonReflectionRow, TopicConfidenceEntry } from "@/lib/lesson-reflections/types";

export type TopicConfidenceMap = Record<string, { before: number; after: number }>;

export function syncTopicConfidenceWithTopics(topics: string[], previous: TopicConfidenceMap): TopicConfidenceMap {
  const next: TopicConfidenceMap = {};
  for (const topicId of topics) {
    next[topicId] = previous[topicId] ?? { before: 3, after: 3 };
  }
  return next;
}

export function topicConfidenceMapToEntries(map: TopicConfidenceMap, topics: string[]): TopicConfidenceEntry[] {
  return topics.map((topicId) => ({
    topicId,
    before: map[topicId]?.before ?? 3,
    after: map[topicId]?.after ?? 3,
  }));
}

export function aggregateConfidenceFromEntries(entries: TopicConfidenceEntry[]): { before: number; after: number } {
  if (entries.length === 0) return { before: 3, after: 3 };
  const beforeSum = entries.reduce((sum, entry) => sum + entry.before, 0);
  const afterSum = entries.reduce((sum, entry) => sum + entry.after, 0);
  return {
    before: Math.round(beforeSum / entries.length),
    after: Math.round(afterSum / entries.length),
  };
}

export function normalizeTopicConfidence(raw: unknown): TopicConfidenceEntry[] {
  if (!Array.isArray(raw)) return [];
  const entries: TopicConfidenceEntry[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const topicId = typeof row.topic_id === "string" ? row.topic_id : typeof row.topicId === "string" ? row.topicId : null;
    const before = typeof row.before === "number" ? row.before : null;
    const after = typeof row.after === "number" ? row.after : null;
    if (!topicId || before == null || after == null) continue;
    if (before < 1 || before > 5 || after < 1 || after > 5) continue;
    entries.push({ topicId, before, after });
  }
  return entries;
}

export function normalizeLessonReflectionRow(row: LessonReflectionRow): LessonReflectionRow {
  return {
    ...row,
    topic_confidence: normalizeTopicConfidence(row.topic_confidence),
  };
}

export function reflectionConfidenceDelta(row: LessonReflectionRow): number {
  const entries = normalizeTopicConfidence(row.topic_confidence);
  if (entries.length > 0) {
    return entries.reduce((sum, entry) => sum + (entry.after - entry.before), 0) / entries.length;
  }
  return row.confidence_after - row.confidence_before;
}

export function reflectionConfidenceImproved(row: LessonReflectionRow): boolean {
  return reflectionConfidenceDelta(row) > 0;
}

export function topicConfidenceToDb(entries: TopicConfidenceEntry[]): Array<{ topic_id: string; before: number; after: number }> {
  return entries.map((entry) => ({
    topic_id: entry.topicId,
    before: entry.before,
    after: entry.after,
  }));
}
