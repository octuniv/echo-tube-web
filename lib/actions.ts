"use server";

import {
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
import { clearAuth, getAuthState } from "./authState";
import { revalidatePath } from "next/cache";

export const ensureAuthenticated = async (): Promise<boolean> => {
  const authState = await getAuthState();

  if (!authState.isAuthenticated) {
    // 인증 실패 시 인증 정보 초기화
    await clearAuth();
    return false;
  }

  return true;
};

export const authenticatedFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response | null> => {
  const isAuthenticated = await ensureAuthenticated();

  if (!isAuthenticated) {
    return null;
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.status === 401) {
      // 401 Unauthorized: 토큰이 만료되었거나 유효하지 않음
      await clearAuth();
      return null;
    }

    return response;
  } catch (error) {
    console.error("Failed to make authenticated request:", error);
    return null;
  }
};

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
      message: "Login failed",
    };
  }

  redirect("/login");
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

    const { access_token, refresh_token, name, nickName, email } =
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
    cookieStore.set("nickName", nickName, {
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
    const response = await authenticatedFetch(reqAddress, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    if (!response) {
      authenticatedFailure = true;
    } else {
      authenticatedFailure = false;

      const result = await response.json();

      if (!response.ok || result?.error) {
        if (result?.statusCode === 400) {
          return {
            message: `${result.message}`,
          };
        } else {
          throw new Error(result.error);
        }
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return {
      message: "Create post failed.",
    };
  }

  if (authenticatedFailure) {
    redirect("/login");
  } else {
    revalidatePath("/posts");
    redirect("/posts");
  }
}

export async function DeletePost(id: number) {
  const reqAddress = serverAddress + `/posts/${id}`;

  try {
    const response = await authenticatedFetch(reqAddress, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response) {
      throw new Error("Internal Server Error");
    }

    const result = await response.json();

    if (!response.ok || result?.error) {
      throw new Error(result?.error);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    await clearAuth();
    revalidatePath("/");
    redirect("/");
  }

  revalidatePath("/posts");
  redirect("/posts");
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
    const response = await authenticatedFetch(reqAddress, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    if (!response) {
      authenticatedFailure = true;
    } else {
      authenticatedFailure = false;
      const result = await response.json();

      if (!response.ok || result?.error) {
        if (result?.statusCode === 400) {
          return {
            message: `${result.message}`,
          };
        } else {
          throw new Error(result.error);
        }
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return {
      message: "Edit post failed.",
    };
  }

  if (authenticatedFailure) {
    redirect("/login");
  } else {
    revalidatePath("/posts");
    redirect("/posts");
  }
}
