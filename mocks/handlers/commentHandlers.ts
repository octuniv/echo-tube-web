import { http, HttpResponse } from "msw";
import { BASE_API_URL } from "../../lib/util";
import {
  CommentSchema,
  CommentApiResponseSchema,
  PaginatedCommentListItemSchema,
} from "../../lib/definition/commentSchema";
import {
  COMMENT_ERRORS,
  COMMENT_MESSAGES,
} from "../../lib/constants/comment/errorMessage";

// Mock 댓글 데이터 정의
export const mockComments = [
  {
    id: 1,
    content: "첫 번째 댓글",
    likes: 2,
    createdAt: "2023-10-01T12:00:00Z",
    updatedAt: "2023-10-01T12:00:00Z",
    nickname: "UserA",
    parentId: null,
    hasReplies: true,
  },
  {
    id: 2,
    content: "첫 번째 댓글의 대댓글",
    likes: 1,
    createdAt: "2023-10-01T12:05:00Z",
    updatedAt: "2023-10-01T12:05:00Z",
    nickname: "UserB",
    parentId: 1,
    hasReplies: false,
  },
  {
    id: 3,
    content: "[삭제된 댓글]",
    likes: 0,
    createdAt: "2023-10-01T12:15:00Z",
    updatedAt: "2023-10-01T12:15:00Z",
    nickname: "알 수 없음",
    parentId: null,
    hasReplies: true,
  },
  {
    id: 4,
    content: "삭제된 댓글의 대댓글",
    likes: 0,
    createdAt: "2023-10-01T12:20:00Z",
    updatedAt: "2023-10-01T12:20:00Z",
    nickname: "UserC",
    parentId: 3,
    hasReplies: false,
  },
];

// 댓글 ID 카운터 (새 댓글 생성 시 사용)
let commentIdCounter = 5;

const userCommentLikes = new Map<string, Set<number>>();

// 페이지네이션 응답 생성 유틸리티
const createPaginatedCommentResponse = (comments: any[], page: number = 1) => {
  const limit = 10;
  const startIndex = (page - 1) * limit;
  const endIndex = Math.max(startIndex + limit, comments.length);

  if (startIndex >= comments.length) {
    return {
      data: [],
      currentPage: page,
      totalItems: comments.length,
      totalPages: Math.ceil(comments.length / limit),
    };
  }

  const data = comments.slice(startIndex, endIndex);

  return {
    data,
    currentPage: page,
    totalItems: comments.length,
    totalPages: Math.ceil(comments.length / limit),
  };
};

// 댓글 핸들러 정의
export const commentHandlers = [
  // GET /comments/post/:postId - 게시물의 댓글 목록 조회 (페이징)
  http.get(`${BASE_API_URL}/comments/post/:postId`, ({ params, request }) => {
    const postId = Number(params.postId);
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);

    const filteredComments = [...mockComments];

    const paginatedResponse = createPaginatedCommentResponse(
      filteredComments,
      page
    );

    // Zod 스키마로 응답 검증
    try {
      const validatedResponse =
        PaginatedCommentListItemSchema.parse(paginatedResponse);
      return HttpResponse.json(validatedResponse, { status: 200 });
    } catch (error) {
      return HttpResponse.json(
        { error: "Invalid response format", details: error },
        { status: 500 }
      );
    }
  }),

  // POST /comments - 댓글 생성
  http.post(`${BASE_API_URL}/comments`, async ({ request }) => {
    try {
      const body = await request.json();

      if (typeof body !== "object" || body === null) {
        return HttpResponse.json(
          {
            error: "Invalid request body",
            details: "Request body must be an object",
          },
          { status: 400 }
        );
      }

      const contentValidation = CommentSchema.safeParse(body);
      if (!contentValidation.success) {
        return HttpResponse.json(
          {
            error: "Validation failed",
            details: contentValidation.error.errors,
          },
          { status: 400 }
        );
      }

      const parentId = body.parentId !== undefined ? body.parentId : null;

      const newComment = {
        id: commentIdCounter++,
        content: contentValidation.data.content,
        likes: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        nickname: "CurrentUser",
        parentId: parentId,
        hasReplies: false,
      };

      // mockComments에 추가
      mockComments.push(newComment);

      // 응답 생성
      const response = {
        id: newComment.id,
        message: COMMENT_MESSAGES.CREATED,
      };

      // Zod 스키마로 검증
      try {
        const validatedResponse = CommentApiResponseSchema.parse(response);
        return HttpResponse.json(validatedResponse, { status: 201 });
      } catch (error) {
        return HttpResponse.json(
          { error: "Invalid response format", details: error },
          { status: 500 }
        );
      }
    } catch (error) {
      return HttpResponse.json(
        { error: "Invalid JSON format" },
        { status: 400 }
      );
    }
  }),

  // PUT /comments/:id - 댓글 수정
  http.put(`${BASE_API_URL}/comments/:id`, async ({ params, request }) => {
    const id = Number(params.id);

    try {
      const body = await request.json();

      // Zod 스키마로 요청 본문 검증
      const parsedBody = CommentSchema.safeParse(body);

      if (!parsedBody.success) {
        return HttpResponse.json(
          {
            error: "Validation failed",
            details: parsedBody.error.errors,
          },
          { status: 400 }
        );
      }

      // 댓글 찾기
      const commentIndex = mockComments.findIndex(
        (comment) => comment.id === id
      );

      if (commentIndex === -1) {
        return HttpResponse.json(
          { error: COMMENT_ERRORS.NOT_FOUND },
          { status: 404 }
        );
      }

      // 댓글 수정
      mockComments[commentIndex] = {
        ...mockComments[commentIndex],
        content: parsedBody.data.content,
        updatedAt: new Date().toISOString(),
      };

      // 응답 생성
      const response = {
        id,
        message: COMMENT_MESSAGES.UPDATED,
      };

      // Zod 스키마로 검증
      try {
        const validatedResponse = CommentApiResponseSchema.parse(response);
        return HttpResponse.json(validatedResponse, { status: 200 });
      } catch (error) {
        return HttpResponse.json(
          { error: "Invalid response format", details: error },
          { status: 500 }
        );
      }
    } catch (error) {
      return HttpResponse.json(
        { error: "Invalid JSON format" },
        { status: 400 }
      );
    }
  }),

  // DELETE /comments/:id - 댓글 삭제
  http.delete(`${BASE_API_URL}/comments/:id`, ({ params }) => {
    const id = Number(params.id);

    // 댓글 찾기
    const commentIndex = mockComments.findIndex((comment) => comment.id === id);

    if (commentIndex === -1) {
      return HttpResponse.json(
        { error: COMMENT_ERRORS.NOT_FOUND },
        { status: 404 }
      );
    }

    // 댓글 삭제 (실제로는 삭제된 상태로 표시)
    const deletedComment = mockComments[commentIndex];
    mockComments.splice(commentIndex, 1);

    // 삭제된 댓글을 [삭제된 댓글]로 표시하는 실제 구현 방식을 모사
    const deletedMock = {
      ...deletedComment,
      content: "[삭제된 댓글]",
      nickname: "알 수 없음",
    };
    mockComments.push(deletedMock);

    // 응답 생성
    const response = {
      id,
      message: COMMENT_MESSAGES.DELETED,
    };

    // Zod 스키마로 검증
    try {
      const validatedResponse = CommentApiResponseSchema.parse(response);
      return HttpResponse.json(validatedResponse, { status: 200 });
    } catch (error) {
      return HttpResponse.json(
        { error: "Invalid response format", details: error },
        { status: 500 }
      );
    }
  }),

  // POST /comments/like/:id - 댓글 좋아요
  http.post(
    `${BASE_API_URL}/comments/like/:id`,
    async ({ params, cookies }) => {
      const id = Number(params.id);

      const comment = mockComments.find((comment) => comment.id === id);
      if (!comment) {
        return HttpResponse.json(
          { error: COMMENT_ERRORS.NOT_FOUND },
          { status: 404 }
        );
      }

      // 사용자 식별 (쿠키 또는 다른 방법으로 사용자 정보 추출)
      // 실제 애플리케이션에서는 JWT 토큰에서 사용자 ID를 추출하겠지만,
      // 테스트를 위해 간단한 방식으로 구현
      const userId = cookies["auth_token"] ? "test_user_123" : "guest_user";

      if (!userCommentLikes.has(userId)) {
        userCommentLikes.set(userId, new Set<number>());
      }

      const userLikes = userCommentLikes.get(userId)!;

      let newLikes;
      if (userLikes.has(id)) {
        // 좋아요 무시
        return HttpResponse.json(
          { likes: comment.likes, isAdded: false },
          { status: 200 }
        );
      } else {
        // 좋아요 추가
        userLikes.add(id);
        newLikes = comment.likes + 1;
      }

      const commentIndex = mockComments.findIndex((c) => c.id === id);
      if (commentIndex !== -1) {
        mockComments[commentIndex] = {
          ...mockComments[commentIndex],
          likes: newLikes,
        };
      }

      return HttpResponse.json(
        { likes: newLikes, isAdded: true },
        { status: 200 }
      );
    }
  ),
];
