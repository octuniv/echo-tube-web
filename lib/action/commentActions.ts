"use server";

import { revalidateTag } from "next/cache";
import { authenticatedFetch } from "../auth/authenticatedFetch";
import { handleAuthRedirects } from "../auth/errors/authRedirectHandler";
import { AuthenticatedFetchErrorType } from "../auth/types";
import { CACHE_TAGS } from "../cacheTags";
import {
  COMMENT_ERRORS,
  COMMENT_MESSAGES,
} from "../constants/comment/errorMessage";
import {
  CommentFormState,
  CommentSchema,
  LikeCommentResponseSchema,
  PaginatedCommentListItemDto,
  PaginatedCommentListItemSchema,
} from "../definition/commentSchema";
import { BASE_API_URL } from "../util";

export async function FetchComments(
  postId: number,
  page: number
): Promise<PaginatedCommentListItemDto> {
  const queryParams = new URLSearchParams({
    page: page.toString(),
  });
  const response = await fetch(
    `${BASE_API_URL}/comments/post/${postId}?${queryParams.toString()}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      next: {
        tags: [CACHE_TAGS.COMMENT(postId)],
      },
      cache: "force-cache",
    }
  );

  if (!response.ok)
    throw new Error(
      `Failed to fetch Comments : PostId : ${postId}, page: ${page}`
    );
  const rawData = await response.json();

  const result = PaginatedCommentListItemSchema.safeParse(rawData);
  if (!result.success) {
    console.error("Validation Failed: ", result.error);
    return {
      data: [],
      currentPage: 1,
      totalItems: 0,
      totalPages: 0,
    };
  }
  return result.data;
}

export async function CreateComment(
  postId: number,
  parentId: number | undefined,
  prevState: CommentFormState,
  formData: FormData
): Promise<CommentFormState> {
  const validatedFields = CommentSchema.safeParse({
    content: formData.get("content"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Invalid fields. Please check your input values.",
    };
  }

  const body = {
    postId,
    content: validatedFields.data.content,
    ...(parentId !== undefined && { parentId }),
  };

  const { error } = await authenticatedFetch({
    url: `${BASE_API_URL}/comments`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (error) {
    await handleAuthRedirects(error);
    const message = error.message;
    switch (error.type) {
      case AuthenticatedFetchErrorType.NotFound:
        switch (message) {
          case COMMENT_ERRORS.PARENT_NOT_FOUND:
          case COMMENT_ERRORS.POST_NOT_FOUND:
            return { message };
          default:
            console.error("Unexpected error during comment creating:", error);
            return { message: "Something wrong when creating comment" };
        }
      case AuthenticatedFetchErrorType.BadRequest:
        switch (message) {
          case COMMENT_ERRORS.MAX_DEPTH_EXCEEDED:
            return { message };
          default:
            console.error("Unexpected error during comment creating:", error);
            return { message: "Something wrong when creating comment" };
        }
      default:
        console.error("Unexpected error during comment creating:", error);
        return {
          message: "An unexpected error occurred. Please try again.",
        };
    }
  } else {
    revalidateTag(CACHE_TAGS.COMMENT(postId));
    return { message: COMMENT_MESSAGES.CREATED };
  }
}

export async function EditComment(
  postId: number,
  commentId: number,
  prevState: CommentFormState,
  formData: FormData
): Promise<CommentFormState> {
  const validatedFields = CommentSchema.safeParse({
    content: formData.get("content"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Invalid fields. Please check your input values.",
    };
  }

  const { error } = await authenticatedFetch({
    url: `${BASE_API_URL}/comments/${commentId}`,
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content: validatedFields.data.content }),
  });

  if (error) {
    await handleAuthRedirects(error);
    const message = error.message;
    switch (error.type) {
      case AuthenticatedFetchErrorType.NotFound:
        switch (message) {
          case COMMENT_ERRORS.NOT_FOUND:
            return { message };
          default:
            console.error("Unexpected error during comment updating:", error);
            return { message: "Something wrong when updating comment" };
        }

      default:
        console.error("Unexpected error during comment updating:", error);
        return {
          message: "An unexpected error occurred. Please try again.",
        };
    }
  } else {
    revalidateTag(CACHE_TAGS.COMMENT(postId));
    return { message: COMMENT_MESSAGES.UPDATED };
  }
}

export async function DeleteComment(postId: number, commentId: number) {
  const { error } = await authenticatedFetch({
    url: `${BASE_API_URL}/comments/${commentId}`,
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (error) {
    await handleAuthRedirects(error);
    const message = error.message;
    switch (error.type) {
      case AuthenticatedFetchErrorType.NotFound:
        switch (message) {
          case COMMENT_ERRORS.NOT_FOUND:
            return { message };
          default:
            console.error("Unexpected error during comment updating:", error);
            return { message: "Something wrong when updating comment" };
        }

      default:
        console.error("Unexpected error during comment updating:", error);
        return {
          message: "An unexpected error occurred. Please try again.",
        };
    }
  } else {
    revalidateTag(CACHE_TAGS.COMMENT(postId));
    return { message: COMMENT_MESSAGES.DELETED };
  }
}

export async function LikeComment(postId: number, commentId: number) {
  const { data, error } = await authenticatedFetch({
    url: `${BASE_API_URL}/comments/like/${commentId}`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (error) {
    await handleAuthRedirects(error);
    const message = error.message;
    switch (error.type) {
      case AuthenticatedFetchErrorType.NotFound:
        switch (message) {
          case COMMENT_ERRORS.NOT_FOUND:
            return { message };
          default:
            console.error("Unexpected error during comment updating:", error);
            return { message: "Something wrong when click like" };
        }

      default:
        console.error("Unexpected error during comment updating:", error);
        return {
          message: "An unexpected error occurred. Please try again.",
        };
    }
  } else {
    const result = LikeCommentResponseSchema.safeParse(data);
    if (!result.success) {
      console.error("Validation failed:", result.error);
      throw new Error("LikeComment action has failed.");
    }
    const { isAdded } = result.data;
    if (isAdded) {
      revalidateTag(CACHE_TAGS.COMMENT(postId));
    }
    return result.data;
  }
}
