import {
  BoardPurpose,
  PaginatedPostsResponse,
  PostResponse,
  UserRole,
} from "../../lib/definition";
import { BASE_API_URL } from "../../lib/util";
import { http, HttpResponse } from "msw";

export const mockPosts: PostResponse[] = [
  {
    id: 1,
    title: "Post 1",
    content: "Content of Post 1",
    videoUrl: "https://example.com/video1",
    nickname: "UserA",
    createdAt: "2023-10-01T12:00:00Z",
    updatedAt: "2023-10-01T12:00:00Z",
    board: {
      id: 1,
      slug: "free",
      name: "자유 게시판",
      requiredRole: UserRole.USER,
      boardType: BoardPurpose.GENERAL,
    },
    hotScore: 150.5,
    views: 1,
    commentsCount: 0,
  },
  {
    id: 2,
    title: "Post 2",
    content: "Content of Post 2",
    videoUrl: undefined,
    nickname: "UserB",
    createdAt: "2023-09-30T12:00:00Z",
    updatedAt: "2023-09-30T12:00:00Z",
    board: {
      id: 1,
      slug: "free",
      name: "자유 게시판",
      requiredRole: UserRole.USER,
      boardType: BoardPurpose.GENERAL,
    },
    hotScore: 150.5,
    views: 1,
    commentsCount: 0,
  },
];

const createPaginatedResponse = (
  posts: PostResponse[],
  page: number = 1,
  limit: number = 10
): PaginatedPostsResponse => {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const data = posts.slice(startIndex, endIndex);

  return {
    data,
    currentPage: page,
    totalItems: posts.length,
    totalPages: Math.ceil(posts.length / limit),
  };
};

export const mockEditPostForm = {
  title: "Changed",
  content: "Content of Changed",
  videoUrl: "https://example.com/changed",
};

export const postHandlers = [
  // Mock API for fetch posts with Board Slug
  http.get(`${BASE_API_URL}/posts/board/:boardId`, ({ params, request }) => {
    const boardId = Number(params.boardId);

    // 쿼리 파라미터 파싱 (선택적)
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);

    const filteredPosts = mockPosts.filter((post) => post.board.id === boardId);

    // 페이지네이션된 응답 생성
    const paginatedResponse = createPaginatedResponse(
      filteredPosts,
      page,
      limit
    );

    return HttpResponse.json(paginatedResponse, { status: 200 });
  }),

  // Mock API for fetch post
  http.get(`${BASE_API_URL}/posts/:id`, ({ params }) => {
    const postId = Number(params.id);

    if (postId === 1) {
      return HttpResponse.json(mockPosts[0] satisfies PostResponse, {
        status: 200,
      });
    }

    return HttpResponse.json({ error: "Post not found" }, { status: 404 });
  }),

  // Mock API for creating Post
  http.post(`${BASE_API_URL}/posts`, async ({ request }) => {
    let body: unknown; // 1. unknown 타입으로 선언

    try {
      body = await request.json();
    } catch {
      return HttpResponse.json(
        { error: "Invalid JSON format" },
        { status: 400 }
      );
    }

    // 2. null 및 기본 타입 검증
    if (body === null) {
      return HttpResponse.json(
        { error: "Request body cannot be null" },
        { status: 400 }
      );
    }

    if (typeof body !== "object") {
      return HttpResponse.json(
        { error: "Request body must be an object" },
        { status: 400 }
      );
    }

    // 3. 타입 단언으로 Record 타입 확정
    const postData = body as Record<string, any>;

    // 4. 필수 필드 검증
    if (!postData.boardSlug) {
      return HttpResponse.json(
        { error: "boardSlug is required" },
        { status: 400 }
      );
    }

    // 5. 안전한 객체 병합
    return HttpResponse.json({ ...mockPosts[0], ...postData }, { status: 201 });
  }),

  // Mock API for delete post
  http.delete(`${BASE_API_URL}/posts/:id`, () => {
    return HttpResponse.json(
      { message: "Post deleted successfully." },
      { status: 200 }
    );
  }),

  // Mock API for edit post
  http.patch(`${BASE_API_URL}/posts/:id`, () => {
    return HttpResponse.json(
      { ...mockPosts[0], ...mockEditPostForm },
      { status: 200 }
    );
  }),
];
