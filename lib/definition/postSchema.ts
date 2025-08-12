import { z } from "zod";
import { genericPaginatedResponseDtoSchema, FormState } from "./commonSchemas";
import { BoardListItemDtoSchema } from "./boardBrowseSchemas";

export const PostResponseSchema = z.object({
  id: z.number(),
  title: z.string(),
  content: z.string(),
  views: z.number(),
  commentsCount: z.number(),
  videoUrl: z.string().nullable().optional(),
  nickname: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  board: BoardListItemDtoSchema,
  hotScore: z.number(),
  channelTitle: z.string().nullable().optional(),
  duration: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
});

export type PostResponse = z.infer<typeof PostResponseSchema>;

export const PaginatedPostsResponseSchema =
  genericPaginatedResponseDtoSchema(PostResponseSchema);

export type PaginatedPostsResponse = z.infer<
  typeof PaginatedPostsResponseSchema
>;

export const CreatePostInputSchema = z.object({
  title: z.string().min(1, { message: "Please enter your title." }),
  content: z.string().min(1, { message: "Please enter your content." }),
  videoUrl: z.string().optional(),
});

export type CreatePostInput = z.infer<typeof CreatePostInputSchema>;

export type CreatePostInputState = FormState<CreatePostInput>;

export interface CreatePostRequestBody {
  title: string;
  content: string;
  videoUrl: string;
  boardSlug: string;
}
