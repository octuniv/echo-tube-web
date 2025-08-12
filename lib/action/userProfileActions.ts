"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authenticatedFetch } from "../auth/authenticatedFetch";
import { AuthenticatedFetchErrorType } from "../auth/types";
import { clearAuth } from "../authState";
import { ERROR_MESSAGES } from "../constants/errorMessage";
import {
  NicknameUpdateState,
  NicknameUpdateSchema,
  PasswordUpdateState,
  PasswordUpdateSchema,
} from "../definition/userProfileSchemas";
import { BASE_API_URL, baseCookieOptions } from "../util";

export async function DeleteUser(): Promise<void> {
  const reqAddress = new URL("/users", BASE_API_URL).toString();

  const { error } = await authenticatedFetch({
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    url: reqAddress,
  });

  if (error) {
    console.error("계정 삭제 실패:", error.message);
    switch (error.type) {
      case AuthenticatedFetchErrorType.Unauthorized:
        await clearAuth();
        redirect("/login?error=session_expired");
      case AuthenticatedFetchErrorType.ServerError:
        throw new Error("서버 오류로 계정을 삭제할 수 없습니다.");
      default:
        throw new Error("계정 삭제에 실패했습니다.");
    }
  } else {
    await clearAuth();
    revalidatePath("/");
    redirect("/");
  }
}

export async function UpdateNicknameAction(
  prevState: NicknameUpdateState,
  formData: FormData
) {
  const validatedFields = NicknameUpdateSchema.safeParse({
    nickname: formData.get("nickname"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to update nickname.",
    };
  }

  const params = validatedFields.data;
  const reqAddress = `${BASE_API_URL}/users/nickname`;
  const { error } = await authenticatedFetch({
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
    url: reqAddress,
  });

  if (error) {
    switch (error.type) {
      case AuthenticatedFetchErrorType.Unauthorized:
        await clearAuth();
        redirect("/login?error=session_expired");
      case AuthenticatedFetchErrorType.ConflictError:
        return {
          message: error.message || "Duplicate value detected",
          errors: {
            nickname: [ERROR_MESSAGES.NICKNAME_EXISTS],
          },
        };
      default:
        return {
          message: "Nickname update failed. Please try again a little later",
        };
    }
  } else {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get("user");
    const user = userCookie ? JSON.parse(userCookie.value) : {};
    user.nickname = params.nickname;
    cookieStore.set("user", JSON.stringify(user), {
      ...baseCookieOptions,
      maxAge: 60 * 60 * 24 * 7, // 7일 유지 (LoginAction과 일치)
    });
    revalidatePath("/dashboard");
    redirect("/dashboard");
  }
}

export async function UpdatePasswordAction(
  prevState: PasswordUpdateState,
  formData: FormData
) {
  const validatedFields = PasswordUpdateSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to update password.",
    };
  }

  const params = validatedFields.data;
  const reqAddress = `${BASE_API_URL}/users/password`;

  const { error } = await authenticatedFetch({
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password: params.password }),
    url: reqAddress,
  });

  if (error) {
    switch (error.type) {
      case AuthenticatedFetchErrorType.Unauthorized:
        await clearAuth();
        redirect("/login?error=session_expired");
      default:
        return {
          message: "Password update failed. Please try again a little later",
        };
    }
  } else {
    revalidatePath("/dashboard");
    redirect("/dashboard");
  }
}
