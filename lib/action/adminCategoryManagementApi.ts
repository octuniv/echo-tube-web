"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authenticatedFetch } from "../auth/authenticatedFetch";
import { AuthenticatedFetchErrorType } from "../auth/types";
import { clearAuth } from "../authState";
import {
  CategoryListResponseSchema,
  CategoryFormData,
  CategoryFormValidationSchema,
  CategoryFormState,
  CategorySummary,
  ValidateDataType,
  ValidateDataSchema,
  CategoryDetails,
  CategoryDetailsSchema,
  NAME_REGEX,
  SLUG_REGEX,
} from "../definition/adminCategoryManagementSchema";
import { serverAddress } from "../util";
import { ERROR_MESSAGES } from "../constants/errorMessage";
import { CATEGORY_ERROR_MESSAGES } from "../constants/category/errorMessage";

export async function fetchCategories(): Promise<CategorySummary[]> {
  const reqAddress = `${serverAddress}/admin/categories`;
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
      default:
        console.error(
          "카테고리 목록을 불러오던 중 예기치 못한 오류 발생:",
          error
        );
        throw new Error(CATEGORY_ERROR_MESSAGES.FAIL_FETCH_CATEGORY);
    }
  } else {
    const result = CategoryListResponseSchema.safeParse(data);
    if (!result.success) {
      console.error("Validation failed:", result.error);
      throw new Error(CATEGORY_ERROR_MESSAGES.INVALID_DATA_TYPE);
    }
    return result.data;
  }
}

export async function fetchCategoryById(id: number): Promise<CategoryDetails> {
  const reqAddress = `${serverAddress}/admin/categories/${id}`;
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
        throw new Error(ERROR_MESSAGES.NOT_FOUND);
      default:
        throw new Error(CATEGORY_ERROR_MESSAGES.FAIL_FETCH_CATEGORY);
    }
  }

  const result = CategoryDetailsSchema.safeParse(data);
  if (!result.success) {
    console.error("Validation failed:", result.error);
    throw new Error(CATEGORY_ERROR_MESSAGES.INVALID_DATA_TYPE);
  }
  return result.data;
}

export async function createCategory(
  prevState: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  const validatedFields = CategoryFormValidationSchema.safeParse({
    name: formData.get("name"),
    allowedSlugs: formData.getAll("allowedSlugs"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing or invalid fields. Failed to create category.",
    };
  }

  const categoryData: CategoryFormData = validatedFields.data;

  const reqAddress = `${serverAddress}/admin/categories`;

  const { error } = await authenticatedFetch({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(categoryData),
    url: reqAddress,
  });

  if (error) {
    const message = error.message;
    const fieldErrors: Partial<Record<keyof CategoryFormData, string[]>> = {};
    switch (error.type) {
      case AuthenticatedFetchErrorType.Unauthorized:
        await clearAuth();
        redirect("/login?error=session_expired");
      case AuthenticatedFetchErrorType.ConflictError:
        if (message.includes(CATEGORY_ERROR_MESSAGES.DUPLICATE_CATEGORY_NAME)) {
          fieldErrors.name = [CATEGORY_ERROR_MESSAGES.DUPLICATE_CATEGORY_NAME];
        }
        if (Object.keys(fieldErrors).length > 0) {
          return {
            message,
            errors: fieldErrors,
          };
        } else {
          return {
            message,
          };
        }
      case AuthenticatedFetchErrorType.BadRequest:
        if (message.includes(CATEGORY_ERROR_MESSAGES.DUPLICATE_SLUGS())) {
          const match = message.match(/:\s*(.+)/);
          if (match && match[1]) {
            const slugs = match[1]
              .split(",")
              .map((s) => s.trim())
              .filter((slug) => slug.length > 0);
            fieldErrors.allowedSlugs = [
              CATEGORY_ERROR_MESSAGES.DUPLICATE_SLUGS(slugs),
            ];
          }
        } else if (message.includes(CATEGORY_ERROR_MESSAGES.SLUGS_REQUIRED)) {
          fieldErrors.allowedSlugs = [CATEGORY_ERROR_MESSAGES.SLUGS_REQUIRED];
        } else if (message.includes(CATEGORY_ERROR_MESSAGES.INVALID_SLUGS)) {
          fieldErrors.allowedSlugs = [CATEGORY_ERROR_MESSAGES.INVALID_SLUGS];
        }
        if (Object.keys(fieldErrors).length > 0) {
          return {
            message,
            errors: fieldErrors,
          };
        } else {
          return {
            message,
          };
        }
      default:
        console.error("Unexpected error during category creation:", error);
        return {
          message: "An unexpected error occurred. Please try again.",
        };
    }
  } else {
    revalidatePath("/admin/categories");
    redirect("/admin/categories");
  }
}

export async function updateCategory(
  id: number,
  prevState: CategoryFormState,
  formData: FormData
): Promise<CategoryFormState> {
  const validatedFields = CategoryFormValidationSchema.safeParse({
    name: formData.get("name"),
    allowedSlugs: formData.getAll("allowedSlugs"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing or invalid fields. Failed to update category.",
    };
  }

  const categoryData: CategoryFormData = validatedFields.data;

  const reqAddress = `${serverAddress}/admin/categories/${id}`;

  const { error } = await authenticatedFetch({
    url: reqAddress,
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(categoryData),
  });

  if (error) {
    const message = error.message;
    const fieldErrors: Partial<Record<keyof CategoryFormData, string[]>> = {};
    switch (error.type) {
      case AuthenticatedFetchErrorType.Unauthorized:
        await clearAuth();
        redirect("/login?error=session_expired");
      case AuthenticatedFetchErrorType.ConflictError:
        if (message.includes(CATEGORY_ERROR_MESSAGES.DUPLICATE_CATEGORY_NAME)) {
          fieldErrors.name = [CATEGORY_ERROR_MESSAGES.DUPLICATE_CATEGORY_NAME];
        }
        if (Object.keys(fieldErrors).length > 0) {
          return {
            message,
            errors: fieldErrors,
          };
        } else {
          return {
            message,
          };
        }
      case AuthenticatedFetchErrorType.BadRequest:
        if (message.includes(CATEGORY_ERROR_MESSAGES.DUPLICATE_SLUGS())) {
          const match = message.match(/:\s*(.+)/);
          if (match && match[1]) {
            const slugs = match[1]
              .split(",")
              .map((s) => s.trim())
              .filter((slug) => slug.length > 0);
            fieldErrors.allowedSlugs = [
              CATEGORY_ERROR_MESSAGES.DUPLICATE_SLUGS(slugs),
            ];
          }
        } else if (message.includes(CATEGORY_ERROR_MESSAGES.SLUGS_REQUIRED)) {
          fieldErrors.allowedSlugs = [CATEGORY_ERROR_MESSAGES.SLUGS_REQUIRED];
        } else if (message.includes(CATEGORY_ERROR_MESSAGES.INVALID_SLUGS)) {
          fieldErrors.allowedSlugs = [CATEGORY_ERROR_MESSAGES.INVALID_SLUGS];
        }
        if (Object.keys(fieldErrors).length > 0) {
          return {
            message,
            errors: fieldErrors,
          };
        } else {
          return {
            message,
          };
        }
      case AuthenticatedFetchErrorType.NotFound:
        return { message: CATEGORY_ERROR_MESSAGES.CATEGORY_NOT_FOUND };
      default:
        console.error("Unexpected error during category creation:", error);
        return {
          message: "An unexpected error occurred. Please try again.",
        };
    }
  } else {
    revalidatePath("/admin/categories");
    redirect("/admin/categories");
  }
}

export async function deleteCategory(id: number) {
  const reqAddress = `${serverAddress}/admin/categories/${id}`;

  const { error } = await authenticatedFetch({
    url: reqAddress,
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (error) {
    console.error("Category deletion failed:", error.message);
    switch (error.type) {
      case AuthenticatedFetchErrorType.Unauthorized:
        await clearAuth();
        redirect("/login?error=session_expired");
      case AuthenticatedFetchErrorType.ServerError:
        throw new Error(ERROR_MESSAGES.SERVER_ERROR);
      case AuthenticatedFetchErrorType.NotFound:
        throw new Error(ERROR_MESSAGES.NOT_FOUND);
      default:
        throw new Error("카테고리를 삭제할 수 없습니다.");
    }
  } else {
    revalidatePath("/admin/categories");
  }
}

export async function validateSlug(
  slug: string,
  categoryId?: number
): Promise<ValidateDataType> {
  if (!slug.trim()) {
    return { isUsed: false, error: CATEGORY_ERROR_MESSAGES.SLUG_REQUIRED };
  }
  if (!SLUG_REGEX.test(slug)) {
    return { isUsed: false, error: CATEGORY_ERROR_MESSAGES.INVALID_SLUGS };
  }
  const params = new URLSearchParams();
  params.append("slug", slug);

  if (categoryId !== undefined) {
    params.append("categoryId", categoryId.toString());
  }

  const reqAddress = `${serverAddress}/admin/categories/validate-slug?${params.toString()}`;

  const { error, data } = await authenticatedFetch({
    url: reqAddress,
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (error) {
    switch (error.type) {
      case AuthenticatedFetchErrorType.Unauthorized:
        await clearAuth();
        redirect("/login?error=session_expired");
      case AuthenticatedFetchErrorType.ServerError:
        throw new Error(ERROR_MESSAGES.SERVER_ERROR);
      case AuthenticatedFetchErrorType.BadRequest:
        throw new Error(ERROR_MESSAGES.MISSING_VALUE);
      default:
        throw new Error(ERROR_MESSAGES.UNKNOWN_ERROR);
    }
  }

  const result = ValidateDataSchema.safeParse(data);
  if (!result.success) {
    console.error("Validation failed:", result.error);
    throw new Error(CATEGORY_ERROR_MESSAGES.INVALID_DATA_TYPE);
  }
  return result.data;
}

export async function validateName(
  name: string,
  categoryId?: number
): Promise<ValidateDataType> {
  if (!name.trim()) {
    return { isUsed: false, error: CATEGORY_ERROR_MESSAGES.NAME_REQUIRED };
  }

  if (!NAME_REGEX.test(name)) {
    return { isUsed: false, error: CATEGORY_ERROR_MESSAGES.INVALID_NAME };
  }
  const params = new URLSearchParams();
  params.append("name", name);

  if (categoryId !== undefined) {
    params.append("categoryId", categoryId.toString());
  }

  const reqAddress = `${serverAddress}/admin/categories/validate-name?${params.toString()}`;

  const { error, data } = await authenticatedFetch({
    url: reqAddress,
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (error) {
    switch (error.type) {
      case AuthenticatedFetchErrorType.Unauthorized:
        await clearAuth();
        redirect("/login?error=session_expired");
      case AuthenticatedFetchErrorType.ServerError:
        throw new Error(ERROR_MESSAGES.SERVER_ERROR);
      case AuthenticatedFetchErrorType.BadRequest:
        throw new Error(ERROR_MESSAGES.MISSING_VALUE);
      default:
        throw new Error(ERROR_MESSAGES.UNKNOWN_ERROR);
    }
  }

  const result = ValidateDataSchema.safeParse(data);
  if (!result.success) {
    console.error("Validation failed:", result.error);
    throw new Error(CATEGORY_ERROR_MESSAGES.INVALID_DATA_TYPE);
  }
  return result.data;
}
