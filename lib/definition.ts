import { z } from "zod";

type FormState<T> = {
  errors?: { [K in keyof T]?: string[] };
  message?: string | null;
};

export enum UserRole {
  ADMIN = "admin",
  USER = "user",
  BOT = "bot",
}

export enum BoardPurpose {
  GENERAL = "general",
  AI_DEGEST = "ai_digest",
}

export const userSchema = z.object({
  name: z.string().min(1, { message: "Please enter your valid name." }),
  nickname: z.string().min(1, { message: "Please enter your nickname." }),
  email: z.string().email({ message: "This email is invalid" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

export type User = z.infer<typeof userSchema>;

export type UserState = FormState<User>;

export interface UserAuthInfo {
  name: string;
  nickname: string;
  email: string;
  role: UserRole | null;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: UserAuthInfo;
}
export const LoginInfoSchema = userSchema.omit({ name: true, nickname: true });

export type LoginInfo = z.infer<typeof LoginInfoSchema>;

export type LoginInfoState = FormState<LoginInfo>;

export const nicknameUpdateSchema = userSchema.pick({ nickname: true });

export type NicknameUpdateInfo = z.infer<typeof nicknameUpdateSchema>;

export type NicknameUpdateState = FormState<NicknameUpdateInfo>;

export const PasswordUpdateSchema = z
  .object({
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters" }),
    confirmPassword: z
      .string()
      .min(6, { message: "Password must be at least 6 characters" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "The password you entered does not match",
    path: ["confirmPassword"],
  });

export type PasswordUpdateInfo = z.infer<typeof PasswordUpdateSchema>;

export type PasswordUpdateState = FormState<PasswordUpdateInfo>;

export const BoardListItemDtoSchema = z.object({
  id: z.number(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  requiredRole: z.nativeEnum(UserRole),
  boardType: z.nativeEnum(BoardPurpose),
});

export type BoardListItemDto = z.infer<typeof BoardListItemDtoSchema>;

export const PostResponseSchema = z.object({
  id: z.number(),
  title: z.string(),
  content: z.string(),
  views: z.number(),
  commentsCount: z.number(),
  videoUrl: z.string().nullable().optional(),
  nickname: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  board: BoardListItemDtoSchema,
  hotScore: z.number(),
  channelTitle: z.string().nullable().optional(),
  duration: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
});

export type PostResponse = z.infer<typeof PostResponseSchema>;

export type VideoCardInfo = Pick<
  PostResponse,
  "id" | "title" | "nickname" | "createdAt" | "videoUrl"
> & {
  channelTitle?: string | null;
  duration?: string | null;
  source?: string | null;
};

export const createPostInputSchema = z.object({
  title: z.string().min(1, { message: "Please enter your title." }),
  content: z.string().min(1, { message: "Please enter your content." }),
  videoUrl: z.string().optional(),
});

export type CreatePostInput = z.infer<typeof createPostInputSchema>;

export type CreatePostInputState = FormState<CreatePostInput>;

export interface CreatePostRequestBody {
  title: string;
  content: string;
  videoUrl: string;
  boardSlug: string;
}

export const DashboardSummaryDtoSchema = z.object({
  visitors: z.number(),
  recentPosts: z.array(PostResponseSchema),
  popularPosts: z.array(PostResponseSchema),
  noticesPosts: z.array(PostResponseSchema),
});

export type DashboardSummaryDto = z.infer<typeof DashboardSummaryDtoSchema>;

export const genericPaginatedResponseDtoSchema = <T extends z.ZodTypeAny>(
  schema: T
) =>
  z.object({
    data: z.array(schema),
    currentPage: z.number().int().positive(),
    totalItems: z.number().int().nonnegative(),
    totalPages: z.number().int().positive(),
  });

export type PaginatedResponseDto<T extends z.ZodTypeAny> = z.infer<
  ReturnType<typeof genericPaginatedResponseDtoSchema<T>>
>;

export const AdminUserListResponseDtoSchema = z.object({
  id: z.number(),
  name: z.string(),
  nickname: z.string(),
  email: z.string(),
  role: z.nativeEnum(UserRole),
  createdAt: z.string().datetime(),
  deletedAt: z.nullable(z.string().datetime()).optional(),
});

export type AdminUserListResponseDto = z.infer<
  typeof AdminUserListResponseDtoSchema
>;

export const AdminUserListPaginatedSchema = genericPaginatedResponseDtoSchema(
  AdminUserListResponseDtoSchema
);

export type AdminUserListPaginatedResponse = z.infer<
  typeof AdminUserListPaginatedSchema
>;

export const PaginationDtoSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().optional().default(10),
});

export type PaginationDto = z.infer<typeof PaginationDtoSchema>;

export const adminUserCreateSchema = userSchema.extend({
  role: z.nativeEnum(UserRole),
});

export type AdminUserCreate = z.infer<typeof adminUserCreateSchema>;

export type AdminUserCreateState = FormState<AdminUserCreate>;

export const adminUserUpdateSchema = z
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

export type AdminUserUpdate = z.infer<typeof adminUserUpdateSchema>;

export type AdminUserUpdateState = FormState<AdminUserUpdate>;
