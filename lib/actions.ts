"use server";

import {
  LoginInfoSchema,
  LoginInfoState,
  PostDto,
  postSchema,
  PostState,
  userSchema,
  UserState,
} from "./definition";
import { serverAddress } from "./util";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { clearAuth } from "./authState";
import { authenticatedFetch } from "./authService";
import { revalidatePath } from "next/cache";
import { isCustomError } from "./errors";

export async function signUpAction(prevState: UserState, formData: FormData) {
  const validatedFields = userSchema.safeParse({
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
      message: "Login failed",
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
  const reqAddress = serverAddress + "/auth/login";
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
        message: "Invalid credentials",
      };
    }

    const { access_token, refresh_token, name, nickname, email } =
      await response.json();

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

    cookieStore.set("name", name, {
      ...baseCookieOptions,
      maxAge: 60 * 60 * 24 * 7, // 7일 동안 유효
    });
    cookieStore.set("nickname", nickname, {
      ...baseCookieOptions,
      maxAge: 60 * 60 * 24 * 7, // 7일 동안 유효
    });

    cookieStore.set("email", email, {
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
  await clearAuth();
  revalidatePath("/");
  redirect("/login");
}

export async function FetchAllPosts(): Promise<PostDto[]> {
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
  return data.length ? data : [];
}

export async function FetchPost(id: number): Promise<PostDto> {
  const reqAddress = serverAddress + `/posts/${id}`;
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
  let authenticatedFailure: boolean = false;

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
  try {
    await authenticatedFetch(reqAddress, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });
  } catch (error) {
    if (isCustomError(error) && error.type === "InvalidJwtToken") {
      authenticatedFailure = true;
    } else {
      return {
        message: "Create post failed.",
      };
    }
  }
  if (authenticatedFailure) {
    await clearAuth();
    redirect("/login");
  } else {
    redirect("/posts");
  }
}

export async function DeletePost(id: number) {
  let authenticatedFailure: boolean = false;
  const reqAddress = serverAddress + `/posts/${id}`;

  try {
    await authenticatedFetch(reqAddress, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    authenticatedFailure = true;
  }

  if (authenticatedFailure) {
    await clearAuth();
    redirect("/login");
  } else {
    redirect("/posts");
  }
}

export async function EditPost(
  id: number,
  prevState: PostState,
  formData: FormData
) {
  let authenticatedFailure: boolean = false;

  const validatedFields = postSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    videoUrl: formData.get("videoUrl"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to edit posts.",
    };
  }

  const params = validatedFields.data;

  if (params.videoUrl === "") {
    delete params.videoUrl;
  }

  const reqAddress = serverAddress + `/posts/${id}`;

  try {
    await authenticatedFetch(reqAddress, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });
  } catch (error) {
    if (isCustomError(error) && error.type === "InvalidJwtToken") {
      authenticatedFailure = true;
    } else {
      return {
        message: "Edit post failed.",
      };
    }
  }

  if (authenticatedFailure) {
    await clearAuth();
    redirect("/login");
  } else {
    redirect("/posts");
  }
}

export async function DeleteUser(): Promise<void> {
  let authenticatedFailure: boolean = false;
  const reqAddress = `${serverAddress}/users`;
  try {
    await authenticatedFetch(reqAddress, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    if (isCustomError(error) && error.type === "InvalidJwtToken") {
      authenticatedFailure = true;
    } else {
      throw error;
    }
  }

  await clearAuth();
  if (authenticatedFailure) {
    redirect("/login");
  } else {
    revalidatePath("/");
    redirect("/");
  }
}
