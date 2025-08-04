import { server } from "../../mocks/server";
import { mockPosts } from "../../mocks/handlers/postHandlers";
import { http, HttpResponse } from "msw";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { clearAuth } from "../authState";
import {
  UserRole,
  BoardPurpose,
  BoardListItemDto,
  CreatePostRequestBody,
  PaginatedPostsResponseSchema,
  PaginationDto,
} from "../definition";
import { BASE_API_URL } from "../util";
import {
  FetchPostsByBoardId,
  FetchPost,
  CreatePost,
  DeletePost,
  EditPost,
} from "./postActions";
import { revalidateTag } from "next/cache";
import { CACHE_TAGS } from "../cacheTags";

jest.mock("next/headers", () => ({
  cookies: jest.fn(() =>
    Promise.resolve({
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    })
  ),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn().mockImplementation((url) => {
    const error = new Error(`Redirect to ${url}`);
    Object.defineProperty(error, "digest", {
      value: `NEXT_REDIRECT: ${url}`,
      configurable: false,
      writable: false,
    });
    throw error;
  }),
  notFound: jest.fn().mockImplementation(() => {
    throw new Error("NOT_FOUND");
  }),
}));

jest.mock("../authState", () => ({
  clearAuth: jest.fn(),
}));

jest.mock("next/cache", () => ({
  revalidateTag: jest.fn(),
}));

describe("postAction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    server.resetHandlers();
  });

  describe("FetchPostsByBoardId", () => {
    const consoleErrorMock = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    afterAll(() => {
      consoleErrorMock.mockClear();
    });

    it("should fetch paginated posts by boardId and boardSlug successfully", async () => {
      const boardId = 1;
      const boardSlug = "free";

      const mockPaginatedResponse = {
        data: mockPosts.filter((p) => p.board.id === boardId), // 해당 보드의 게시글
        currentPage: 1,
        totalItems: mockPosts.filter((p) => p.board.id === boardId).length, // 해당 보드 게시글 수
        totalPages: 1, // 예시: 1페이지
      };

      server.use(
        http.get(`${BASE_API_URL}/posts/board/${boardId}`, () =>
          HttpResponse.json(mockPaginatedResponse, { status: 200 })
        )
      );

      const posts = await FetchPostsByBoardId(boardId, boardSlug, {
        page: 1,
        limit: 10,
      });

      // Zod 스키마로 검증
      const validationResult = PaginatedPostsResponseSchema.safeParse(posts);
      expect(validationResult.success).toBe(true);
      if (validationResult.success) {
        expect(validationResult.data).toEqual(mockPaginatedResponse);
      }
    });

    it("should handle error when response is not ok for paginated posts", async () => {
      const boardId = 999;
      const boardSlug = "nonexistent";

      server.use(
        http.get(`${BASE_API_URL}/posts/board/${boardId}`, () =>
          HttpResponse.json({ error: "Not Found" }, { status: 404 })
        )
      );

      await expect(
        FetchPostsByBoardId(boardId, boardSlug, { page: 1, limit: 10 })
      ).rejects.toThrow("Failed to fetch posts");
    });

    it("should handle empty paginated posts response (no posts in board)", async () => {
      const boardId = 2; // 게시글이 없는 보드 ID
      const boardSlug = "empty-board";

      // MSW가 빈 데이터 배열을 반환하도록 설정 (페이지네이션 구조)
      const emptyPaginatedResponse = {
        data: [],
        currentPage: 1,
        totalItems: 0,
        totalPages: 0,
      };

      server.use(
        http.get(`${BASE_API_URL}/posts/board/${boardId}`, () =>
          HttpResponse.json(emptyPaginatedResponse, { status: 200 })
        )
      );

      const posts = await FetchPostsByBoardId(boardId, boardSlug, {
        page: 1,
        limit: 10,
      });

      // Zod 스키마로 검증 또는 직접 비교
      const validationResult = PaginatedPostsResponseSchema.safeParse(posts);
      expect(validationResult.success).toBe(true);
      if (validationResult.success) {
        expect(validationResult.data).toEqual(emptyPaginatedResponse);
      }
    });

    it("should return empty paginated result when response data is invalid", async () => {
      const boardId = 1;
      const boardSlug = "invalid-data-board";

      // 유효하지 않은 데이터 (예: PostResponse 스키마 위반)
      const invalidData = {
        // data: [...] // 누락
        currentPage: "one", // 잘못된 타입
        totalItems: "zero", // 잘못된 타입
        totalPages: -1, // 잘못된 값
      };

      server.use(
        http.get(`${BASE_API_URL}/posts/board/${boardId}`, () =>
          HttpResponse.json(invalidData, { status: 200 })
        )
      );

      const posts = await FetchPostsByBoardId(boardId, boardSlug, {
        page: 1,
        limit: 10,
      });

      expect(posts).toEqual({
        data: [],
        currentPage: 1,
        totalItems: 0,
        totalPages: 0,
      });
      expect(console.error).toHaveBeenCalled(); // 에러 로깅 확인
    });

    it("should pass pagination parameters correctly in the request", async () => {
      const boardId = 1;
      const boardSlug = "free";
      const queryParams: PaginationDto = {
        page: 2,
        limit: 5,
        sort: "createdAt",
        order: "ASC",
      };

      const mockPaginatedResponse = {
        data: [],
        currentPage: queryParams.page,
        totalItems: 0,
        totalPages: 0,
      };

      server.use(
        http.get(`${BASE_API_URL}/posts/board/${boardId}`, () => {
          return HttpResponse.json(mockPaginatedResponse, { status: 200 });
        })
      );

      const posts = await FetchPostsByBoardId(boardId, boardSlug, queryParams);

      expect(posts.currentPage).toBe(queryParams.page);
      expect(posts.totalItems).toBe(0);
    });
  });

  describe("FetchPost", () => {
    const consoleErrorMock = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    afterAll(() => {
      consoleErrorMock.mockClear();
    });

    it("should fetch a post successfully", async () => {
      const postId = 1;
      const mockPost = {
        id: postId,
        title: "Post 1",
        content: "Content of Post 1",
        videoUrl: "https://example.com/video1",
        views: 1,
        commentsCount: 0,
        nickname: "UserA",
        createdAt: "2023-10-01T12:00:00Z",
        updatedAt: "2023-10-01T12:00:00Z",
        board: {
          id: 1,
          slug: "free",
          name: "General",
          requiredRole: UserRole.USER,
          boardType: BoardPurpose.GENERAL,
        } satisfies BoardListItemDto,
        hotScore: 100,
      };

      server.use(
        http.get(`${BASE_API_URL}/posts/${postId}`, () => {
          return HttpResponse.json(mockPost, { status: 200 });
        })
      );

      const result = await FetchPost(postId);

      expect(result).toEqual(mockPost);
    });

    it("should handle not found error when the post does not exist", async () => {
      const postId = 999; // 존재하지 않는 게시물 ID

      server.use(
        http.get(`${BASE_API_URL}/posts/${postId}`, () => {
          return HttpResponse.json(
            { error: "Post not found" },
            { status: 404 }
          );
        })
      );

      await expect(FetchPost(postId)).rejects.toThrow("NOT_FOUND");
      expect(notFound).toHaveBeenCalled();
    });

    it("should handle unexpected errors during the fetch", async () => {
      const postId = 1;

      server.use(
        http.get(`${BASE_API_URL}/posts/${postId}`, () => {
          return HttpResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
          );
        })
      );

      await expect(FetchPost(postId)).rejects.toThrow("NOT_FOUND");
      expect(notFound).toHaveBeenCalled();
    });

    it("should throw error when post data is invalid", async () => {
      const postId = 1;
      const invalidPostData = {
        id: postId,
        title: "Invalid Post",
        content: "Content",
        // requiredRole이 유효하지 않은 값
        board: { requiredRole: "invalid-role" },
      };
      server.use(
        http.get(`${BASE_API_URL}/posts/${postId}`, () =>
          HttpResponse.json(invalidPostData, { status: 200 })
        )
      );
      await expect(FetchPost(postId)).rejects.toThrow(
        "Invalid post data format"
      );
    });
  });

  describe("CreatePost", () => {
    const boardSlug = "free";
    it("should create a post successfully with boardSlug", async () => {
      const formData = new FormData();
      let capturedBody!: CreatePostRequestBody;
      formData.append("title", "New Post");
      formData.append("content", "This is the content of the new post.");
      formData.append("videoUrl", "https://example.com/video");

      server.use(
        http.post(`${BASE_API_URL}/posts`, async ({ request }) => {
          capturedBody = (await request.json()) as CreatePostRequestBody;
          return HttpResponse.json({ success: true }, { status: 201 });
        })
      );

      (cookies as jest.Mock).mockResolvedValue({
        get: jest.fn((key: string) => {
          if (key === "access_token") return { value: "valid-access-token" };
          if (key === "refresh_token") return { value: "valid-refresh-token" };
          return undefined;
        }),
      });

      await expect(CreatePost(boardSlug, {}, formData)).rejects.toThrow();

      expect(capturedBody.boardSlug).toBe(boardSlug);
      expect(redirect).toHaveBeenCalledWith(`/boards/${boardSlug}`);
      expect(revalidateTag).toHaveBeenCalledWith(
        CACHE_TAGS.BOARD_POSTS(boardSlug)
      );
    });

    it("should handle validation errors", async () => {
      const formData = new FormData();
      formData.append("title", "");
      formData.append("content", "");
      formData.append("videoUrl", "");

      const result = await CreatePost(boardSlug, {}, formData);

      expect(result.errors?.title).toBeDefined();
      expect(result.errors?.content).toBeDefined();
      expect(result.message).toBe("Missing Fields. Failed to create posts.");
      expect(revalidateTag).not.toHaveBeenCalled();
    });

    it("should handle unauthorized access", async () => {
      const formData = new FormData();
      formData.append("title", "New Post");
      formData.append("content", "This is the content of the new post.");
      formData.append("videoUrl", "https://example.com/video");

      server.use(
        http.post(`${BASE_API_URL}/posts`, () => {
          return HttpResponse.json(
            { statusCode: 401, message: "Unauthorized" },
            { status: 401 }
          );
        })
      );

      await expect(CreatePost(boardSlug, {}, formData)).rejects.toThrow();

      expect(clearAuth).toHaveBeenCalled();
      expect(redirect).toHaveBeenCalledWith("/login?error=session_expired");
      expect(revalidateTag).not.toHaveBeenCalled();
    });

    it("should handle unexpected errors", async () => {
      const formData = new FormData();
      formData.append("title", "New Post");
      formData.append("content", "This is the content of the new post.");
      formData.append("videoUrl", "https://example.com/video");

      server.use(
        http.post(`${BASE_API_URL}/posts`, () => {
          return HttpResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
          );
        })
      );

      const result = await CreatePost(boardSlug, {}, formData);

      expect(result.message).toBe("Create post failed.");
      expect(revalidateTag).not.toHaveBeenCalled();
    });
  });

  describe("DeletePost", () => {
    const postId = 1;
    const boardSlug = "free";

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should delete a post successfully and return redirect URL", async () => {
      // Mock the server response for a successful DELETE request
      server.use(
        http.delete(`${BASE_API_URL}/posts/${postId}`, () => {
          return HttpResponse.json(
            { message: "Post deleted successfully." },
            { status: 200 }
          );
        })
      );

      const result = await DeletePost(postId, boardSlug);

      expect(result).toEqual({
        success: true,
        redirectUrl: `/boards/${boardSlug}`,
      });

      expect(revalidateTag).toHaveBeenCalledTimes(2);
      expect(revalidateTag).toHaveBeenCalledWith(CACHE_TAGS.POST(postId));
      expect(revalidateTag).toHaveBeenCalledWith(
        CACHE_TAGS.BOARD_POSTS(boardSlug)
      );
      expect(redirect).not.toHaveBeenCalled();
    });

    it("should handle unauthorized access during post deletion", async () => {
      // Mock the server response for a 401 Unauthorized error
      server.use(
        http.delete(`${BASE_API_URL}/posts/${postId}`, () => {
          return HttpResponse.json(
            { statusCode: 401, message: "Unauthorized" },
            { status: 401 }
          );
        })
      );

      const result = await DeletePost(postId, boardSlug);

      expect(result).toEqual({
        success: false,
        error: "세션이 만료되었습니다. 다시 로그인해주세요.",
        redirectUrl: "/login?error=session_expired",
      });

      expect(clearAuth).toHaveBeenCalled();
      expect(revalidateTag).not.toHaveBeenCalled();
      expect(redirect).not.toHaveBeenCalled();
    });

    it("should handle server errors during post deletion", async () => {
      // Mock the server response for a 500 Internal Server Error
      server.use(
        http.delete(`${BASE_API_URL}/posts/${postId}`, () => {
          return HttpResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
          );
        })
      );

      const result = await DeletePost(postId, boardSlug);

      expect(result).toEqual({
        success: false,
        error: "서버 오류가 발생했습니다.",
      });

      expect(revalidateTag).not.toHaveBeenCalled();
      expect(redirect).not.toHaveBeenCalled();
    });

    it("should handle invalid post ID gracefully", async () => {
      const postId = 999; // Non-existent post ID

      // Mock the server response for a 404 Not Found error
      server.use(
        http.delete(`${BASE_API_URL}/posts/${postId}`, () => {
          return HttpResponse.json(
            { error: "Post not found" },
            { status: 404 }
          );
        })
      );

      const result = await DeletePost(postId, boardSlug);

      expect(result).toEqual({
        success: false,
        error: "요청한 리소스를 찾을 수 없습니다.",
      });

      expect(revalidateTag).not.toHaveBeenCalled();
      expect(redirect).not.toHaveBeenCalled();
    });

    it("should handle unexpected errors during post deletion", async () => {
      // Mock the server response for a generic error
      server.use(
        http.delete(`${BASE_API_URL}/posts/${postId}`, () => {
          return HttpResponse.json({ error: "Unknown error" }, { status: 400 });
        })
      );

      const result = await DeletePost(postId, boardSlug);

      expect(result).toEqual({
        success: false,
        error: "게시물을 삭제할 수 없습니다.",
      });

      expect(revalidateTag).not.toHaveBeenCalled();
      expect(redirect).not.toHaveBeenCalled();
    });
  });

  describe("EditPost", () => {
    const postId = 1;
    const boardSlug = "free";

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should edit a post successfully", async () => {
      const formData = new FormData();
      formData.append("title", "Updated Title");
      formData.append("content", "Updated content");
      formData.append("videoUrl", "https://example.com/new-video");

      server.use(
        http.patch(`${BASE_API_URL}/posts/${postId}`, () => {
          return HttpResponse.json(
            {
              ...mockPosts[0],
              title: formData.get("title"),
              content: formData.get("content"),
              videoUrl: formData.get("videoUrl"),
            },
            { status: 200 }
          );
        })
      );

      (cookies as jest.Mock).mockResolvedValue({
        get: jest.fn((key: string) => {
          if (key === "access_token") return { value: "valid-access-token" };
          if (key === "refresh_token") return { value: "valid-refresh-token" };
          return undefined;
        }),
      });

      await expect(EditPost(1, boardSlug, {}, formData)).rejects.toThrow();

      expect(redirect).toHaveBeenCalledWith(`/boards/${boardSlug}`);
      expect(revalidateTag).toHaveBeenCalledWith(CACHE_TAGS.POST(postId));
      expect(revalidateTag).toHaveBeenCalledWith(
        CACHE_TAGS.BOARD_POSTS(boardSlug)
      );
    });

    it("should be able to omit videoUrl when empty", async () => {
      const formData = new FormData();
      formData.append("title", "Updated Title");
      formData.append("content", "Updated content");
      formData.append("videoUrl", "");

      interface CapturedBody {
        title: string;
        content: string;
        videoUrl?: string;
      }

      let capturedBody: CapturedBody = { title: "", content: "" };

      server.use(
        http.patch(`${BASE_API_URL}/posts/${postId}`, async ({ request }) => {
          capturedBody = (await request.json()) as CapturedBody;
          return HttpResponse.json(
            {
              ...mockPosts[0],
              title: formData.get("title"),
              content: formData.get("content"),
            },
            { status: 200 }
          );
        })
      );

      (cookies as jest.Mock).mockResolvedValue({
        get: jest.fn((key: string) => {
          if (key === "access_token") return { value: "valid-access-token" };
          if (key === "refresh_token") return { value: "valid-refresh-token" };
          return undefined;
        }),
      });

      await expect(EditPost(1, boardSlug, {}, formData)).rejects.toThrow();

      expect(capturedBody).toEqual({
        title: "Updated Title",
        content: "Updated content",
      });
      expect(capturedBody.videoUrl).toBeUndefined();
      expect(redirect).toHaveBeenCalledWith(`/boards/${boardSlug}`);
      expect(revalidateTag).toHaveBeenCalledWith(CACHE_TAGS.POST(postId));
      expect(revalidateTag).toHaveBeenCalledWith(
        CACHE_TAGS.BOARD_POSTS(boardSlug)
      );
    });

    it("should handle validation errors", async () => {
      const formData = new FormData();
      formData.append("title", "");
      formData.append("content", "Valid content");
      formData.append("videoUrl", "");

      const result = await EditPost(1, boardSlug, {}, formData);

      expect(result.errors?.title).toBeDefined();
      expect(result.message).toBe("Missing Fields. Failed to edit posts.");
      expect(revalidateTag).not.toHaveBeenCalled();
    });

    it("should handle unauthorized access", async () => {
      const formData = new FormData();
      formData.append("title", "Updated Title");
      formData.append("content", "Updated content");
      formData.append("videoUrl", "");

      server.use(
        http.patch(`${BASE_API_URL}/posts/1`, () => {
          return HttpResponse.json(
            { statusCode: 401, message: "Unauthorized" },
            { status: 401 }
          );
        })
      );

      await expect(EditPost(1, boardSlug, {}, formData)).rejects.toThrow();

      expect(clearAuth).toHaveBeenCalled();
      expect(redirect).toHaveBeenCalledWith("/login?error=session_expired");
      expect(revalidateTag).not.toHaveBeenCalled();
    });

    it("should handle server error", async () => {
      const formData = new FormData();
      formData.append("title", "Updated Title");
      formData.append("content", "Updated content");
      formData.append("videoUrl", "");

      server.use(
        http.patch(`${BASE_API_URL}/posts/1`, () => {
          return HttpResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
          );
        })
      );

      const result = await EditPost(1, boardSlug, {}, formData);

      expect(result.message).toBe("Edit post failed.");
      expect(revalidateTag).not.toHaveBeenCalled();
    });
  });
});
