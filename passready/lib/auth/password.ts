/**
 * Validates password before sending to Supabase Auth.
 * Plain-text passwords never persist server-side beyond the signup/reset handshake.
 */
import { z } from "zod";

const hasLetterRegex = /[A-Za-z]/;
const hasNumberRegex = /\d/;

export const passwordFieldSchema = z
  .string()
  .min(8, "Use at least 8 characters.")
  .refine((s) => hasLetterRegex.test(s), {
    message: "Include at least one letter.",
  })
  .refine((s) => hasNumberRegex.test(s), {
    message: "Include at least one number.",
  });
