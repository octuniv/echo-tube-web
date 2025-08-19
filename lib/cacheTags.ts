export const CACHE_TAGS = {
  // 게시판 관련
  BOARD_POSTS: (slug: string | number) => `board-posts-${slug}`,

  // 게시글 관련
  POST: (id: string | number) => `post-${id}`,

  // 일반 사용자 board 조회용
  ALL_BOARDS: "all_boards",
  CATEGORIES_WITH_BOARDS: "categories-with-boards",

  COMMENT: (id: string | number) => `comment-post-${id}`,
} as const;
