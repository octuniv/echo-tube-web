import { z } from "zod";
import { FormState, genericPaginatedResponseDtoSchema } from "./commonSchemas";

export const CommentSchema = z.object({
  content: z.string().min(1, { message: "Please enter your content." }),
});

export type CommentDto = z.infer<typeof CommentSchema>;

export type CommentFormState = FormState<CommentDto>;

export const CommentListItemSchema = z.object({
  id: z.number().nonnegative(),
  content: z.string().min(1),
  likes: z.number().nonnegative(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  nickname: z.string().min(1),
  parentId: z.number().nonnegative().nullable().optional(),
  hasReplies: z.boolean(),
});

export type CommentListItemDto = z.infer<typeof CommentListItemSchema>;

export const PaginatedCommentListItemSchema = genericPaginatedResponseDtoSchema(
  CommentListItemSchema
);

export type PaginatedCommentListItemDto = z.infer<
  typeof PaginatedCommentListItemSchema
>;

export const CommentApiResponseSchema = z.object({
  id: z.number().nonnegative(),
  message: z.string().min(1),
});

export type CommentApiResponseType = z.infer<typeof CommentApiResponseSchema>;

export const LikeCommentResponseSchema = z.object({
  likes: z.number().nonnegative(),
  isAdded: z.boolean(),
});

export type LikeCommnetResponse = z.infer<typeof LikeCommentResponseSchema>;
