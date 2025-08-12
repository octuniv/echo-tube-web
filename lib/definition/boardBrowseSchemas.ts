import { z } from "zod";
import { BoardPurpose, UserRole } from "./enums";

export const BoardListItemDtoSchema = z.object({
  id: z.number(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  requiredRole: z.nativeEnum(UserRole),
  boardType: z.nativeEnum(BoardPurpose),
});

export const CategoryBoardSummarySchema = z.object({
  id: z.number(),
  slug: z.string(),
  name: z.string(),
});

export type CategoryBoardSummary = z.infer<typeof CategoryBoardSummarySchema>;

export const CategoryBoardGroupSchema = z.object({
  purpose: z.nativeEnum(BoardPurpose),
  boards: z.array(CategoryBoardSummarySchema),
});

export type CategoryBoardGroup = z.infer<typeof CategoryBoardGroupSchema>;

export type BoardListItemDto = z.infer<typeof BoardListItemDtoSchema>;

export const CategoryWithBoardsResponseSchema = z.array(
  z.object({
    name: z.string(),
    boardGroups: z.array(CategoryBoardGroupSchema),
  })
);

export type CategoryWithBoardsResponse = z.infer<
  typeof CategoryWithBoardsResponseSchema
>;
