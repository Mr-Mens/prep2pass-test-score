import { z } from "zod";

import { LESSON_STATUSES } from "@/lib/instructor-lessons/types";
import { SYLLABUS_TOPIC_ID_SET } from "@/lib/syllabus-topics";

const topicIdArray = z
  .array(z.string().trim().min(1))
  .max(12)
  .transform((ids) => ids.filter((id) => SYLLABUS_TOPIC_ID_SET.has(id)));

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM format.");

export const createInstructorLessonSchema = z.object({
  pupilId: z.string().uuid(),
  lessonDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: timeSchema,
  durationMinutes: z.number().int().min(30).max(360),
  lessonFocus: topicIdArray.default([]),
  location: z.string().trim().max(120).optional().nullable(),
  instructorNotes: z.string().trim().max(500).optional().nullable(),
  status: z.enum(LESSON_STATUSES).default("planned"),
});

export const updateInstructorLessonSchema = createInstructorLessonSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: "No changes provided." });

export type CreateInstructorLessonInput = z.infer<typeof createInstructorLessonSchema>;
export type UpdateInstructorLessonInput = z.infer<typeof updateInstructorLessonSchema>;
