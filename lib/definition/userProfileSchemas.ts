import { z } from "zod";
import { FormState } from "./commonSchemas";
import { UserSchema } from "./userAuthSchemas";

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
