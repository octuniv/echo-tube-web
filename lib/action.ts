"use server";

import { z } from "zod";
import { UserState } from "./definition";
import { serverAddress, thisBaseUrl } from "./util";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

const userSchema = z.object({
  name: z.string().min(1, { message: "Please enter your valid name." }),
  email: z.string().email({ message: "This email is invalid" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

export async function signUpAction(prevState: UserState, formData: FormData) {
  const validatedFields = userSchema.safeParse({
    name: formData.get("name"),
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
  const reqAddress = serverAddress + "/users";

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
      if (result.error === "Bad Request" || result?.statusCode === 400) {
        return {
          message: `${result.message}`,
        };
      } else {
        throw new Error(result.error);
      }
    }
  } catch (error) {
    return {
      message: `Something went wrong. ${error}`,
    };
  }

  redirect(`/login`);
}

const LoginInfoSchema = userSchema.omit({ name: true });

export async function LoginAction(prevState: UserState, formData: FormData) {
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
  const reqAddress = thisBaseUrl + "/api/login";
  try {
    const response = await fetch(reqAddress, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });
    // const result = await response.json();
    const { access_token, refresh_token } = await response.json();

    const cookieStore = await cookies();
    const cookieOptions = {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7, // 7일 (refresh_token 기준)
      path: "/",
      sameSite: "lax" as const,
      domain: "localhost",
      secure: false,
    };

    cookieStore.set("access_token", access_token, {
      ...cookieOptions,
      maxAge: 60 * 15,
    });

    cookieStore.set("refresh_token", refresh_token, cookieOptions);

    if (!response.ok) {
      return {
        message: `Login Failed`,
      };
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return {
      message: `Login Failed.`,
    };
  }

  redirect(`/dashboard`);
}

export async function LogoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("access_token");
  cookieStore.delete("refresh_token");
  redirect(`/login`);
}
