import { z } from "zod";
import { FormState } from "../definition";

export const CategoryDetailSchema = z.object({
  id: z.number(),
  name: z.string(),
  allowedSlugs: z.array(z.string()),
  boardIds: z.array(z.number()),
});

export type CategoryDetail = z.infer<typeof CategoryDetailSchema>;

export const CategoryListResponseSchema = z.array(CategoryDetailSchema);

const NAME_REGEX = /^[A-Za-z가-힣\s'-]+$/;

export const CreateCategorySchema = z.object({
  name: z
    .string({
      required_error: "Name is required",
      invalid_type_error: "Name must be a string",
    })
    .regex(NAME_REGEX, {
      message: "이름은 숫자나 특수문자를 포함할 수 없습니다.",
    }),
  allowedSlugs: z
    .array(z.string())
    .min(1, { message: "최소 1개 이상의 슬러그가 필요합니다" }),
});

export type CreateCategory = z.infer<typeof CreateCategorySchema>;

export type CreateCategoryState = FormState<CreateCategory>;

export const UpdateCategorySchema = z
  .object({
    name: z.string().optional(),
    allowedSlugs: z.array(z.string()).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.name === undefined && data.allowedSlugs === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "name 또는 allowedSlugs 중 하나는 필수입니다.",
        path: ["name"],
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "name 또는 allowedSlugs 중 하나는 필수입니다.",
        path: ["allowedSlugs"],
      });
    } else {
      if (data.name !== undefined) {
        if (typeof data.name !== "string") {
          ctx.addIssue({
            code: z.ZodIssueCode.invalid_type,
            expected: "string",
            received: typeof data.name,
            message: "Name must be a string",
            path: ["name"],
          });
        } else if (!NAME_REGEX.test(data.name)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "이름은 숫자나 특수문자를 포함할 수 없습니다.",
            path: ["name"],
          });
        }
      }

      if (data.allowedSlugs !== undefined) {
        if (!Array.isArray(data.allowedSlugs)) {
          ctx.addIssue({
            code: z.ZodIssueCode.invalid_type,
            expected: "array",
            received: typeof data.allowedSlugs,
            message: "allowedSlugs must be an array",
            path: ["allowedSlugs"],
          });
        } else if (data.allowedSlugs.length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.too_small,
            minimum: 1,
            type: "array",
            inclusive: true,
            message: "최소 1개 이상의 슬러그가 필요합니다.",
            path: ["allowedSlugs"],
          });
        }
      }
    }
  });

export type UpdateCategory = z.infer<typeof UpdateCategorySchema>;

export type UpdateCategoryState = FormState<UpdateCategory>;

export const ValidateSlugSchema = z.object({
  isUsedInOtherCategory: z.boolean(),
});

export type ValidateSlugType = z.infer<typeof ValidateSlugSchema>;
