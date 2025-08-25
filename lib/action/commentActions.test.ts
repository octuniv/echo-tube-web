import { http, HttpResponse } from "msw";
import { server } from "../../mocks/server";
import { PaginatedCommentListItemSchema } from "../definition/commentSchema";
import { BASE_API_URL } from "../util";
import {
  CreateComment,
  DeleteComment,
  EditComment,
  FetchComments,
  LikeComment,
} from "./commentActions";
import { revalidateTag } from "next/cache";
import {
  COMMENT_ERRORS,
  COMMENT_MESSAGES,
} from "../constants/comment/errorMessage";
import { forbidden, redirect } from "next/navigation";
import { ERROR_MESSAGES } from "../constants/errorMessage";
import { clearAuth } from "../authState";
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
  forbidden: jest.fn().mockImplementation(() => {
    const error = new Error("Forbidden access");
    Object.defineProperty(error, "digest", {
      value: "NEXT_FORBIDDEN",
      configurable: false,
      writable: false,
    });
    throw error;
  }),
}));

jest.mock("../authState", () => ({
  clearAuth: jest.fn(),
}));

jest.mock("next/cache", () => ({
  revalidateTag: jest.fn(),
}));

describe("Comment API Test", () => {
  const consoleErrorMock = jest
    .spyOn(console, "error")
    .mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();
    server.resetHandlers();
  });

  afterEach(() => {
    consoleErrorMock.mockClear();
  });

  describe("FetchComments", () => {
    it("댓글 목록을 성공적으로 가져옵니다.", async () => {
      const postId = 1;
      const page = 1;
      const comments = await FetchComments(postId, page);
      const result = PaginatedCommentListItemSchema.safeParse(comments);
      expect(result.success).toBeTruthy();
      expect(result.data?.data.length).toBe(4);
    });

    it("500 에러 시 에러를 발생합니다", async () => {
      const postId = 1;
      const page = 1;
      // const queryParams = new URLSearchParams({
      //   page: page.toString(),
      // });

      server.use(
        http.get(`${BASE_API_URL}/comments/post/:postId`, () =>
          HttpResponse.json({ message: "Server Error" }, { status: 500 })
        )
      );

      await expect(FetchComments(postId, page)).rejects.toThrow(
        `Failed to fetch Comments : PostId : ${postId}, page: ${page}`
      );
    });

    it("미리 정의된 타입과 맞지 않는 데이터를 불렀을 경우 에러 메세지와 함께 기본 값을 가져옵니다.", async () => {
      const postId = 1;
      const page = 1;
      // const queryParams = new URLSearchParams({
      //   page: page.toString(),
      // });

      server.use(
        http.get(`${BASE_API_URL}/comments/post/:postId`, () =>
          HttpResponse.json(
            {
              data: [
                {
                  id: "invalid-id",
                  content: 123,
                  likes: "not-a-number",
                  createdAt: "invalid-date",
                  updatedAt: "invalid-date",
                  nickname: true,
                  hasReplies: "not-boolean",
                },
              ],
              currentPage: "not-a-number",
              totalItems: "not-a-number",
              totalPages: "not-a-number",
            },
            { status: 200 }
          )
        )
      );

      const comments = await FetchComments(postId, page);

      expect(consoleErrorMock).toHaveBeenCalledWith(
        "Validation Failed: ",
        expect.any(Object)
      );

      expect(comments).toEqual({
        data: [],
        currentPage: 1,
        totalItems: 0,
        totalPages: 0,
      });
    });
  });

  describe("CreateComment", () => {
    it("댓글 생성에 성공합니다.", async () => {
      const postId = 1;
      const formData = new FormData();
      formData.append("content", "테스트 댓글 내용");

      const result = await CreateComment(postId, undefined, {}, formData);

      expect(result).toEqual({ message: COMMENT_MESSAGES.CREATED });
      expect(revalidateTag).toHaveBeenCalledWith(CACHE_TAGS.COMMENT(postId));
    });

    it("parentId가 정의되지 않았을 때 그에 맞는 인자를 호출합니다.", async () => {
      const postId = 1;
      const formData = new FormData();
      formData.append("content", "테스트 댓글 내용");

      server.use(
        http.post(`${BASE_API_URL}/comments`, async ({ request }) => {
          const body = await request.json();
          // parentId가 포함되지 않았는지 확인
          expect(body).toEqual({
            postId: postId,
            content: "테스트 댓글 내용",
          });

          return HttpResponse.json(
            {
              id: 5,
              message: COMMENT_MESSAGES.CREATED,
            },
            { status: 201 }
          );
        })
      );

      await CreateComment(postId, undefined, {}, formData);
    });

    it("parentId가 정의되었을 때 그에 맞는 인자를 호출합니다.", async () => {
      const postId = 1;
      const parentId = 2;
      const formData = new FormData();
      formData.append("content", "테스트 대댓글 내용");

      server.use(
        http.post(`${BASE_API_URL}/comments`, async ({ request }) => {
          const body = await request.json();
          // parentId가 포함되었는지 확인
          expect(body).toEqual({
            postId: postId,
            content: "테스트 대댓글 내용",
            parentId: parentId,
          });

          return HttpResponse.json(
            {
              id: 6,
              message: COMMENT_MESSAGES.CREATED,
            },
            { status: 201 }
          );
        })
      );

      await CreateComment(postId, parentId, {}, formData);
    });

    it("빈 내용으로 댓글을 생성할 때 폼 에러를 발생합니다.", async () => {
      const postId = 1;
      const formData = new FormData();
      formData.append("content", "");

      const result = await CreateComment(postId, undefined, {}, formData);

      expect(result).toEqual({
        errors: {
          content: ["Please enter your content."],
        },
        message: "Invalid fields. Please check your input values.",
      });
      expect(revalidateTag).not.toHaveBeenCalled();
    });

    it("존재하지 않는 게시판에 댓글을 생성할 때 400 에러를 발생합니다.", async () => {
      const invalidPostId = 999;
      const formData = new FormData();
      formData.append("content", "테스트 댓글 내용");

      server.use(
        http.post(`${BASE_API_URL}/comments`, () => {
          return HttpResponse.json(
            { message: COMMENT_ERRORS.POST_NOT_FOUND },
            { status: 404 }
          );
        })
      );

      const result = await CreateComment(
        invalidPostId,
        undefined,
        {},
        formData
      );

      expect(result).toEqual({
        message: COMMENT_ERRORS.POST_NOT_FOUND,
      });
      expect(consoleErrorMock).not.toHaveBeenCalled();
    });

    it("존재하지 않는 부모 댓글에 대댓글을 달 경우에 400 에러를 발생합니다.", async () => {
      const postId = 1;
      const invalidParentId = 999;
      const formData = new FormData();
      formData.append("content", "테스트 대댓글 내용");

      server.use(
        http.post(`${BASE_API_URL}/comments`, () => {
          return HttpResponse.json(
            { message: COMMENT_ERRORS.PARENT_NOT_FOUND },
            { status: 404 }
          );
        })
      );

      const result = await CreateComment(postId, invalidParentId, {}, formData);

      expect(result).toEqual({
        message: COMMENT_ERRORS.PARENT_NOT_FOUND,
      });
    });

    it("대댓글의 대댓글은 금지됩니다.", async () => {
      const postId = 1;
      const parentId = 2; // 이미 대댓글인 경우
      const formData = new FormData();
      formData.append("content", "테스트 대댓글의 대댓글");

      server.use(
        http.post(`${BASE_API_URL}/comments`, () => {
          return HttpResponse.json(
            { message: COMMENT_ERRORS.MAX_DEPTH_EXCEEDED },
            { status: 400 }
          );
        })
      );

      const result = await CreateComment(postId, parentId, {}, formData);

      expect(result).toEqual({
        message: COMMENT_ERRORS.MAX_DEPTH_EXCEEDED,
      });
    });

    it("인증되지 않은 사용자는 생성할 수 없습니다.", async () => {
      const postId = 1;
      const formData = new FormData();
      formData.append("content", "테스트 댓글 내용");

      server.use(
        http.post(`${BASE_API_URL}/comments`, () =>
          HttpResponse.json(
            { message: ERROR_MESSAGES.UNAUTHORIZED },
            { status: 401 }
          )
        )
      );

      await expect(
        CreateComment(postId, undefined, {}, formData)
      ).rejects.toThrow("Redirect to /login?error=session_expired");

      expect(clearAuth).toHaveBeenCalled();
      expect(redirect).toHaveBeenCalledWith("/login?error=session_expired");
    });
    it("권한이 없는 사용자는 생성할 수 없습니다.", async () => {
      const postId = 1;
      const formData = new FormData();
      formData.append("content", "테스트 댓글 내용");

      server.use(
        http.post(`${BASE_API_URL}/comments`, () =>
          HttpResponse.json(
            { message: ERROR_MESSAGES.FORBIDDEN },
            { status: 403 }
          )
        )
      );

      // 403 에러 시 forbidden이 호출되는지 확인
      await expect(
        CreateComment(postId, undefined, {}, formData)
      ).rejects.toThrow();

      expect(forbidden).toHaveBeenCalled();
    });
  });

  describe("EditComment", () => {
    it("댓글 변경에 성공합니다.", async () => {
      const postId = 1;
      const commentId = 1;
      const formData = new FormData();
      formData.append("content", "수정된 댓글 내용");

      const result = await EditComment(postId, commentId, {}, formData);

      expect(result).toEqual({ message: COMMENT_MESSAGES.UPDATED });
      expect(revalidateTag).toHaveBeenCalledWith(CACHE_TAGS.COMMENT(postId));
    });

    it("빈 내용으로 댓글을 수정할 때 폼 에러를 발생합니다.", async () => {
      const postId = 1;
      const commentId = 1;
      const formData = new FormData();
      formData.append("content", "");

      const result = await EditComment(postId, commentId, {}, formData);

      expect(result).toEqual({
        errors: {
          content: ["Please enter your content."],
        },
        message: "Invalid fields. Please check your input values.",
      });
      expect(revalidateTag).not.toHaveBeenCalled();
    });

    it("존재하지 않는 댓글을 수정할 때 400 에러를 발생합니다.", async () => {
      const postId = 1;
      const invalidCommentId = 999;
      const formData = new FormData();
      formData.append("content", "수정된 댓글 내용");

      server.use(
        http.put(`${BASE_API_URL}/comments/${invalidCommentId}`, () => {
          return HttpResponse.json(
            { message: COMMENT_ERRORS.NOT_FOUND },
            { status: 404 }
          );
        })
      );

      const result = await EditComment(postId, invalidCommentId, {}, formData);

      expect(result).toEqual({
        message: COMMENT_ERRORS.NOT_FOUND,
      });
    });

    it("인증되지 않은 사용자는 수정할 수 없습니다.", async () => {
      const postId = 1;
      const commentId = 1;
      const formData = new FormData();
      formData.append("content", "수정된 댓글 내용");

      server.use(
        http.put(`${BASE_API_URL}/comments/${commentId}`, () => {
          return new HttpResponse(null, { status: 401 });
        })
      );

      // 401 에러 시 리다이렉트가 발생하는지 확인
      await expect(
        EditComment(postId, commentId, {}, formData)
      ).rejects.toThrow("/login?error=session_expired");

      expect(clearAuth).toHaveBeenCalled();
      expect(redirect).toHaveBeenCalledWith("/login?error=session_expired");
    });

    it("권한이 없는 사용자는 수정할 수 없습니다.", async () => {
      const postId = 1;
      const commentId = 1;
      const formData = new FormData();
      formData.append("content", "수정된 댓글 내용");

      server.use(
        http.put(`${BASE_API_URL}/comments/${commentId}`, () => {
          return new HttpResponse(null, { status: 403 });
        })
      );

      // 403 에러 시 forbidden이 호출되는지 확인
      await expect(
        EditComment(postId, commentId, {}, formData)
      ).rejects.toThrow();

      expect(forbidden).toHaveBeenCalled();
    });
  });

  describe("DeleteComment", () => {
    it("댓글 삭제에 성공합니다.", async () => {
      const postId = 1;
      const commentId = 1;

      const result = await DeleteComment(postId, commentId);

      expect(result).toEqual({ message: COMMENT_MESSAGES.DELETED });
      expect(revalidateTag).toHaveBeenCalledWith(CACHE_TAGS.COMMENT(postId));
    });

    it("존재하지 않는 댓글을 삭제할 수 없습니다.", async () => {
      const postId = 1;
      const invalidCommentId = 999;

      server.use(
        http.delete(`${BASE_API_URL}/comments/${invalidCommentId}`, () => {
          return HttpResponse.json(
            { message: COMMENT_ERRORS.NOT_FOUND },
            { status: 404 }
          );
        })
      );

      const result = await DeleteComment(postId, invalidCommentId);

      expect(result).toEqual({
        message: COMMENT_ERRORS.NOT_FOUND,
      });
    });

    it("인증되지 않은 사용자는 삭제할 수 없습니다.", async () => {
      const postId = 1;
      const commentId = 1;

      server.use(
        http.delete(`${BASE_API_URL}/comments/${commentId}`, () => {
          return new HttpResponse(null, { status: 401 });
        })
      );

      // 401 에러 시 리다이렉트가 발생하는지 확인
      await expect(DeleteComment(postId, commentId)).rejects.toThrow(
        "/login?error=session_expired"
      );

      expect(clearAuth).toHaveBeenCalled();
      expect(redirect).toHaveBeenCalledWith("/login?error=session_expired");
    });

    it("권한이 없는 사용자는 삭제할 수 없습니다.", async () => {
      const postId = 1;
      const commentId = 1;

      server.use(
        http.delete(`${BASE_API_URL}/comments/${commentId}`, () => {
          return new HttpResponse(null, { status: 403 });
        })
      );

      // 403 에러 시 forbidden이 호출되는지 확인
      await expect(DeleteComment(postId, commentId)).rejects.toThrow();

      expect(forbidden).toHaveBeenCalled();
    });

    it("서버 내부의 오류로 인하여 삭제에 실패했습니다.", async () => {
      const postId = 1;
      const commentId = 1;

      server.use(
        http.delete(`${BASE_API_URL}/comments/${commentId}`, () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      const result = await DeleteComment(postId, commentId);

      expect(result).toEqual({
        message: "An unexpected error occurred. Please try again.",
      });
      expect(consoleErrorMock).toHaveBeenCalledWith(
        "Unexpected error during comment updating:",
        expect.any(Object)
      );
    });
  });

  describe("LikeComment", () => {
    it("좋아요 토글에 성공했습니다.", async () => {
      const postId = 1;
      const commentId = 1;

      server.use(
        http.post(`${BASE_API_URL}/comments/like/${commentId}`, () => {
          return HttpResponse.json(
            { likes: 3, isAdded: true },
            { status: 200 }
          );
        })
      );

      const result = await LikeComment(postId, commentId);

      expect(result).toEqual({ likes: 3, isAdded: true });
      expect(revalidateTag).toHaveBeenCalledWith(CACHE_TAGS.COMMENT(postId));
    });

    it("이미 좋아요를 눌렀습니다.", async () => {
      const postId = 1;
      const commentId = 1;

      server.use(
        http.post(`${BASE_API_URL}/comments/like/${commentId}`, () => {
          return HttpResponse.json(
            { likes: 3, isAdded: false },
            { status: 200 }
          );
        })
      );

      const result = await LikeComment(postId, commentId);

      expect(result).toEqual({ likes: 3, isAdded: false });
      expect(revalidateTag).not.toHaveBeenCalled();
    });

    it("존재하지 않는 댓글에 좋아요 요청은 할 수 없습니다.", async () => {
      const postId = 1;
      const invalidCommentId = 999;

      server.use(
        http.post(`${BASE_API_URL}/comments/like/${invalidCommentId}`, () => {
          return HttpResponse.json(
            { message: COMMENT_ERRORS.NOT_FOUND },
            { status: 404 }
          );
        })
      );

      const result = await LikeComment(postId, invalidCommentId);

      expect(result).toEqual({
        message: COMMENT_ERRORS.NOT_FOUND,
      });
    });

    it("인증되지 않은 사용자는 좋아요 요청을 할 수 없습니다.", async () => {
      const postId = 1;
      const commentId = 1;

      server.use(
        http.post(`${BASE_API_URL}/comments/like/${commentId}`, () => {
          return new HttpResponse(null, { status: 401 });
        })
      );

      // 401 에러 시 리다이렉트가 발생하는지 확인
      await expect(LikeComment(postId, commentId)).rejects.toThrow(
        "/login?error=session_expired"
      );

      expect(clearAuth).toHaveBeenCalled();
      expect(redirect).toHaveBeenCalledWith("/login?error=session_expired");
    });

    it("권한이 없는 사용자는 좋아요 요청을 할 수 없습니다.", async () => {
      const postId = 1;
      const commentId = 1;

      server.use(
        http.post(`${BASE_API_URL}/comments/like/${commentId}`, () => {
          return new HttpResponse(null, { status: 403 });
        })
      );

      // 403 에러 시 forbidden이 호출되는지 확인
      await expect(LikeComment(postId, commentId)).rejects.toThrow();

      expect(forbidden).toHaveBeenCalled();
    });
  });
});
