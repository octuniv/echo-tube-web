import { z } from "zod";
import { PostResponseSchema } from "./postSchema";

export const DashboardSummaryDtoSchema = z.object({
  visitors: z.number(),
  recentPosts: z.array(PostResponseSchema),
  popularPosts: z.array(PostResponseSchema),
  noticesPosts: z.array(PostResponseSchema),
});

export type DashboardSummaryDto = z.infer<typeof DashboardSummaryDtoSchema>;
