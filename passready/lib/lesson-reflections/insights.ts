import { MANOEUVRE_TOPIC_IDS } from "@/lib/lesson-reflections/constants";
import { reflectionConfidenceDelta, reflectionConfidenceImproved } from "@/lib/lesson-reflections/confidence";
import type { LessonReflectionRow, ReflectionDashboardSummary, ReflectionInsights } from "@/lib/lesson-reflections/types";
import { SYLLABUS_TOPIC_IDS, syllabusTopicLabel } from "@/lib/syllabus-topics";

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function daysSince(isoDate: string): number {
  const ms = Date.now() - new Date(`${isoDate}T12:00:00`).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function countTopicOccurrences(
  reflections: LessonReflectionRow[],
  field: "topics_practised" | "difficulties" | "strengths" | "next_focus",
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of reflections) {
    for (const id of row[field]) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  return counts;
}

function topEntry(counts: Map<string, number>): { topicId: string; label: string; count: number } | null {
  let best: { topicId: string; count: number } | null = null;
  for (const [topicId, count] of Array.from(counts.entries())) {
    if (!best || count > best.count) best = { topicId, count };
  }
  return best ? { ...best, label: syllabusTopicLabel(best.topicId) } : null;
}

export function buildReflectionInsights(reflections: LessonReflectionRow[]): ReflectionInsights {
  const recent = reflections.slice(0, 12);
  const difficultyCounts = countTopicOccurrences(recent, "difficulties");
  const strengthCounts = countTopicOccurrences(recent, "strengths");
  const practisedCounts = countTopicOccurrences(recent, "topics_practised");

  const repeatedWeaknesses = Array.from(difficultyCounts.entries())
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topicId, count]) => ({ topicId, label: syllabusTopicLabel(topicId), count }));

  const lastFive = recent.slice(0, 5);
  const averageDelta =
    lastFive.length > 0
      ? lastFive.reduce((sum, row) => sum + reflectionConfidenceDelta(row), 0) / lastFive.length
      : 0;

  const direction: ReflectionInsights["confidenceTrend"]["direction"] =
    averageDelta > 0.15 ? "up" : averageDelta < -0.15 ? "down" : "steady";

  const confidenceSummary =
    lastFive.length === 0
      ? "Add a reflection after your next lesson to start tracking confidence."
      : direction === "up"
        ? `Confidence is trending up by ${averageDelta.toFixed(1)} on average after recent lessons.`
        : direction === "down"
          ? `Confidence has dipped slightly (${averageDelta.toFixed(1)} on average). Focus on one win per lesson.`
          : "Confidence is holding steady across recent lessons.";

  const practisedSet = new Set(practisedCounts.keys());
  const underPractisedTopics = SYLLABUS_TOPIC_IDS.filter((id) => !practisedSet.has(id))
    .slice(0, 6)
    .map((topicId) => ({ topicId, label: syllabusTopicLabel(topicId) }));

  const improvingTopics = Array.from(strengthCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topicId, count]) => ({ topicId, label: syllabusTopicLabel(topicId), count }));

  const highlights: string[] = [];
  if (repeatedWeaknesses[0]) {
    highlights.push(`${repeatedWeaknesses[0].label} keeps appearing as a difficulty. Worth a focused repeat.`);
  }
  if (improvingTopics[0]) {
    highlights.push(`${improvingTopics[0].label} is showing up in what went well.`);
  }
  if (underPractisedTopics[0]) {
    highlights.push(`${underPractisedTopics[0].label} has not been logged recently. Consider covering it soon.`);
  }
  if (recent.filter((row) => row.lesson_type === "private_practice").length >= 2) {
    highlights.push("Private practice is building consistency between paid lessons.");
  }
  if (highlights.length === 0) {
    highlights.push("Keep logging short reflections after each lesson to unlock richer Progress Insights.");
  }

  return {
    repeatedWeaknesses,
    confidenceTrend: {
      averageDelta,
      direction,
      summary: confidenceSummary,
    },
    underPractisedTopics,
    improvingTopics,
    highlights,
  };
}

export function buildReflectionDashboardSummary(reflections: LessonReflectionRow[]): ReflectionDashboardSummary {
  const insights = buildReflectionInsights(reflections);
  const practisedCounts = countTopicOccurrences(reflections.slice(0, 20), "topics_practised");
  const difficultyCounts = countTopicOccurrences(reflections.slice(0, 20), "difficulties");

  return {
    totalReflections: reflections.length,
    confidenceTrend: insights.confidenceTrend,
    mostPractisedTopic: topEntry(practisedCounts),
    mostRepeatedDifficulty: topEntry(difficultyCounts),
    latestReflectionId: reflections[0]?.id ?? null,
    insights,
  };
}

export function computeReflectionScoreAdjustment(reflections: LessonReflectionRow[]): number {
  if (reflections.length === 0) return 0;

  const recent = reflections.slice(0, 12);
  let adjustment = 0;

  const lastFive = recent.slice(0, 5);
  if (lastFive.length > 0) {
    const avgDelta = lastFive.reduce((sum, row) => sum + reflectionConfidenceDelta(row), 0) / lastFive.length;
    adjustment += clamp(Math.round(avgDelta), -2, 2);

    const improvingCount = lastFive.filter((row) => reflectionConfidenceImproved(row)).length;
    if (improvingCount >= 3) adjustment += 1;
  }

  const difficultyCounts = countTopicOccurrences(recent.slice(0, 8), "difficulties");
  const maxRepeat = Math.max(0, ...Array.from(difficultyCounts.values()));
  if (maxRepeat >= 4) adjustment -= 2;
  else if (maxRepeat >= 3) adjustment -= 1;

  const recent21Count = recent.filter((row) => daysSince(row.lesson_date) <= 21).length;
  if (recent21Count >= 4) adjustment += 1;
  if (recent21Count >= 7) adjustment += 1;

  if (recent.filter((row) => row.lesson_type === "private_practice").length >= 2) adjustment += 1;

  const manoeuvreSet = new Set<string>(MANOEUVRE_TOPIC_IDS);
  if (recent.some((row) => row.topics_practised.some((topicId) => manoeuvreSet.has(topicId)))) {
    adjustment += 1;
  }

  return clamp(adjustment, -5, 5);
}
