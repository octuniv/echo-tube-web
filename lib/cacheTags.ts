export const CacheTags = {
  // 게시판 관련
  boardPosts: (slug: string | number) => `board-posts-${slug}`,

  // 게시글 관련
  post: (id: string | number) => `post-${id}`,
} as const;
