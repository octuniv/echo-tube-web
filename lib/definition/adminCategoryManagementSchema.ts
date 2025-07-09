import { z } from "zod";
import { BoardPurpose, FormState, UserRole } from "../definition";
import { CATEGORY_ERROR_MESSAGES } from "../constants/category/errorMessage";

export const CategorySummarySchema = z.object({
  id: z.number(),
  name: z.string(),
  allowedSlugs: z.array(z.string()),
  boardIds: z.array(z.number()),
});

export type CategorySummary = z.infer<typeof CategorySummarySchema>;

export const CategoryListResponseSchema = z.array(CategorySummarySchema);

const BoardSummarySchema = z.object({
  id: z.number(),
  slug: z.string(),
  name: z.string(),
  type: z.nativeEnum(BoardPurpose),
  requiredRole: z.nativeEnum(UserRole),
});

export type BoardSummary = z.infer<typeof BoardSummarySchema>;

export const CategoryDetailsSchema = z.object({
  id: z.number(),
  name: z.string(),
  allowedSlugs: z.array(z.string()),
  boards: z.array(BoardSummarySchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type CategoryDetails = z.infer<typeof CategoryDetailsSchema>;

export const NAME_REGEX = /^[A-Za-z가-힣\s'-]*$/;

export const SLUG_REGEX = /^[a-z0-9-]+$/;

export const CategoryFormValidationSchema = z.object({
  name: z
    .string({
      required_error: CATEGORY_ERROR_MESSAGES.NAME_REQUIRED,
      invalid_type_error: CATEGORY_ERROR_MESSAGES.NAME_SHOULD_BE_STRING,
    })
    .nonempty(CATEGORY_ERROR_MESSAGES.NAME_REQUIRED)
    .regex(NAME_REGEX, {
      message: CATEGORY_ERROR_MESSAGES.INVALID_NAME,
    }),
  allowedSlugs: z
    .array(
      z
        .string()
        .nonempty(CATEGORY_ERROR_MESSAGES.SLUG_REQUIRED)
        .refine((slug) => slug === "" || SLUG_REGEX.test(slug), {
          message: CATEGORY_ERROR_MESSAGES.INVALID_SLUGS,
        })
    )
    .min(1, { message: CATEGORY_ERROR_MESSAGES.SLUGS_REQUIRED }),
});

export type CategoryFormData = z.infer<typeof CategoryFormValidationSchema>;

export type CategoryFormState = FormState<CategoryFormData>;

export const ValidateDataSchema = z.object({
  isUsed: z.boolean(),
  error: z.string().optional(),
});

export type ValidateDataType = z.infer<typeof ValidateDataSchema>;
