import { z } from "zod";

export type FormState<T> = {
  errors?: { [K in keyof T]?: string[] };
  message?: string | null;
};

export const PaginationDtoSchema = z.object({
  page: z
    .number()
    .int()
    .positive()
    .optional()
    .default(1)
    .describe("페이지 번호 (기본값: 1, 최소값: 1)"),
  limit: z
    .number()
    .int()
    .positive()
    .optional()
    .default(10)
    .describe("페이지당 항목 수 (기본값: 10, 최소값: 1)"),
  sort: z
    .enum(["createdAt", "updatedAt"])
    .optional()
    .describe("정렬 기준 필드 (createdAt/updatedAt)"),

  order: z
    .enum(["ASC", "DESC"])
    .optional()
    .describe("정렬 순서 (ASC: 오름차순, DESC: 내림차순)"),
});

export type PaginationDto = z.infer<typeof PaginationDtoSchema>;

export const genericPaginatedResponseDtoSchema = <T extends z.ZodTypeAny>(
  schema: T
) =>
  z.object({
    data: z.array(schema),
    currentPage: z.number().int().nonnegative(),
    totalItems: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  });
