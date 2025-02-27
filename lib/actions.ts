"use server";

import {
  LoginInfoState,
  PostDto,
  postSchema,
  PostState,
  userSchema,
  UserState,
} from "./definition";
import { serverAddress, thisBaseUrl } from "./util";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { resetAuthState } from "./authState";

export async function signUpAction(prevState: UserState, formData: FormData) {
  const validatedFields = userSchema.safeParse({
    name: formData.get("name"),
    nickName: formData.get("nickName"),
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
    console.error(error);
    return {
      message: `Login failed`,
    };
  }

  redirect(`/login`);
}

const LoginInfoSchema = userSchema.omit({ name: true, nickName: true });

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

    const baseCookieOptions = {
      httpOnly: true,
      path: "/",
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      domain: "localhost",
    };

    cookieStore.set("access_token", access_token, {
      ...baseCookieOptions,
      maxAge: 60 * 15,
    });
    cookieStore.set("refresh_token", refresh_token, {
      ...baseCookieOptions,
      maxAge: 60 * 60 * 24 * 7,
    });

    if (!response.ok) {
      return {
        message: `Invalid credentials`,
      };
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return {
      message: `Login Failed.`,
    };
  }
  resetAuthState();
  redirect(`/dashboard`);
}

export async function LogoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("access_token");
  cookieStore.delete("refresh_token");
  resetAuthState();
  redirect(`/login`);
}

export async function FetchPosts(): Promise<PostDto[]> {
  const reqAddress = serverAddress + "/posts";
  const response = await fetch(reqAddress, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store", // 실시간 데이터를 위해 캐시 비활성화
  });

  if (!response.ok) {
    notFound();
  }

  const data = await response.json();
  return data;
}

export async function CreatePost(prevState: PostState, formData: FormData) {
  const validatedFields = postSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    videoUrl: formData.get("videoUrl"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to create posts.",
    };
  }

  const params = validatedFields.data;

  if (params.videoUrl === "") {
    delete params.videoUrl;
  }

  const reqAddress = serverAddress + "/posts";
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  try {
    const response = await fetch(reqAddress, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(params),
    });
    const result = await response.json();

    if (!response.ok || result?.error) {
      if (result?.statusCode === 401) {
        resetAuthState();
        return {
          message: "Your login has expired.",
        };
      } else if (result?.statusCode === 400) {
        return {
          message: `${result.message}`,
        };
      } else {
        throw new Error(result.error);
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return {
      message: `Create post failed.`,
    };
  }

  redirect(`/dashboard/posts`);
}
