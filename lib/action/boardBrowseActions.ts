"use server";

import { z } from "zod";
import {
  CategoryWithBoardsResponse,
  CategoryWithBoardsResponseSchema,
  BoardListItemDto,
  BoardListItemDtoSchema,
} from "../definition/boardBrowseSchemas";
import { BASE_API_URL } from "../util";
import { CACHE_TAGS } from "../cacheTags";

export async function FetchAllBoards(): Promise<BoardListItemDto[]> {
  const response = await fetch(`${BASE_API_URL}/boards`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    next: {
      tags: [CACHE_TAGS.ALL_BOARDS],
    },
    cache: "force-cache",
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

export async function FetchCategoriesWithBoards(): Promise<CategoryWithBoardsResponse> {
  try {
    const response = await fetch(`${BASE_API_URL}/categories/with-boards`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      next: {
        tags: [CACHE_TAGS.CATEGORIES_WITH_BOARDS],
      },
      cache: "force-cache",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.statusText}`);
    }

    const rawData = await response.json();

    const result = CategoryWithBoardsResponseSchema.safeParse(rawData);

    if (!result.success) {
      console.error("Validation failed:", result.error);
      throw new Error("Validation failed");
    }

    return result.data;
  } catch (error) {
    console.error("Fetch error:", error);
    return [];
  }
}
