"use server";

import {
  BoardListItemDto,
  BoardListItemDtoSchema,
  DashboardSummaryDto,
  DashboardSummaryDtoSchema,
  LoginInfoSchema,
  LoginInfoState,
  nicknameUpdateSchema,
  NicknameUpdateState,
  PaginationDto,
  PasswordUpdateSchema,
  PasswordUpdateState,
  PostResponse,
  PostResponseSchema,
  createPostInputSchema,
  CreatePostInputState,
  userSchema,
  UserState,
  AdminUserListPaginatedSchema,
  AdminUserListPaginatedResponse,
  adminUserCreateSchema,
  AdminUserCreateState,
  AdminUserCreate,
  adminUserUpdateSchema,
  AdminUserUpdateState,
  UserRole,
  AdminUserDetailResponseSchema,
  AdminUserDetailResponse,
} from "./definition";
import { baseCookieOptions, serverAddress } from "./util";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { clearAuth } from "./authState";
import { authenticatedFetch } from "./auth/authenticatedFetch";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AuthenticatedFetchErrorType } from "./auth/types";
import { ERROR_MESSAGES } from "./constants/errorMessage";
import { getTokens } from "./tokenUtils";

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
      const response = await fetch(`${serverAddress}/auth/logout`, {
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

export async function FetchPostsByBoardId(
  boardId: number
): Promise<PostResponse[]> {
  const reqAddress = `${serverAddress}/posts/board/${boardId}`;
  const response = await fetch(reqAddress, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store", // 실시간 데이터를 위해 캐시 비활성화
  });

  if (!response.ok) throw new Error("Failed to fetch posts");

  const rawData = await response.json();

  // 배열 전체 검증
  const result = z.array(PostResponseSchema).safeParse(rawData);
  if (!result.success) {
    console.error("Validation failed:", result.error);
    return [];
  }

  return result.data;
}

export async function FetchPost(id: number): Promise<PostResponse> {
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

  const rawData = await response.json();

  const result = PostResponseSchema.safeParse(rawData);

  if (!result.success) {
    throw new Error("Invalid post data format");
  }

  return result.data;
}

export async function CreatePost(
  boardSlug: string,
  prevState: CreatePostInputState,
  formData: FormData
) {
  const validatedFields = createPostInputSchema.safeParse({
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

  const params = {
    ...validatedFields.data,
    boardSlug,
  };

  if (params.videoUrl === "") {
    delete params.videoUrl;
  }

  const reqAddress = serverAddress + "/posts";

  const { error } = await authenticatedFetch({
    method: "POST",
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
      default:
        return {
          message: "Create post failed.",
        };
    }
  } else {
    redirect(`/boards/${boardSlug}`);
  }
}

export async function DeletePost(id: number, boardSlug: string) {
  const reqAddress = new URL(`/posts/${id}`, serverAddress).toString();

  const { error } = await authenticatedFetch({
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    url: reqAddress,
  });

  if (error) {
    console.error("게시물 삭제 실패:", error.message);
    switch (error.type) {
      case AuthenticatedFetchErrorType.Unauthorized:
        await clearAuth();
        redirect("/login?error=session_expired");
      case AuthenticatedFetchErrorType.ServerError:
        throw new Error("서버 오류가 발생했습니다.");
      case AuthenticatedFetchErrorType.NotFound:
        throw new Error("요청한 리소스를 찾을 수 없습니다.");
      default:
        throw new Error("게시물을 삭제할 수 없습니다.");
    }
  } else {
    revalidatePath(`/boards/${boardSlug}`);
    redirect(`/boards/${boardSlug}`);
  }
}

export async function EditPost(
  id: number,
  boardSlug: string,
  prevState: CreatePostInputState,
  formData: FormData
) {
  const validatedFields = createPostInputSchema.safeParse({
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
      default:
        return {
          message: "Edit post failed.",
        };
    }
  } else {
    redirect(`/boards/${boardSlug}`);
  }
}

export async function DeleteUser(): Promise<void> {
  const reqAddress = new URL("/users", serverAddress).toString();

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
  const validatedFields = nicknameUpdateSchema.safeParse({
    nickname: formData.get("nickname"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to update nickname.",
    };
  }

  const params = validatedFields.data;
  const reqAddress = `${serverAddress}/users/nickname`;
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
  const reqAddress = `${serverAddress}/users/password`;

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

export async function checkEmailExists(value: string) {
  const reqAddress = `${serverAddress}/users/check-email`;

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
  const reqAddress = `${serverAddress}/users/check-nickname`;

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

export async function FetchAllBoards(): Promise<BoardListItemDto[]> {
  const response = await fetch(`${serverAddress}/boards`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    next: { revalidate: 3600 },
  });

  if (!response.ok) throw new Error("Failed to fetch boards");
  const rawData = await response.json();

  // 배열 전체 검증
  const result = z.array(BoardListItemDtoSchema).safeParse(rawData);
  if (!result.success) {
    console.error("Validation failed:", result.error);
    return [];
  }

  return result.data;
}

export async function FetchDashboardSummary(): Promise<DashboardSummaryDto> {
  // need to control caching later......
  const response = await fetch(`${serverAddress}/dashboard/summary`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    // next: { revalidate: 300 },
  });

  if (!response.ok) throw new Error("Failed to fetch DashboardSummary");
  const rawData = await response.json();

  const result = DashboardSummaryDtoSchema.safeParse(rawData);

  if (!result.success) {
    console.error("Validation failed:", result.error);
    throw new Error("Invalid data format for DashboardSummary");
  }

  return result.data;
}

export async function FetchUserPaginatedList(
  query: PaginationDto
): Promise<AdminUserListPaginatedResponse> {
  const { page, limit } = query;
  const params = new URLSearchParams({
    page: page?.toString() ?? "1",
    limit: limit?.toString() ?? "10",
  });

  const reqAddress = `${serverAddress}/admin/users`;
  const { data, error } = await authenticatedFetch({
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    url: `${reqAddress}?${params.toString()}`,
  });

  if (error) {
    switch (error.type) {
      case AuthenticatedFetchErrorType.Unauthorized:
        await clearAuth();
        redirect("/login?error=session_expired");
      default:
        console.error(
          "사용자 목록을 불러오던 중 예기치 못한 오류 발생:",
          error
        );
        throw new Error(
          "사용자 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요."
        );
    }
  } else {
    const result = AdminUserListPaginatedSchema.safeParse(data);
    if (!result.success) {
      console.error("Validation failed:", result.error);
      throw new Error("Invalid data format for UserList");
    }
    return result.data;
  }
}

export async function AdminSignUpAction(
  prevState: AdminUserCreateState,
  formData: FormData
): Promise<AdminUserCreateState> {
  const validatedFields = adminUserCreateSchema.safeParse({
    name: formData.get("name"),
    nickname: formData.get("nickname"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing or invalid fields. Failed to create admin user.",
    };
  }

  const userData = validatedFields.data;

  const reqAddress = `${serverAddress}/admin/users`;

  const { error } = await authenticatedFetch({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
    url: reqAddress,
  });
  if (error) {
    switch (error.type) {
      case AuthenticatedFetchErrorType.Unauthorized:
        await clearAuth();
        redirect("/login?error=session_expired");
      case AuthenticatedFetchErrorType.ConflictError:
        const message = error.message;
        const fieldErrors: Partial<Record<keyof AdminUserCreate, string[]>> =
          {};
        if (message.includes("email")) {
          fieldErrors.email = [ERROR_MESSAGES.EMAIL_EXISTS];
        }
        if (message.includes("nickname")) {
          fieldErrors.nickname = [ERROR_MESSAGES.NICKNAME_EXISTS];
        }

        if (Object.keys(fieldErrors).length > 0) {
          return {
            message: ERROR_MESSAGES.INVALID_FIELD,
            errors: fieldErrors,
          };
        }
        return {
          message: "Conflict occurred. Please check your input values.",
        };
      default:
        console.error("Unexpected error during admin signup:", error);
        return {
          message: "An unexpected error occurred. Please try again.",
        };
    }
  } else {
    revalidatePath("/admin/users");
    redirect("/admin/users");
  }
}

export async function AdminUserUpdateAction(
  userId: number,
  prevState: AdminUserUpdateState,
  formData: FormData
): Promise<AdminUserUpdateState> {
  const updateData = {
    name: formData.get("name")?.toString().trim() || undefined,
    nickname: formData.get("nickname")?.toString().trim() || undefined,
    role: formData.get("role")?.toString().trim() as UserRole | undefined,
  };

  const validatedFields = adminUserUpdateSchema.safeParse(updateData);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Invalid fields. Please check your input values.",
    };
  }

  const reqAddress = `${serverAddress}/admin/users/${userId}`;

  const { error } = await authenticatedFetch({
    url: reqAddress,
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(validatedFields.data),
  });

  if (error) {
    switch (error.type) {
      case AuthenticatedFetchErrorType.Unauthorized:
        await clearAuth();
        redirect("/login?error=session_expired");
      case AuthenticatedFetchErrorType.ConflictError:
        const message = error.message;
        const fieldErrors: Partial<Record<keyof AdminUserCreate, string[]>> =
          {};
        if (message.includes("nickname")) {
          fieldErrors.nickname = [ERROR_MESSAGES.NICKNAME_EXISTS];
        }

        if (Object.keys(fieldErrors).length > 0) {
          return {
            message: ERROR_MESSAGES.INVALID_FIELD,
            errors: fieldErrors,
          };
        }
        return {
          message: "Conflict occurred. Please check your input values.",
        };
      default:
        console.error("Unexpected error during user manager editing:", error);
        return {
          message: "An unexpected error occurred. Please try again.",
        };
    }
  } else {
    revalidatePath("/admin/users");
    redirect("/admin/users");
  }
}

export async function fetchUserDetails(
  id: number
): Promise<AdminUserDetailResponse> {
  const reqAddress = `${serverAddress}/admin/users/${id}`;

  const { data, error } = await authenticatedFetch({
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    url: reqAddress,
  });

  if (error) {
    switch (error.type) {
      case AuthenticatedFetchErrorType.Unauthorized:
        await clearAuth();
        redirect("/login?error=session_expired");
      case AuthenticatedFetchErrorType.NotFound:
        throw new Error("사용자를 찾을 수 없습니다");
      default:
        throw new Error("사용자 정보를 불러오지 못했습니다");
    }
  }

  // 응답 데이터 검증
  const result = AdminUserDetailResponseSchema.safeParse(data);
  if (!result.success) {
    console.error("Validation failed:", result.error);
    throw new Error("Invalid user data format");
  }

  return result.data;
}

export async function deleteUser(userId: number) {
  const reqAddress = `${serverAddress}/admin/users/${userId}`;

  const { error } = await authenticatedFetch({
    method: "DELETE",
    url: reqAddress,
  });

  if (error) {
    console.error("User deletion failed:", error.message);
    switch (error.type) {
      case AuthenticatedFetchErrorType.Unauthorized:
        await clearAuth();
        redirect("/login?error=session_expired");
      case AuthenticatedFetchErrorType.ServerError:
        throw new Error("서버 오류가 발생했습니다.");
      case AuthenticatedFetchErrorType.NotFound:
        throw new Error("요청한 리소스를 찾을 수 없습니다.");
      default:
        throw new Error("사용자를 삭제할 수 없습니다.");
    }
  } else {
    revalidatePath("/admin/users");
  }
}
