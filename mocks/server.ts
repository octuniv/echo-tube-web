// mocks/server.ts

import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { serverAddress } from "../lib/util";
import {
  AdminUserListPaginatedResponse,
  BoardPurpose,
  LoginResponse,
  PostResponse,
  UserRole,
} from "../lib/definition";

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

export const mockEditPostForm = {
  title: "Changed",
  content: "Content of Changed",
  videoUrl: "https://example.com/changed",
};

export const mockDashboardSummary = {
  visitors: 150,
  recentPosts: [mockPosts[0]],
  popularPosts: [mockPosts[1]],
  noticesPosts: [mockPosts[0]],
};

export const server = setupServer(
  // Mock API for user sign-up
  http.post(`${serverAddress}/users`, () => {
    return HttpResponse.json({ success: true }, { status: 200 });
  }),

  // Mock API for login
  http.post(`${serverAddress}/auth/login`, () => {
    return HttpResponse.json(
      {
        access_token: "valid-access-token",
        refresh_token: "valid-refresh-token",
        user: {
          name: "John Doe",
          nickname: "John",
          email: "john@example.com",
          role: UserRole.USER,
        },
      } satisfies LoginResponse,
      { status: 200 }
    );
  }),

  // Mock API for token refresh
  http.post(`${serverAddress}/auth/refresh`, () => {
    return HttpResponse.json(
      {
        access_token: "new-access-token",
        refresh_token: "new-refresh-token",
      },
      { status: 200 }
    );
  }),

  // Mock API for fetch posts with Board Slug
  http.get(`${serverAddress}/posts/board/:boardId`, ({ params }) => {
    const boardId = Number(params.boardId);
    const filteredPosts = mockPosts.filter((post) => post.board.id === boardId);
    return HttpResponse.json(filteredPosts, { status: 200 });
  }),

  // Mock API for fetch post
  http.get(`${serverAddress}/posts/:id`, ({ params }) => {
    const postId = Number(params.id);

    if (postId === 1) {
      return HttpResponse.json(mockPosts[0] satisfies PostResponse, {
        status: 200,
      });
    }

    return HttpResponse.json({ error: "Post not found" }, { status: 404 });
  }),

  // Mock API for creating Post
  http.post(`${serverAddress}/posts`, async ({ request }) => {
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
  http.delete(`${serverAddress}/posts/:id`, () => {
    return HttpResponse.json(
      { message: "Post deleted successfully." },
      { status: 200 }
    );
  }),

  // Mock API for edit post
  http.patch(`${serverAddress}/posts/:id`, () => {
    return HttpResponse.json(
      { ...mockPosts[0], ...mockEditPostForm },
      { status: 200 }
    );
  }),

  // Mock API for delete user
  http.delete(`${serverAddress}/users`, () => {
    return HttpResponse.json(
      { message: "Successfully deleted account" },
      { status: 200 }
    );
  }),

  // Mock API for update nickname
  http.patch(`${serverAddress}/users/nickname`, () => {
    return HttpResponse.json(
      { message: "Nickname change successful." },
      { status: 200 }
    );
  }),

  // Mock API for testing authenticatedFetch
  http.get(`${serverAddress}/test-endpoint`, () => {
    return HttpResponse.json({ data: "success" }, { status: 200 });
  }),

  // Mock API for testing checkEmailExists
  http.post(`${serverAddress}/users/check-email`, () => {
    return HttpResponse.json({ exists: true }, { status: 200 });
  }),

  // Mock API for testing checkNicknameExists
  http.post(`${serverAddress}/users/check-nickname`, () => {
    return HttpResponse.json({ exists: true }, { status: 200 });
  }),

  // Mock API for testing passowrd
  http.patch(`${serverAddress}/users/check-nickname`, () => {
    return HttpResponse.json(
      { message: "Passcode change successful." },
      { status: 200 }
    );
  }),

  http.get(`${serverAddress}/boards`, () => {
    return HttpResponse.json([{ id: 1, slug: "free", name: "자유 게시판" }], {
      status: 200,
    });
  }),

  http.get(`${serverAddress}/dashboard/summary`, () => {
    return HttpResponse.json(mockDashboardSummary, { status: 200 });
  }),

  http.get(`${serverAddress}/admin/users`, () => {
    return HttpResponse.json(
      {
        data: [
          {
            id: 1,
            name: "John Doe",
            nickname: "johndoe123",
            email: "john.doe@example.com",
            role: UserRole.USER,
            createdAt: "2024-01-01T00:00:00Z",
            deletedAt: null,
          },
        ],
        currentPage: 1,
        totalItems: 100,
        totalPages: 10,
      } satisfies AdminUserListPaginatedResponse,
      { status: 200 }
    );
  }),

  http.patch(
    `${serverAddress}/admin/users/:id`,
    async ({ request, params }) => {
      const url = new URL(request.url);
      const userId = Number(params.id);

      if (userId === 777) {
        // 삭제된 사용자 ID
        return HttpResponse.json(
          { message: "User not found. Please check the user ID." },
          { status: 404 }
        );
      }

      if (userId === 999) {
        return HttpResponse.json(
          { message: "This nickname already exists" },
          { status: 409 }
        );
      }

      if (userId === 888) {
        return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
      }

      const body = await request.json();
      return HttpResponse.json(
        {
          message: "User updated successfully",
          success: true,
          updatedFields: body,
        },
        { status: 200 }
      );
    }
  )
);
