import { z } from "zod";
import { BoardPurpose, FormState, UserRole } from "../definition";

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

const NAME_REGEX = /^[A-Za-z가-힣\s'-]*$/;

export const CategoryFormValidationSchema = z.object({
  name: z
    .string({
      required_error: "Name is required",
      invalid_type_error: "Name must be a string",
    })
    .nonempty("이름은 필수입니다.")
    .regex(NAME_REGEX, {
      message: "이름은 숫자나 특수문자를 포함할 수 없습니다.",
    }),
  allowedSlugs: z
    .array(z.string().nonempty("슬러그는 필수입니다."))
    .min(1, { message: "최소 1개 이상의 슬러그가 필요합니다" }),
});

export type CategoryFormData = z.infer<typeof CategoryFormValidationSchema>;

export type CategoryFormState = FormState<CategoryFormData>;

export const ValidateSlugSchema = z.object({
  isUsed: z.boolean(),
});

export type ValidateSlugType = z.infer<typeof ValidateSlugSchema>;
