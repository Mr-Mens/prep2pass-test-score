import type { WeakAreaId } from "@/lib/product-skill-map";

/** Slim row for dashboard storytelling (weak areas + mock flag). */
export type JourneySnapshot = {
  id: string;
  created_at: string;
  readiness_score: number;
  readiness_label: string;
  weak_areas: WeakAreaId[];
  mock_test_taken: boolean;
};
