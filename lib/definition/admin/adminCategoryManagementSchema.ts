import { CATEGORY_ERROR_MESSAGES } from "../../../lib/constants/category/errorMessage";
import { FormState } from "../commonSchemas";
import { BoardPurpose, UserRole } from "../enums";
import { z } from "zod";

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

export const AvailableCategorySlugSchema = z.object({
  slug: z.string().regex(SLUG_REGEX, {
    message:
      "Invalid slug format (only lowercase letters, numbers, and hyphens allowed)",
  }),
});

// 카테고리 검증 스키마
export const AvailableCategoryDtoSchema = z.object({
  id: z.number({
    required_error: "Category ID is required",
    invalid_type_error: "Category ID must be a number",
  }),
  name: z.string({
    required_error: "Category name is required",
    invalid_type_error: "Category name must be a string",
  }),
  availableSlugs: z.array(AvailableCategorySlugSchema),
});

// 전체 응답 검증 스키마
export const AvailableCategoriesResponseSchema = z.array(
  AvailableCategoryDtoSchema
);

// 타입 정의

export type AvailableCategorySlug = z.infer<typeof AvailableCategorySlugSchema>;

export type AvailableCategoryDto = z.infer<typeof AvailableCategoryDtoSchema>;

export type AvailableCategoriesResponse = z.infer<
  typeof AvailableCategoriesResponseSchema
>;
