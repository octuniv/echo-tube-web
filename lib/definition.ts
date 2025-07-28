import { z } from "zod";

export type FormState<T> = {
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
  AI_DIGEST = "ai_digest",
}

export const UserSchema = z.object({
  name: z.string().min(1, { message: "Please enter your valid name." }),
  nickname: z.string().min(1, { message: "Please enter your nickname." }),
  email: z.string().email({ message: "This email is invalid" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

export type User = z.infer<typeof UserSchema>;

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
export const LoginInfoSchema = UserSchema.omit({ name: true, nickname: true });

export type LoginInfo = z.infer<typeof LoginInfoSchema>;

export type LoginInfoState = FormState<LoginInfo>;

export const NicknameUpdateSchema = UserSchema.pick({ nickname: true });

export type NicknameUpdateInfo = z.infer<typeof NicknameUpdateSchema>;

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

export const CategoryBoardSummarySchema = z.object({
  id: z.number(),
  slug: z.string(),
  name: z.string(),
});

export type CategoryBoardSummary = z.infer<typeof CategoryBoardSummarySchema>;

export const CategoryBoardGroupSchema = z.object({
  purpose: z.nativeEnum(BoardPurpose),
  boards: z.array(CategoryBoardSummarySchema),
});

export type CategoryBoardGroup = z.infer<typeof CategoryBoardGroupSchema>;

export const CategoryWithBoardsResponseSchema = z.array(
  z.object({
    name: z.string(),
    boardGroups: z.array(CategoryBoardGroupSchema),
  })
);

export type CategoryWithBoardsResponse = z.infer<
  typeof CategoryWithBoardsResponseSchema
>;

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

export const CreatePostInputSchema = z.object({
  title: z.string().min(1, { message: "Please enter your title." }),
  content: z.string().min(1, { message: "Please enter your content." }),
  videoUrl: z.string().optional(),
});

export type CreatePostInput = z.infer<typeof CreatePostInputSchema>;

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
    currentPage: z.number().int().nonnegative(),
    totalItems: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  });

export type PaginatedResponseDto<T extends z.ZodTypeAny> = z.infer<
  ReturnType<typeof genericPaginatedResponseDtoSchema<T>>
>;
