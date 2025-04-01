import { z } from "zod";

export interface User {
  name: string;
  nickname: string;
  email: string;
  password: string;
}

export interface UserState {
  errors?: {
    [key in keyof User]?: string[];
  };
  message?: string | null;
}

export const userSchema = z.object({
  name: z.string().min(1, { message: "Please enter your valid name." }),
  nickname: z.string().min(1, { message: "Please enter your nickname." }),
  email: z.string().email({ message: "This email is invalid" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

export type LoginInfo = Omit<User, "name" | "nickname">;

export interface LoginInfoState {
  errors?: {
    [key in keyof LoginInfo]?: string[];
  };
  message?: string | null;
}

export const LoginInfoSchema = userSchema.omit({ name: true, nickname: true });

export type NicknameUpdateInfo = Pick<User, "nickname">;

export interface NicknameUpdateState {
  errors?: {
    [key in keyof NicknameUpdateInfo]?: string[];
  };
  message?: string | null;
}

export const nicknameUpdateSchema = userSchema.pick({ nickname: true });

export type PasswordUpdateInfo = Pick<User, "password"> & {
  confirmPassword: string;
};

export interface PasswordUpdateState {
  errors?: {
    [key in keyof PasswordUpdateInfo]?: string[];
  };
  message?: string | null;
}

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

export interface PostDto {
  id: number;
  title: string;
  content: string;
  videoUrl?: string;
  nickname: string;
  createdAt: string;
  updatedAt: string;
  board: BoardListItemDto;
  hotScore: number;
}

export type VideoCardInfo = Omit<PostDto, "content" | "updatedAt">;

export const postSchema = z.object({
  title: z.string().min(1, { message: "Please enter your title." }),
  content: z.string().min(1, { message: "Please enter your content." }),
  videoUrl: z.string().optional(),
});

export interface PostState {
  errors?: {
    title?: string[];
    content?: string[];
  };
  message?: string | null;
}

export interface CreatePostRequestBody {
  title: string;
  content: string;
  videoUrl: string;
  boardSlug: string;
}

export interface BoardListItemDto {
  id: number;
  slug: string;
  name: string;
  description?: string;
}
