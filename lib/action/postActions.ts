"use server";

import { revalidateTag } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { authenticatedFetch } from "../auth/authenticatedFetch";
import { AuthenticatedFetchErrorType } from "../auth/types";
import { clearAuth } from "../authState";
import {
  PostResponse,
  PostResponseSchema,
  CreatePostInputState,
  CreatePostInputSchema,
  PaginatedPostsResponse,
  PaginatedPostsResponseSchema,
  LikePostResponseSchema,
} from "../definition/postSchema";
import { BASE_API_URL } from "../util";
import { CACHE_TAGS } from "../cacheTags";
import { PaginationDto } from "../definition/commonSchemas";
import { handleAuthRedirects } from "../auth/errors/authRedirectHandler";
import { POST_ERROR_MESSAGES } from "../constants/post/errorMessage";

export async function FetchPostsByBoardId(
  boardId: number,
  boardSlug: string,
  query: PaginationDto
): Promise<PaginatedPostsResponse> {
  const { page = 1, limit = 10, sort = "createdAt", order = "DESC" } = query;
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sort,
    order,
  });

  const reqAddress = `${BASE_API_URL}/posts/board/${boardId}`;
  const response = await fetch(`${reqAddress}?${params.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "force-cache",
    next: {
      revalidate: 60,
      tags: [CACHE_TAGS.BOARD_POSTS(boardSlug)],
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch posts for board ${boardId}: ${response.statusText}`
    );
  }

  const rawData = await response.json();

  const result = PaginatedPostsResponseSchema.safeParse(rawData);

  if (!result.success) {
    console.error(
      "Validation failed for paginated posts response:",
      result.error
    );
    return { data: [], currentPage: page, totalItems: 0, totalPages: 0 };
  }

  return result.data;
}

export async function FetchPost(postId: number): Promise<PostResponse> {
  const reqAddress = BASE_API_URL + `/posts/${postId}`;
  const response = await fetch(reqAddress, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    next: {
      revalidate: 300,
      tags: [CACHE_TAGS.POST(postId)],
    },
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
  const validatedFields = CreatePostInputSchema.safeParse({
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

  const reqAddress = BASE_API_URL + "/posts";

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
    revalidateTag(CACHE_TAGS.BOARD_POSTS(boardSlug));
    redirect(`/boards/${boardSlug}`);
  }
}

export async function DeletePost(
  postId: number,
  boardSlug: string
): Promise<{ success: boolean; redirectUrl?: string; error?: string }> {
  const reqAddress = new URL(`/posts/${postId}`, BASE_API_URL).toString();

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
        return {
          success: false,
          error: "세션이 만료되었습니다. 다시 로그인해주세요.",
          redirectUrl: "/login?error=session_expired",
        };
      case AuthenticatedFetchErrorType.ServerError:
        return { success: false, error: "서버 오류가 발생했습니다." };
      case AuthenticatedFetchErrorType.NotFound:
        return {
          success: false,
          error: "요청한 리소스를 찾을 수 없습니다.",
        };
      default:
        return {
          success: false,
          error: "게시물을 삭제할 수 없습니다.",
        };
    }
  } else {
    revalidateTag(CACHE_TAGS.POST(postId));
    revalidateTag(CACHE_TAGS.BOARD_POSTS(boardSlug));
    return {
      success: true,
      redirectUrl: `/boards/${boardSlug}`,
    };
  }
}

export async function EditPost(
  postId: number,
  boardSlug: string,
  prevState: CreatePostInputState,
  formData: FormData
) {
  const validatedFields = CreatePostInputSchema.safeParse({
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

  const reqAddress = BASE_API_URL + `/posts/${postId}`;

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
    revalidateTag(CACHE_TAGS.POST(postId));
    revalidateTag(CACHE_TAGS.BOARD_POSTS(boardSlug));
    redirect(`/boards/${boardSlug}`);
  }
}

export async function LikePost(postId: number, boardSlug: string) {
  const { data, error } = await authenticatedFetch({
    url: `${BASE_API_URL}/posts/like/${postId}`,
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
          case POST_ERROR_MESSAGES.POST_FIND_NOT_FOUND:
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
    const result = LikePostResponseSchema.safeParse(data);
    if (!result.success) {
      console.error("Validation failed:", result.error);
      throw new Error("LikePost action has failed.");
    }
    const { isAdded } = result.data;
    if (isAdded) {
      revalidateTag(CACHE_TAGS.POST(postId));
      revalidateTag(CACHE_TAGS.BOARD_POSTS(boardSlug));
    }
    return result.data;
  }
}
