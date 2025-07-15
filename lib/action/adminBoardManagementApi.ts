"use server";

import { z } from "zod";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { authenticatedFetch } from "../auth/authenticatedFetch";
import {
  AdminBoardResponse,
  AdminBoardResponseSchema,
  BoardFormData,
  BoardFormSchema,
  BoardFormState,
} from "../definition/adminBoardManagementSchema";
import { serverAddress } from "../util";
import { AuthenticatedFetchErrorType } from "../auth/types";
import { BOARD_ERROR_MESSAGES } from "../constants/board/errorMessage";
import { ERROR_MESSAGES } from "../constants/errorMessage";
import { handleAuthRedirects } from "../auth/errors/authRedirectHandler";

const boardApiHeadAddress = `${serverAddress}/admin/boards`;

export async function fetchBoards(): Promise<AdminBoardResponse[]> {
  const reqAddress = boardApiHeadAddress;
  const { data, error } = await authenticatedFetch({
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    url: reqAddress,
  });

  if (error) {
    await handleAuthRedirects(error);

    console.error("보드 목록을 불러오던 중 예기치 못한 오류 발생:", error);
    throw new Error(BOARD_ERROR_MESSAGES.FAIL_FETCH_BOARD);
  } else {
    const result = z.array(AdminBoardResponseSchema).safeParse(data);
    if (!result.success) {
      console.error("Validation failed:", result.error);
      throw new Error(ERROR_MESSAGES.INVALID_DATA_TYPE);
    }
    return result.data;
  }
}

export async function fetchBoardById(id: number): Promise<AdminBoardResponse> {
  const reqAddress = `${boardApiHeadAddress}/${id}`;
  const { data, error } = await authenticatedFetch({
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    url: reqAddress,
  });

  if (error) {
    await handleAuthRedirects(error);

    switch (error.type) {
      case AuthenticatedFetchErrorType.NotFound:
        notFound();
      case AuthenticatedFetchErrorType.BadRequest:
        if (error.message === BOARD_ERROR_MESSAGES.INVALID_ID_TYPE) {
          redirect("/admin/boards");
        }
      default:
        throw new Error(BOARD_ERROR_MESSAGES.FAIL_FETCH_BOARD);
    }
  } else {
    const result = AdminBoardResponseSchema.safeParse(data);
    if (!result.success) {
      console.error("Validation failed:", result.error);
      throw new Error(ERROR_MESSAGES.INVALID_DATA_TYPE);
    }
    return result.data;
  }
}

export async function createBoard(
  prevState: BoardFormState,
  formData: FormData
): Promise<BoardFormState> {
  const validatedFields = BoardFormSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    requiredRole: formData.get("requiredRole"),
    type: formData.get("type"),
    categoryId: Number(formData.get("categoryId")),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: BOARD_ERROR_MESSAGES.INVALID_FORM_DATA,
    };
  }

  const boardFields: BoardFormData = validatedFields.data;

  const reqAddress = boardApiHeadAddress;

  const { error } = await authenticatedFetch({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(boardFields),
    url: reqAddress,
  });

  if (error) {
    const message = error.message;
    const fieldErrors: Partial<Record<keyof BoardFormData, string[]>> = {};
    await handleAuthRedirects(error);
    switch (error.type) {
      case AuthenticatedFetchErrorType.BadRequest:
        let slug: string | null = null;

        // 1. DUPLICATE_SLUG
        const duplicateMatch = message.match(
          /^Slug "(.+?)" is already in use$/
        );
        if (duplicateMatch && duplicateMatch[1]) {
          slug = duplicateMatch[1];
          fieldErrors.slug = [BOARD_ERROR_MESSAGES.DUPLICATE_SLUG(slug)];
        }

        // 2. SLUG_NOT_ALLOWED_IN_CATEGORY
        const slugNotAllowedMatch = message.match(
          /^Slug "(.+?)" is not allowed in this category$/
        );
        if (slugNotAllowedMatch && slugNotAllowedMatch[1]) {
          slug = slugNotAllowedMatch[1];
          fieldErrors.slug = [
            BOARD_ERROR_MESSAGES.SLUG_NOT_ALLOWED_IN_CATEGORY(slug),
          ];
        }

        // 3. AI_DIGEST_REQUIRES_HIGHER_ROLE
        if (message === BOARD_ERROR_MESSAGES.NOT_ALLOWED_BOARD_TYPE) {
          fieldErrors.type = [message];
          fieldErrors.requiredRole = [message];
        }

        if (Object.keys(fieldErrors).length > 0) {
          return { message, errors: fieldErrors };
        } else {
          return { message };
        }
      default:
        console.error("Unexpected error during board creation:", error);
        return {
          message: "An unexpected error occurred. Please try again.",
        };
    }
  } else {
    revalidatePath("/admin/boards");
    redirect("/admin/boards");
  }
}

export async function updateBoard(
  id: number,
  prevState: BoardFormState,
  formData: FormData
): Promise<BoardFormState> {
  const validatedFields = BoardFormSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    requiredRole: formData.get("requiredRole"),
    type: formData.get("type"),
    categoryId: Number(formData.get("categoryId")),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: BOARD_ERROR_MESSAGES.INVALID_FORM_DATA,
    };
  }

  const boardFields: BoardFormData = validatedFields.data;

  const reqAddress = `${boardApiHeadAddress}/${id}`;

  const { error } = await authenticatedFetch({
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(boardFields),
    url: reqAddress,
  });

  if (error) {
    const message = error.message;
    const fieldErrors: Partial<Record<keyof BoardFormData, string[]>> = {};
    await handleAuthRedirects(error);
    switch (error.type) {
      case AuthenticatedFetchErrorType.NotFound:
        return { message: BOARD_ERROR_MESSAGES.NOT_FOUND_BOARD };
      case AuthenticatedFetchErrorType.BadRequest:
        let slug: string | null = null;

        // 1. DUPLICATE_SLUG
        const duplicateMatch = message.match(
          /^Slug "(.+?)" is already in use$/
        );
        if (duplicateMatch && duplicateMatch[1]) {
          slug = duplicateMatch[1];
          fieldErrors.slug = [BOARD_ERROR_MESSAGES.DUPLICATE_SLUG(slug)];
        }

        // 2. SLUG_NOT_ALLOWED_IN_CATEGORY
        const slugNotAllowedMatch = message.match(
          /^Slug "(.+?)" is not allowed in this category$/
        );
        if (slugNotAllowedMatch && slugNotAllowedMatch[1]) {
          slug = slugNotAllowedMatch[1];
          fieldErrors.slug = [
            BOARD_ERROR_MESSAGES.SLUG_NOT_ALLOWED_IN_CATEGORY(slug),
          ];
        }

        // 3. AI_DIGEST_REQUIRES_HIGHER_ROLE
        if (message === BOARD_ERROR_MESSAGES.NOT_ALLOWED_BOARD_TYPE) {
          fieldErrors.type = [message];
          fieldErrors.requiredRole = [message];
        }

        if (Object.keys(fieldErrors).length > 0) {
          return { message, errors: fieldErrors };
        } else {
          return { message };
        }
      default:
        console.error("Unexpected error during board creation:", error);
        return {
          message: "An unexpected error occurred. Please try again.",
        };
    }
  } else {
    revalidatePath("/admin/boards");
    redirect("/admin/boards");
  }
}

export async function deleteBoard(id: number) {
  const reqAddress = `${boardApiHeadAddress}/${id}`;

  const { error } = await authenticatedFetch({
    url: reqAddress,
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (error) {
    console.error("Board deletion failed: ", error.message);
    await handleAuthRedirects(error);
    switch (error.type) {
      case AuthenticatedFetchErrorType.NotFound:
        throw new Error(BOARD_ERROR_MESSAGES.NOT_FOUND_BOARD);
      default:
        throw new Error("보드를 삭제할 수 없습니다.");
    }
  } else {
    revalidatePath("/admin/boards");
  }
}
