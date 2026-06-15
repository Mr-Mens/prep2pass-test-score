import type { DiagramDifficulty } from "@/lib/instructor/diagrams/types";

export function difficultyLabel(difficulty: DiagramDifficulty): string {
  if (difficulty === "beginner") return "Beginner";
  if (difficulty === "intermediate") return "Intermediate";
  return "Advanced";
}

export function difficultyBadgeClass(difficulty: DiagramDifficulty): string {
  if (difficulty === "beginner") return "bg-emerald-50 text-emerald-800 ring-emerald-200";
  if (difficulty === "intermediate") return "bg-amber-50 text-amber-900 ring-amber-200";
  return "bg-rose-50 text-rose-800 ring-rose-200";
}

export function formatTeachingTime(minutes: number): string {
  return `${minutes} min`;
}
