import { z } from "zod";
import {
  UserRole,
  genericPaginatedResponseDtoSchema,
  UserSchema,
  FormState,
} from "../definition";

export const AdminUserDetailResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  nickname: z.string(),
  email: z.string(),
  role: z.nativeEnum(UserRole),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.nullable(z.string().datetime()).optional(),
});

export type AdminUserDetailResponse = z.infer<
  typeof AdminUserDetailResponseSchema
>;

export const AdminUserListPaginatedSchema = genericPaginatedResponseDtoSchema(
  AdminUserDetailResponseSchema
);

export type AdminUserListPaginatedResponse = z.infer<
  typeof AdminUserListPaginatedSchema
>;

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

export const SearchUserDtoSchema = PaginationDtoSchema.extend({
  searchEmail: z.string().optional(),
  searchNickname: z.string().optional(),
  searchRole: z.nativeEnum(UserRole).optional(),
});

export type SearchUserDto = z.infer<typeof SearchUserDtoSchema>;

export const AdminUserCreateSchema = UserSchema.extend({
  role: z.nativeEnum(UserRole),
});

export type AdminUserCreate = z.infer<typeof AdminUserCreateSchema>;

export type AdminUserCreateState = FormState<AdminUserCreate>;

export const AdminUserUpdateSchema = z
  .object({
    name: z
      .string()
      .min(1, { message: "Please enter your valid name." })
      .optional(),
    nickname: z
      .string()
      .min(1, { message: "Please enter your nickname." })
      .optional(),
    role: z.nativeEnum(UserRole).optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "At least one field must be updated",
  });

export type AdminUserUpdate = z.infer<typeof AdminUserUpdateSchema>;

export type AdminUserUpdateState = FormState<AdminUserUpdate>;
