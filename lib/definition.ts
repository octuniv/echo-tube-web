import { z } from "zod";

export interface User {
  name: string;
  nickName: string;
  email: string;
  password: string;
}

export interface UserState {
  errors?: {
    [key in keyof User]?: string[];
  };
  message?: string | null;
}

export type LoginInfo = Omit<User, "name" | "nickName">;

export const userSchema = z.object({
  name: z.string().min(1, { message: "Please enter your valid name." }),
  nickName: z.string().min(1, { message: "Please enter your nickName." }),
  email: z.string().email({ message: "This email is invalid" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

export interface LoginInfoState {
  errors?: {
    [key in keyof LoginInfo]?: string[];
  };
  message?: string | null;
}

export interface PostDto {
  id: number;
  title: string;
  content: string;
  videoUrl?: string;
  nickName: string;
  createdAt: string;
  updatedAt: string;
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
