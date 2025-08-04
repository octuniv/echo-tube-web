"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authenticatedFetch } from "../auth/authenticatedFetch";
import { AuthenticatedFetchErrorType } from "../auth/types";
import { ERROR_MESSAGES } from "../constants/errorMessage";
import { UserRole } from "../definition";
import {
  AdminUserListPaginatedResponse,
  AdminUserListPaginatedSchema,
  SearchUserDtoSchema,
  AdminUserCreateState,
  AdminUserCreateSchema,
  AdminUserCreate,
  AdminUserUpdateState,
  AdminUserUpdateSchema,
  AdminUserDetailResponse,
  AdminUserDetailResponseSchema,
} from "../definition/adminUserManagementSchema";
import { PaginationDto } from "../definition";
import { BASE_API_URL } from "../util";
import { handleAuthRedirects } from "../auth/errors/authRedirectHandler";
import { authErrorGuard } from "../auth/errors/authErrorGuard";

export async function FetchUserPaginatedList(
  query: PaginationDto
): Promise<AdminUserListPaginatedResponse> {
  const { page = 1, limit = 10, sort = "createdAt", order = "DESC" } = query;
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sort,
    order,
  });

  const reqAddress = `${BASE_API_URL}/admin/users`;
  const { data, error } = await authenticatedFetch({
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    url: `${reqAddress}?${params.toString()}`,
  });

  if (error) {
    authErrorGuard(error);
    console.error("사용자 목록을 불러오던 중 예기치 못한 오류 발생:", error);
    throw new Error(
      "사용자 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요."
    );
  } else {
    const result = AdminUserListPaginatedSchema.safeParse(data);
    if (!result.success) {
      console.error("Validation failed:", result.error);
      throw new Error("Invalid data format for UserList");
    }
    return result.data;
  }
}

export async function FetchUserSearchResults(query: {
  searchEmail?: string;
  searchNickname?: string;
  searchRole?: UserRole;
  page?: number;
  limit?: number;
  sort?: "createdAt" | "updatedAt";
  order?: "ASC" | "DESC";
}): Promise<AdminUserListPaginatedResponse> {
  // Validate input using the schema
  const validatedQuery = SearchUserDtoSchema.safeParse(query);

  if (!validatedQuery.success) {
    console.error("Invalid search parameters:", validatedQuery.error);
    throw new Error("Invalid search parameters");
  }

  const {
    page = 1,
    limit = 10,
    sort = "createdAt",
    order = "DESC",
    searchEmail,
    searchNickname,
    searchRole,
  } = validatedQuery.data;

  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sort,
    order,
  });

  if (searchEmail) params.set("searchEmail", searchEmail);
  if (searchNickname) params.set("searchNickname", searchNickname);
  if (searchRole) params.set("searchRole", searchRole);

  const reqAddress = `${BASE_API_URL}/admin/users/search`;
  const { data, error } = await authenticatedFetch({
    method: "GET",
    headers: { "Content-Type": "application/json" },
    url: `${reqAddress}?${params.toString()}`,
  });

  if (error) {
    authErrorGuard(error);
    console.error("사용자 목록을 불러오던 중 예기치 못한 오류 발생:", error);
    throw new Error(
      "사용자 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요."
    );
  } else {
    const result = AdminUserListPaginatedSchema.safeParse(data);
    if (!result.success) {
      console.error("Validation failed:", result.error);
      throw new Error("Invalid data format for search results");
    }
    return result.data;
  }
}

export async function AdminSignUpAction(
  prevState: AdminUserCreateState,
  formData: FormData
): Promise<AdminUserCreateState> {
  const validatedFields = AdminUserCreateSchema.safeParse({
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

  const reqAddress = `${BASE_API_URL}/admin/users`;

  const { error } = await authenticatedFetch({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
    url: reqAddress,
  });
  if (error) {
    await handleAuthRedirects(error);
    switch (error.type) {
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

  const validatedFields = AdminUserUpdateSchema.safeParse(updateData);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Invalid fields. Please check your input values.",
    };
  }

  const reqAddress = `${BASE_API_URL}/admin/users/${userId}`;

  const { error } = await authenticatedFetch({
    url: reqAddress,
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(validatedFields.data),
  });

  if (error) {
    await handleAuthRedirects(error);
    switch (error.type) {
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
): Promise<AdminUserDetailResponse | null> {
  const reqAddress = `${BASE_API_URL}/admin/users/${id}`;

  const { data, error } = await authenticatedFetch({
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    url: reqAddress,
  });

  if (error) {
    authErrorGuard(error);
    switch (error.type) {
      case AuthenticatedFetchErrorType.NotFound:
        return null;
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
  const reqAddress = `${BASE_API_URL}/admin/users/${userId}`;

  const { error } = await authenticatedFetch({
    method: "DELETE",
    url: reqAddress,
  });

  if (error) {
    console.error("User deletion failed:", error.message);
    await handleAuthRedirects(error);
    switch (error.type) {
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
