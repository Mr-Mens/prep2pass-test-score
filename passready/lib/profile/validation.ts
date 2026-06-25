import { z } from "zod";

import { isValidUkPostcode, normalizeUkPostcode, UK_POSTCODE_INVALID_MESSAGE } from "./uk-postcode";

export const fullNameSchema = z
  .string()
  .trim()
  .min(2, "Enter your full name (at least 2 characters).");

export const postcodeSchema = z
  .string()
  .trim()
  .min(1, "Postcode is required.")
  .refine(isValidUkPostcode, UK_POSTCODE_INVALID_MESSAGE)
  .transform(normalizeUkPostcode);

export const optionalTextFieldSchema = z
  .string()
  .optional()
  .transform((value) => {
    const trimmed = (value ?? "").trim();
    return trimmed.length ? trimmed : null;
  });

export const optionalUkPostcodeFieldSchema = z
  .string()
  .optional()
  .transform((value) => {
    const trimmed = (value ?? "").trim();
    return trimmed.length ? normalizeUkPostcode(trimmed) : null;
  })
  .refine((value) => value === null || isValidUkPostcode(value), UK_POSTCODE_INVALID_MESSAGE);

export const adiNumberSchema = z
  .string()
  .trim()
  .min(4, "Enter your ADI/PDI number.")
  .max(32, "ADI/PDI number is too long.");

export const signupLearnerProfileSchema = z.object({
  fullName: fullNameSchema,
  postcode: postcodeSchema,
  preferredTestCentre: optionalTextFieldSchema,
});

export const signupInstructorProfileSchema = z.object({
  fullName: fullNameSchema,
  postcode: postcodeSchema,
  adiNumber: adiNumberSchema,
  teachingPostcode: optionalUkPostcodeFieldSchema,
  preferredTestCentreArea: optionalTextFieldSchema,
});

export const signupParentProfileSchema = z.object({
  fullName: fullNameSchema,
  postcode: postcodeSchema,
});

export const profilePatchLearnerSchema = z.object({
  fullName: fullNameSchema,
  postcode: postcodeSchema,
  preferredTestCentre: optionalTextFieldSchema,
});

export const profilePatchInstructorSchema = z.object({
  fullName: fullNameSchema,
  postcode: postcodeSchema,
  adiNumber: adiNumberSchema,
  teachingPostcode: optionalUkPostcodeFieldSchema,
  preferredTestCentreArea: optionalTextFieldSchema,
});

export const profilePatchParentSchema = z.object({
  fullName: fullNameSchema,
  postcode: postcodeSchema,
});

export type SignupLearnerProfile = z.infer<typeof signupLearnerProfileSchema>;
export type SignupInstructorProfile = z.infer<typeof signupInstructorProfileSchema>;
export type SignupParentProfile = z.infer<typeof signupParentProfileSchema>;
