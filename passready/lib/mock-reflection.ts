export const MOCK_REFLECTION_CATEGORIES = [
  { id: "mirrors_observations", label: "Mirrors / observations" },
  { id: "junctions", label: "Junctions" },
  { id: "roundabouts", label: "Roundabouts" },
  { id: "manoeuvres_parking", label: "Manoeuvres (parking)" },
  { id: "speed_control", label: "Speed / control" },
  { id: "signals", label: "Signals" },
  { id: "awareness_planning", label: "Awareness / planning" },
  { id: "positioning", label: "Positioning" },
  { id: "other_road_users", label: "Other road users" },
] as const;

export type MockReflectionCategoryId = (typeof MOCK_REFLECTION_CATEGORIES)[number]["id"];

export const MOCK_REFLECTION_SUB_OPTIONS = [
  { id: "mirrors_missed_checks", categoryId: "mirrors_observations", label: "Missed checks" },
  { id: "mirrors_late_checks", categoryId: "mirrors_observations", label: "Late checks" },
  { id: "mirrors_no_final_check", categoryId: "mirrors_observations", label: "No final blind spot check" },
  { id: "junctions_poor_observation", categoryId: "junctions", label: "Poor observation" },
  { id: "junctions_turn_timing", categoryId: "junctions", label: "Turned too early / late" },
  { id: "junctions_hesitated", categoryId: "junctions", label: "Hesitated" },
  { id: "roundabouts_lane_choice", categoryId: "roundabouts", label: "Wrong lane choice" },
  { id: "roundabouts_observation_timing", categoryId: "roundabouts", label: "Late observation" },
  { id: "roundabouts_exit_signal", categoryId: "roundabouts", label: "Missed exit signal" },
  { id: "manoeuvres_lost_control", categoryId: "manoeuvres_parking", label: "Lost control" },
  { id: "manoeuvres_poor_observation", categoryId: "manoeuvres_parking", label: "Poor observation" },
  { id: "manoeuvres_positioning", categoryId: "manoeuvres_parking", label: "Poor final position" },
  { id: "speed_control_too_fast", categoryId: "speed_control", label: "Too fast for conditions" },
  { id: "speed_control_too_slow", categoryId: "speed_control", label: "Too slow / uncertain speed" },
  { id: "speed_control_gear_brake", categoryId: "speed_control", label: "Gear / brake control issues" },
  { id: "signals_missed", categoryId: "signals", label: "Missed signal" },
  { id: "signals_timing", categoryId: "signals", label: "Signalled too early / late" },
  { id: "signals_confusing", categoryId: "signals", label: "Signal confused others" },
  { id: "awareness_planning_late_decisions", categoryId: "awareness_planning", label: "Late decisions" },
  { id: "awareness_planning_hazards", categoryId: "awareness_planning", label: "Missed developing hazards" },
  { id: "awareness_planning_reacting_not_planning", categoryId: "awareness_planning", label: "Reacting, not planning ahead" },
  { id: "positioning_lane_discipline", categoryId: "positioning", label: "Lane discipline drift" },
  { id: "positioning_road_position", categoryId: "positioning", label: "Poor road position" },
  { id: "positioning_cornering_line", categoryId: "positioning", label: "Unsafe cornering line" },
  { id: "other_road_users_space", categoryId: "other_road_users", label: "Unsafe spacing" },
  { id: "other_road_users_priority", categoryId: "other_road_users", label: "Priority judgement errors" },
  { id: "other_road_users_pedestrians_cyclists", categoryId: "other_road_users", label: "Late response to pedestrians/cyclists" },
] as const;

export type MockReflectionSubOptionId = (typeof MOCK_REFLECTION_SUB_OPTIONS)[number]["id"];

export function detailsForCategory(categoryId: MockReflectionCategoryId) {
  return MOCK_REFLECTION_SUB_OPTIONS.filter((item) => item.categoryId === categoryId);
}

