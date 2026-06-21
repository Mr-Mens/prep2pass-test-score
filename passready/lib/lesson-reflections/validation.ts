import { z } from "zod";

import { aggregateConfidenceFromEntries } from "@/lib/lesson-reflections/confidence";
import { LESSON_REFLECTION_TYPES } from "@/lib/lesson-reflections/types";
import { SYLLABUS_TOPIC_ID_SET } from "@/lib/syllabus-topics";

const topicIdArray = z
  .array(z.string().trim().min(1))
  .max(12)
  .transform((ids) => ids.filter((id) => SYLLABUS_TOPIC_ID_SET.has(id)));

const topicConfidenceEntrySchema = z.object({
  topicId: z.string().trim().min(1),
  before: z.number().int().min(1).max(5),
  after: z.number().int().min(1).max(5),
});

export const createLessonReflectionSchema = z
  .object({
    learnerUserId: z.string().uuid().optional(),
    lessonDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    lessonHours: z.number().min(0.5).max(8),
    lessonType: z.enum(LESSON_REFLECTION_TYPES),
    topicsPractised: topicIdArray.default([]),
    topicConfidence: z.array(topicConfidenceEntrySchema).max(12).default([]),
    strengths: topicIdArray.default([]),
    difficulties: topicIdArray.default([]),
    difficultyNotes: z.string().trim().max(250).optional().nullable(),
    nextFocus: topicIdArray.default([]),
    privatePracticePlanned: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    const practised = new Set(data.topicsPractised);
    if (data.topicsPractised.length === 0) return;

    if (data.topicConfidence.length !== data.topicsPractised.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Set confidence before and after for each practised topic.",
        path: ["topicConfidence"],
      });
      return;
    }

    for (const entry of data.topicConfidence) {
      if (!practised.has(entry.topicId) || !SYLLABUS_TOPIC_ID_SET.has(entry.topicId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Confidence includes an invalid topic.",
          path: ["topicConfidence"],
        });
        return;
      }
    }

    for (const topicId of data.topicsPractised) {
      if (!data.topicConfidence.some((entry) => entry.topicId === topicId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Missing confidence for a practised topic.",
          path: ["topicConfidence"],
        });
        return;
      }
    }
  })
  .transform((data) => {
    const aggregate = aggregateConfidenceFromEntries(data.topicConfidence);
    return {
      ...data,
      confidenceBefore: aggregate.before,
      confidenceAfter: aggregate.after,
    };
  });

export type CreateLessonReflectionInput = z.infer<typeof createLessonReflectionSchema>;
