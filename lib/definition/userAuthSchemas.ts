import { z } from "zod";
import { FormState } from "./commonSchemas";
import { UserRole } from "./enums";

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
