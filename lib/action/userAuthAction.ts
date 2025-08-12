"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { clearAuth } from "../authState";
import { ERROR_MESSAGES } from "../constants/errorMessage";
import {
  UserState,
  UserSchema,
  LoginInfoState,
  LoginInfoSchema,
} from "../definition/userAuthSchemas";
import { getTokens } from "../tokenUtils";
import { BASE_API_URL, baseCookieOptions } from "../util";

export async function signUpAction(prevState: UserState, formData: FormData) {
  const validatedFields = UserSchema.safeParse({
    name: formData.get("name"),
    nickname: formData.get("nickname"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Sign Up.",
    };
  }

  const params = validatedFields.data;
  const reqAddress = BASE_API_URL + "/users";

  try {
    const response = await fetch(reqAddress, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });
    const result = await response.json();

    if (!response.ok || result?.error) {
      if (result.error === "Conflict" || result?.statusCode === 409) {
        if (String(result.message).startsWith("This nickname")) {
          return {
            message: ERROR_MESSAGES.INVALID_FIELD,
            errors: {
              nickname: [ERROR_MESSAGES.NICKNAME_EXISTS],
            },
          };
        } else if (String(result.message).startsWith("This email")) {
          return {
            message: ERROR_MESSAGES.INVALID_FIELD,
            errors: {
              email: [ERROR_MESSAGES.EMAIL_EXISTS],
            },
          };
        } else {
          throw new Error(result.error);
        }
      } else {
        throw new Error(result.error);
      }
    }
  } catch (error) {
    console.error(error);
    return {
      message: "Signup failed",
    };
  }

  redirect("/login");
}

export async function LoginAction(
  prevState: LoginInfoState,
  formData: FormData
) {
  const validatedFields = LoginInfoSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Sign Up.",
    };
  }

  const params = validatedFields.data;
  const reqAddress = BASE_API_URL + "/auth/login";
  try {
    const response = await fetch(reqAddress, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      return {
        message: ERROR_MESSAGES.INVALID_CREDENTIALS,
      };
    }

    const { access_token, refresh_token, user } = await response.json();

    const cookieStore = await cookies();

    cookieStore.set("access_token", access_token, {
      ...baseCookieOptions,
      maxAge: 60 * 15,
    });
    cookieStore.set("refresh_token", refresh_token, {
      ...baseCookieOptions,
      maxAge: 60 * 60 * 24 * 7,
    });

    cookieStore.set("user", JSON.stringify(user), {
      ...baseCookieOptions,
      maxAge: 60 * 60 * 24 * 7, // 7일 동안 유효
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return {
      message: "Login Failed.",
    };
  }
  revalidatePath("/");
  redirect("/dashboard");
}

export async function LogoutAction() {
  const { refreshToken: refresh_token } = await getTokens();
  try {
    if (refresh_token) {
      const response = await fetch(`${BASE_API_URL}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token }),
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) {
        console.warn("Token revocation failed");
      }
    }
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    await clearAuth();
    revalidatePath("/");
    redirect("/login");
  }
}
export async function checkEmailExists(value: string) {
  const reqAddress = `${BASE_API_URL}/users/check-email`;

  try {
    const response = await fetch(reqAddress, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: value }),
    });

    const result = await response.json();

    if (!response.ok || result?.error) {
      throw new Error(result.error);
    }
    return result;
  } catch (error) {
    throw error;
  }
}

export async function checkNicknameExists(value: string) {
  const reqAddress = `${BASE_API_URL}/users/check-nickname`;

  try {
    const response = await fetch(reqAddress, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nickname: value }),
    });

    const result = await response.json();

    if (!response.ok || result?.error) {
      throw new Error(result.error);
    }

    return result;
  } catch (error) {
    throw error;
  }
}
