import {
  signUpAction,
  LoginAction,
  LogoutAction,
  FetchPostsByBoardId,
  CreatePost,
  FetchPost,
  DeletePost,
  EditPost,
  DeleteUser,
  UpdateNicknameAction,
  checkEmailExists,
  checkNicknameExists,
  UpdatePasswordAction,
  FetchAllBoards,
  FetchDashboardSummary,
  FetchUserPaginatedList,
} from "./actions";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { clearAuth } from "./authState";
import { mockDashboardSummary, mockPosts, server } from "../mocks/server";
import { http, HttpResponse } from "msw";
import { serverAddress } from "./util";
import { revalidatePath } from "next/cache";
import {
  BoardListItemDto,
  BoardPurpose,
  CreatePostRequestBody,
  UserAuthInfo,
  UserRole,
} from "./definition";

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

jest.mock("./authState", () => ({
  clearAuth: jest.fn(),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

describe("Actions Module", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    server.resetHandlers();
  });

  describe("signUpAction", () => {
    it("should handle successful sign-up", async () => {
      const formData = new FormData();
      formData.append("name", "John Doe");
      formData.append("nickname", "John");
      formData.append("email", "john@example.com");
      formData.append("password", "password123");

      server.use(
        http.post(`${serverAddress}/users`, () => {
          return HttpResponse.json({ success: true }, { status: 200 });
        })
      );

      await expect(signUpAction({}, formData)).rejects.toThrow();
      expect(redirect).toHaveBeenCalledWith("/login");
    });

    it("should handle failed sign-up due to invalid fields", async () => {
      const formData = new FormData();
      formData.append("name", "");
      formData.append("nickname", "");
      formData.append("email", "invalid-email");
      formData.append("password", "short");

      const result = await signUpAction({}, formData);

      expect(result.errors?.name).toBeDefined();
      expect(result.errors?.nickname).toBeDefined();
      expect(result.errors?.email).toBeDefined();
      expect(result.errors?.password).toBeDefined();
      expect(result.message).toBe("Missing Fields. Failed to Sign Up.");
    });

    it("should handle to input duplicated nickname", async () => {
      const formData = new FormData();
      formData.append("name", "John Doe");
      formData.append("nickname", "Duplicated");
      formData.append("email", "john@example.com");
      formData.append("password", "password123");

      server.use(
        http.post(`${serverAddress}/users`, () => {
          return HttpResponse.json(
            {
              message: "This nickname Duplicated is already existed!",
              error: "Conflict",
              statusCode: 409,
            },
            { status: 409 }
          );
        })
      );

      const result = await signUpAction({}, formData);

      expect(result).toEqual({
        message: "Invalid field value.",
        errors: {
          nickname: ["This nickname currently exists."],
        },
      });
    });

    it("should handle to input duplicated email", async () => {
      const formData = new FormData();
      formData.append("name", "John Doe");
      formData.append("nickname", "John");
      formData.append("email", "duplicated@example.com");
      formData.append("password", "password123");

      server.use(
        http.post(`${serverAddress}/users`, () => {
          return HttpResponse.json(
            {
              message: "This email duplicated@example.com is already existed!",
              error: "Conflict",
              statusCode: 409,
            },
            { status: 409 }
          );
        })
      );

      const result = await signUpAction({}, formData);

      expect(result).toEqual({
        message: "Invalid field value.",
        errors: {
          email: ["This email currently exists."],
        },
      });
    });
  });

  describe("LoginAction", () => {
    it("should handle successful login", async () => {
      (cookies as jest.Mock).mockResolvedValue({
        set: jest.fn(),
      });

      const formData = new FormData();
      formData.append("email", "john@example.com");
      formData.append("password", "password123");

      server.use(
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
            },
            { status: 200 }
          );
        })
      );

      const userCookieValue = JSON.stringify({
        name: "John Doe",
        nickname: "John",
        email: "john@example.com",
        role: UserRole.USER,
      });

      await expect(LoginAction({}, formData)).rejects.toThrow();

      const cookieStore = await cookies();
      expect(cookieStore.set).toHaveBeenCalledWith(
        "access_token",
        "valid-access-token",
        expect.any(Object)
      );
      expect(cookieStore.set).toHaveBeenCalledWith(
        "refresh_token",
        "valid-refresh-token",
        expect.any(Object)
      );
      expect(cookieStore.set).toHaveBeenCalledWith(
        "user",
        userCookieValue,
        expect.any(Object)
      );
      expect(revalidatePath).toHaveBeenCalledWith("/");
      expect(redirect).toHaveBeenCalledWith("/dashboard");
    });

    it("should handle failed login due to invalid credentials", async () => {
      const formData = new FormData();
      formData.append("email", "invalid@example.com");
      formData.append("password", "wrong-password");

      server.use(
        http.post(`${serverAddress}/auth/login`, () => {
          return HttpResponse.json(
            { error: "Invalid credentials" },
            { status: 401 }
          );
        })
      );

      const result = await LoginAction({}, formData);

      expect(result.message).toBe("Invalid credentials");
      expect(redirect).not.toHaveBeenCalled();
    });
  });

  describe("LogoutAction", () => {
    it("should handle logout", async () => {
      await expect(LogoutAction()).rejects.toThrow();

      expect(clearAuth).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalledWith("/");
      expect(redirect).toHaveBeenCalledWith("/login");
    });
  });

  describe("FetchPostsByBoardId", () => {
    const consoleErrorMock = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    afterEach(() => {
      consoleErrorMock.mockClear();
    });
    it("should fetch posts by boardId successfully", async () => {
      const boardId = 1;
      server.use(
        http.get(`${serverAddress}/posts/board/${boardId}`, () =>
          HttpResponse.json(mockPosts, { status: 200 })
        )
      );
      const posts = await FetchPostsByBoardId(boardId);
      expect(posts).toEqual(mockPosts);
    });

    it("should throw error when response is not ok", async () => {
      const boardId = 999;
      server.use(
        http.get(`${serverAddress}/posts/board/${boardId}`, () =>
          HttpResponse.json({ error: "Not Found" }, { status: 404 })
        )
      );
      await expect(FetchPostsByBoardId(boardId)).rejects.toThrow(
        "Failed to fetch posts"
      );
    });

    it("should handle empty posts array", async () => {
      const boardId = 1;
      server.use(
        http.get(`${serverAddress}/posts/board/${boardId}`, () =>
          HttpResponse.json([], { status: 200 })
        )
      );

      const posts = await FetchPostsByBoardId(boardId);
      expect(posts).toEqual([]);
    });

    it("should return empty array when response data is invalid", async () => {
      const boardId = 1;
      const invalidData = [
        {
          id: 1,
          title: "Invalid Post",
          content: "Content",
          // requiredRole이 유효하지 않은 값 (enum에 없는 값)
          board: { requiredRole: "invalid-role" },
        },
      ];
      server.use(
        http.get(`${serverAddress}/posts/board/${boardId}`, () =>
          HttpResponse.json(invalidData, { status: 200 })
        )
      );
      const posts = await FetchPostsByBoardId(boardId);
      expect(posts).toEqual([]); // Zod 검증 실패 시 빈 배열 반환
      expect(console.error).toHaveBeenCalled(); // 에러 로깅 확인
    });
  });

  describe("FetchPost", () => {
    const consoleErrorMock = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    afterEach(() => {
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
        http.get(`${serverAddress}/posts/${postId}`, () => {
          return HttpResponse.json(mockPost, { status: 200 });
        })
      );

      const result = await FetchPost(postId);

      expect(result).toEqual(mockPost);
    });

    it("should handle not found error when the post does not exist", async () => {
      const postId = 999; // 존재하지 않는 게시물 ID

      server.use(
        http.get(`${serverAddress}/posts/${postId}`, () => {
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
        http.get(`${serverAddress}/posts/${postId}`, () => {
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
        http.get(`${serverAddress}/posts/${postId}`, () =>
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
        http.post(`${serverAddress}/posts`, async ({ request }) => {
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
    });

    it("should handle unauthorized access", async () => {
      const formData = new FormData();
      formData.append("title", "New Post");
      formData.append("content", "This is the content of the new post.");
      formData.append("videoUrl", "https://example.com/video");

      server.use(
        http.post(`${serverAddress}/posts`, () => {
          return HttpResponse.json(
            { statusCode: 401, message: "Unauthorized" },
            { status: 401 }
          );
        })
      );

      await expect(CreatePost(boardSlug, {}, formData)).rejects.toThrow();

      expect(clearAuth).toHaveBeenCalled();
      expect(redirect).toHaveBeenCalledWith("/login?error=session_expired");
    });

    it("should handle unexpected errors", async () => {
      const formData = new FormData();
      formData.append("title", "New Post");
      formData.append("content", "This is the content of the new post.");
      formData.append("videoUrl", "https://example.com/video");

      server.use(
        http.post(`${serverAddress}/posts`, () => {
          return HttpResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
          );
        })
      );

      const result = await CreatePost(boardSlug, {}, formData);

      expect(result.message).toBe("Create post failed.");
    });
  });

  describe("DeletePost", () => {
    const boardSlug = "free";

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should delete a post successfully and redirect to /boards/boardSlug", async () => {
      const postId = 1;

      // Mock the server response for a successful DELETE request
      server.use(
        http.delete(`${serverAddress}/posts/${postId}`, () => {
          return HttpResponse.json(
            { message: "Post deleted successfully." },
            { status: 200 }
          );
        })
      );

      await expect(DeletePost(postId, boardSlug)).rejects.toThrow();

      // Verify revalidation and redirection
      expect(redirect).toHaveBeenCalledWith(`/boards/${boardSlug}`);
    });

    it("should handle unauthorized access during post deletion", async () => {
      const postId = 1;

      // Mock the server response for a 401 Unauthorized error
      server.use(
        http.delete(`${serverAddress}/posts/${postId}`, () => {
          return HttpResponse.json(
            { statusCode: 401, message: "Unauthorized" },
            { status: 401 }
          );
        })
      );

      await expect(DeletePost(postId, boardSlug)).rejects.toThrow();
      expect(clearAuth).toHaveBeenCalled();
      expect(redirect).toHaveBeenCalledWith("/login?error=session_expired");
    });

    it("should handle unexpected errors during post deletion", async () => {
      const postId = 1;

      // Mock the server response for a 500 Internal Server Error
      server.use(
        http.delete(`${serverAddress}/posts/${postId}`, () => {
          return HttpResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
          );
        })
      );
      await expect(DeletePost(postId, boardSlug)).rejects.toThrow(
        "서버 오류가 발생했습니다."
      );
    });

    it("should handle invalid post ID gracefully", async () => {
      const postId = 999; // Non-existent post ID

      // Mock the server response for a 404 Not Found error
      server.use(
        http.delete(`${serverAddress}/posts/${postId}`, () => {
          return HttpResponse.json(
            { error: "Post not found" },
            { status: 404 }
          );
        })
      );

      await expect(DeletePost(postId, boardSlug)).rejects.toThrow(
        "요청한 리소스를 찾을 수 없습니다."
      );
    });
  });

  describe("EditPost", () => {
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
        http.patch(`${serverAddress}/posts/1`, () => {
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
        http.patch(`${serverAddress}/posts/1`, async ({ request }) => {
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
    });

    it("should handle validation errors", async () => {
      const formData = new FormData();
      formData.append("title", "");
      formData.append("content", "Valid content");
      formData.append("videoUrl", "");

      const result = await EditPost(1, boardSlug, {}, formData);

      expect(result.errors?.title).toBeDefined();
      expect(result.message).toBe("Missing Fields. Failed to edit posts.");
    });

    it("should handle unauthorized access", async () => {
      const formData = new FormData();
      formData.append("title", "Updated Title");
      formData.append("content", "Updated content");
      formData.append("videoUrl", "");

      server.use(
        http.patch(`${serverAddress}/posts/1`, () => {
          return HttpResponse.json(
            { statusCode: 401, message: "Unauthorized" },
            { status: 401 }
          );
        })
      );

      await expect(EditPost(1, boardSlug, {}, formData)).rejects.toThrow();

      expect(clearAuth).toHaveBeenCalled();
      expect(redirect).toHaveBeenCalledWith("/login?error=session_expired");
    });

    it("should handle server error", async () => {
      const formData = new FormData();
      formData.append("title", "Updated Title");
      formData.append("content", "Updated content");
      formData.append("videoUrl", "");

      server.use(
        http.patch(`${serverAddress}/posts/1`, () => {
          return HttpResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
          );
        })
      );

      const result = await EditPost(1, boardSlug, {}, formData);

      expect(result.message).toBe("Edit post failed.");
    });
  });

  describe("DeleteUser", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should delete a user successfully and redirect to /", async () => {
      // Mock the server response for a successful DELETE request
      server.use(
        http.delete(`${serverAddress}/users`, () => {
          return HttpResponse.json(
            { message: "Successfully deleted account" },
            { status: 200 }
          );
        })
      );

      await expect(DeleteUser()).rejects.toThrow();

      // Validation of functions that run when successfully progressed
      expect(clearAuth).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalledWith("/");
      expect(redirect).toHaveBeenCalledWith("/");
    });

    it("should handle unauthorized access during user deletion", async () => {
      // Mock the server response for a 401 Unauthorized error
      server.use(
        http.delete(`${serverAddress}/users`, () => {
          return HttpResponse.json(
            { statusCode: 401, message: "Unauthorized" },
            { status: 401 }
          );
        })
      );

      await expect(DeleteUser()).rejects.toThrow();

      expect(clearAuth).toHaveBeenCalled();
      expect(redirect).toHaveBeenCalledWith("/login?error=session_expired");
    });

    it("should handle unexpected errors during user deletion", async () => {
      // Mock the server response for a 500 Internal Server Error
      server.use(
        http.delete(`${serverAddress}/users`, () => {
          return HttpResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
          );
        })
      );

      await expect(DeleteUser()).rejects.toThrow(
        "서버 오류로 계정을 삭제할 수 없습니다."
      );
    });

    it("should throw generic error for 404 Not Found", async () => {
      server.use(
        http.delete(`${serverAddress}/users`, () => {
          return HttpResponse.json({ error: "Not Found" }, { status: 404 });
        })
      );

      await expect(DeleteUser()).rejects.toThrow("계정 삭제에 실패했습니다.");
    });
  });

  describe("UpdateNicknameAction", () => {
    it("should update nickname successfully", async () => {
      (cookies as jest.Mock).mockResolvedValue({
        get: jest.fn((key: string) => {
          if (key === "access_token") return { value: "valid-access-token" };
          if (key === "refresh_token") return { value: "valid-refresh-token" };
          if (key === "user")
            return {
              value: JSON.stringify({
                name: "John Doe",
                nickname: "John",
                email: "john@example.com",
                role: UserRole.USER,
              }),
            };
          return undefined;
        }),
        set: jest.fn(),
      });

      const formData = new FormData();
      formData.append("nickname", "newnickname");

      server.use(
        http.patch(`${serverAddress}/users/nickname`, () => {
          return HttpResponse.json(
            { message: "Nickname change successful." },
            { status: 200 }
          );
        })
      );

      const updatedUser = {
        name: "John Doe",
        nickname: "newnickname",
        email: "john@example.com",
        role: UserRole.USER,
      } satisfies UserAuthInfo;

      await expect(UpdateNicknameAction({}, formData)).rejects.toThrow();
      const cookieStore = await cookies();

      expect(cookieStore.set).toHaveBeenCalledWith(
        "user",
        JSON.stringify(updatedUser),
        expect.any(Object)
      );
      expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
      expect(redirect).toHaveBeenCalledWith("/dashboard");
    });

    it("should handle unauthorized request about updating nickname", async () => {
      const formData = new FormData();
      formData.append("nickname", "newnickname");

      server.use(
        http.patch(`${serverAddress}/users/nickname`, () => {
          return HttpResponse.json(
            { error: "Invalid credentials" },
            { status: 401 }
          );
        })
      );

      await expect(UpdateNicknameAction({}, formData)).rejects.toThrow();
      expect(clearAuth).toHaveBeenCalled();
      expect(redirect).toHaveBeenCalledWith("/login?error=session_expired");
    });

    it("should handle conflict error when nickname already exists", async () => {
      const duplicatedNick = "duplicated";
      const formData = new FormData();
      formData.append("nickname", duplicatedNick);

      server.use(
        http.patch(`${serverAddress}/users/nickname`, () => {
          return HttpResponse.json(
            { message: `This nickname ${duplicatedNick} is already existed!` },
            { status: 409 }
          );
        })
      );

      const res = await UpdateNicknameAction({}, formData);
      expect(res).toMatchObject({
        message: `This nickname ${duplicatedNick} is already existed!`,
        errors: {
          nickname: ["The nickname is already in use"],
        },
      });
    });

    it("should handle network errors", async () => {
      const formData = new FormData();
      formData.append("nickname", "newnickname");
      server.use(
        http.patch(`${serverAddress}/users/nickname`, () => {
          return HttpResponse.json(
            { message: `Internal Server Error` },
            { status: 500 }
          );
        })
      );

      const res = await UpdateNicknameAction({}, formData);
      expect(res).toMatchObject({
        message: "Nickname update failed. Please try again a little later",
      });
    });
  });

  describe("UpdatePasswordAction", () => {
    it("should update password successfully", async () => {
      (cookies as jest.Mock).mockResolvedValue({
        get: jest.fn((key: string) => {
          if (key === "access_token") return { value: "valid-access-token" };
          if (key === "refresh_token") return { value: "valid-refresh-token" };
          return undefined;
        }),
        set: jest.fn(),
      });

      const formData = new FormData();
      formData.append("password", "newpassword");
      formData.append("confirmPassword", "newpassword");

      server.use(
        http.patch(`${serverAddress}/users/password`, () => {
          return HttpResponse.json(
            { message: "Passcode change successful." },
            { status: 200 }
          );
        })
      );

      await expect(UpdatePasswordAction({}, formData)).rejects.toThrow();
      expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
      expect(redirect).toHaveBeenCalledWith("/dashboard");
    });

    it("should throw error if you don't follow the password standard ", async () => {
      (cookies as jest.Mock).mockResolvedValue({
        get: jest.fn((key: string) => {
          if (key === "access_token") return { value: "valid-access-token" };
          if (key === "refresh_token") return { value: "valid-refresh-token" };
          return undefined;
        }),
        set: jest.fn(),
      });

      const formData = new FormData();
      formData.append("password", "12");
      formData.append("confirmPassword", "12");

      server.use(
        http.patch(`${serverAddress}/users/password`, () => {
          return HttpResponse.json(
            { message: "Passcode change successful." },
            { status: 200 }
          );
        })
      );

      const res = await UpdatePasswordAction({}, formData);

      expect(res).toEqual({
        errors: {
          password: ["Password must be at least 6 characters"],
          confirmPassword: ["Password must be at least 6 characters"],
        },
        message: "Missing Fields. Failed to update password.",
      });
    });

    it("should throw error if the password you entered and the confirmation password do not match", async () => {
      (cookies as jest.Mock).mockResolvedValue({
        get: jest.fn((key: string) => {
          if (key === "access_token") return { value: "valid-access-token" };
          if (key === "refresh_token") return { value: "valid-refresh-token" };
          return undefined;
        }),
        set: jest.fn(),
      });

      const formData = new FormData();
      formData.append("password", "newpassword");
      formData.append("confirmPassword", "differpassword");

      server.use(
        http.patch(`${serverAddress}/users/password`, () => {
          return HttpResponse.json(
            { message: "Passcode change successful." },
            { status: 500 }
          );
        })
      );

      const res = await UpdatePasswordAction({}, formData);

      expect(res).toEqual({
        errors: {
          confirmPassword: ["The password you entered does not match"],
        },
        message: "Missing Fields. Failed to update password.",
      });
    });

    it("should handle unauthorized request about updating password", async () => {
      const formData = new FormData();
      formData.append("password", "newpassword");
      formData.append("confirmPassword", "newpassword");

      server.use(
        http.patch(`${serverAddress}/users/password`, () => {
          return HttpResponse.json(
            { error: "Invalid credentials" },
            { status: 401 }
          );
        })
      );

      await expect(UpdatePasswordAction({}, formData)).rejects.toThrow();
      expect(clearAuth).toHaveBeenCalled();
      expect(redirect).toHaveBeenCalledWith("/login?error=session_expired");
    });

    it("should handle network errors", async () => {
      const formData = new FormData();
      formData.append("password", "newpassword");
      formData.append("confirmPassword", "newpassword");
      server.use(
        http.patch(`${serverAddress}/users/password`, () => {
          return HttpResponse.json(
            { message: `Internal Server Error` },
            { status: 500 }
          );
        })
      );

      const res = await UpdatePasswordAction({}, formData);
      expect(res).toMatchObject({
        message: "Password update failed. Please try again a little later",
      });
    });
  });

  describe("CheckEmailExist", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should check userExist by email successfully", async () => {
      server.use(
        http.post(`${serverAddress}/users/check-email`, () => {
          return HttpResponse.json({ exists: true }, { status: 200 });
        })
      );

      const res = await checkEmailExists("exists@email.com");
      expect(res).toEqual({ exists: true });
    });

    it("should check non-exists user by email successfully", async () => {
      server.use(
        http.post(`${serverAddress}/users/check-email`, () => {
          return HttpResponse.json({ exists: false }, { status: 200 });
        })
      );

      const res = await checkEmailExists("non-exists@email.com");
      expect(res).toEqual({ exists: false });
    });
  });

  describe("CheckNicknameExist", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should check userExist by nickname successfully", async () => {
      server.use(
        http.post(`${serverAddress}/users/check-nickname`, () => {
          return HttpResponse.json({ exists: true }, { status: 200 });
        })
      );

      const res = await checkNicknameExists("exists");
      expect(res).toEqual({ exists: true });
    });

    it("should check non-exists user by nickname successfully", async () => {
      server.use(
        http.post(`${serverAddress}/users/check-nickname`, () => {
          return HttpResponse.json({ exists: false }, { status: 200 });
        })
      );

      const res = await checkNicknameExists("non-exists");
      expect(res).toEqual({ exists: false });
    });

    describe("FetchAllBoards", () => {
      const consoleErrorMock = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      afterEach(() => {
        consoleErrorMock.mockClear();
      });

      it("should fetch all boards successfully", async () => {
        const mockBoards: BoardListItemDto[] = [
          {
            id: 1,
            slug: "free",
            name: "General",
            requiredRole: UserRole.USER,
            boardType: BoardPurpose.GENERAL,
          },
          {
            id: 2,
            slug: "qna",
            name: "Q&A",
            requiredRole: UserRole.USER,
            boardType: BoardPurpose.GENERAL,
          },
        ];

        server.use(
          http.get(`${serverAddress}/boards`, () =>
            HttpResponse.json(mockBoards, { status: 200 })
          )
        );

        const boards = await FetchAllBoards();
        expect(boards).toEqual(mockBoards);
        expect(boards[0]).toHaveProperty("id");
        expect(boards[0]).toHaveProperty("slug");
        expect(boards[0]).toHaveProperty("name");
      });

      it("should throw error on failure", async () => {
        server.use(
          http.get(`${serverAddress}/boards`, () =>
            HttpResponse.json(
              { error: "Internal Server Error" },
              { status: 500 }
            )
          )
        );

        await expect(FetchAllBoards()).rejects.toThrow(
          "Failed to fetch boards"
        );
      });

      it("should return empty array when board data is invalid", async () => {
        const invalidBoards = [
          {
            id: 1,
            slug: "free",
            name: "General",
            // requiredRole이 유효하지 않은 값
            requiredRole: "invalid-role",
          },
        ];
        server.use(
          http.get(`${serverAddress}/boards`, () =>
            HttpResponse.json(invalidBoards, { status: 200 })
          )
        );
        const boards = await FetchAllBoards();
        expect(boards).toEqual([]); // Zod 검증 실패 시 빈 배열 반환
        expect(console.error).toHaveBeenCalled(); // 에러 로깅 확인
      });
    });

    describe("FetchDashboardSummary", () => {
      const consoleErrorMock = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      afterEach(() => {
        consoleErrorMock.mockClear();
      });

      it("should fetch dashboard summary successfully", async () => {
        const result = await FetchDashboardSummary();
        expect(result).toEqual(mockDashboardSummary);
        expect(result.recentPosts).toBeInstanceOf(Array);
        expect(result.popularPosts).toBeInstanceOf(Array);
        expect(result.noticesPosts).toBeInstanceOf(Array);
      });

      it("should throw error when response is invalid", async () => {
        // invalid data (배열 대신 단일 객체 반환)
        const invalidData = {
          visitors: 150,
          recentPosts: mockPosts[0], // 배열이 아닌 단일 객체
          popularPosts: mockPosts[1],
          noticesPosts: mockPosts[0],
        };

        server.use(
          http.get(`${serverAddress}/dashboard/summary`, () =>
            HttpResponse.json(invalidData, { status: 200 })
          )
        );

        await expect(FetchDashboardSummary()).rejects.toThrow(
          "Invalid data format for DashboardSummary"
        );
        expect(console.error).toHaveBeenCalled();
      });

      it("should throw error when server returns 500", async () => {
        server.use(
          http.get(`${serverAddress}/dashboard/summary`, () =>
            HttpResponse.json(
              { error: "Internal Server Error" },
              { status: 500 }
            )
          )
        );

        await expect(FetchDashboardSummary()).rejects.toThrow(
          "Failed to fetch DashboardSummary"
        );
      });
    });
  });

  describe("Admin Function", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe("Admin-User Function", () => {
      describe("FetchUserPaginatedList", () => {
        const consoleErrorMock = jest
          .spyOn(console, "error")
          .mockImplementation(() => {});

        beforeEach(() => jest.clearAllMocks());
        afterEach(() => consoleErrorMock.mockClear());

        it("should fetch user list successfully", async () => {
          const mockResponse = {
            data: [
              {
                id: 1,
                name: "John Doe",
                nickname: "johndoe123",
                email: "john@example.com",
                role: UserRole.USER,
                createdAt: new Date().toISOString(),
              },
            ],
            currentPage: 1,
            totalItems: 100,
            totalPages: 10,
          };

          server.use(
            http.get(`${serverAddress}/admin/users`, () =>
              HttpResponse.json(mockResponse)
            )
          );

          const result = await FetchUserPaginatedList({ page: 1, limit: 10 });
          expect(result).toEqual(mockResponse);
        });

        it("should throw error when response data is invalid", async () => {
          const invalidData = {
            data: "invalid",
            currentPage: "not-a-number",
          };

          server.use(
            http.get(`${serverAddress}/admin/users`, () =>
              HttpResponse.json(invalidData, { status: 200 })
            )
          );

          await expect(
            FetchUserPaginatedList({ page: 1, limit: 10 })
          ).rejects.toThrow("Invalid data format for UserList");

          expect(console.error).toHaveBeenCalledWith(
            "Validation failed:",
            expect.anything()
          );
        });

        it("should handle unauthorized access", async () => {
          server.use(
            http.get(
              `${serverAddress}/admin/users`,
              () => new HttpResponse(null, { status: 401 })
            )
          );

          await expect(
            FetchUserPaginatedList({ page: 1, limit: 10 })
          ).rejects.toThrow();

          expect(clearAuth).toHaveBeenCalled();
          expect(redirect).toHaveBeenCalledWith("/login?error=session_expired");
        });

        it("should apply custom pagination values", async () => {
          const mockResponse = {
            data: [
              {
                id: 1,
                name: "John Doe",
                nickname: "johndoe123",
                email: "john@example.com",
                role: UserRole.USER,
                createdAt: new Date().toISOString(),
                deletedAt: null,
              },
            ],
            currentPage: 2,
            totalItems: 1,
            totalPages: 1,
          };

          server.use(
            http.get(`${serverAddress}/admin/users`, ({ request }) => {
              const url = new URL(request.url);
              expect(url.searchParams.get("page")).toBe("2");
              expect(url.searchParams.get("limit")).toBe("5");
              return HttpResponse.json(mockResponse);
            })
          );

          await FetchUserPaginatedList({ page: 2, limit: 5 });
        });
      });
    });
  });
});
