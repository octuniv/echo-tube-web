import {
  genericPaginatedResponseDtoSchema,
  PaginationDtoSchema,
  FormState,
} from "../commonSchemas";
import { UserRole } from "../enums";
import { UserSchema } from "../userAuthSchemas";
import { z } from "zod";

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
