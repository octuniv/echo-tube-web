import {
  signUpAction,
  LoginAction,
  LogoutAction,
  FetchAllPosts,
  CreatePost,
  ensureAuthenticated,
  authenticatedFetch,
  FetchPost,
} from "./actions";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { clearAuth, getAuthState } from "./authState";
import { mockPosts, server } from "../mocks/server";
import { http, HttpResponse } from "msw";
import { serverAddress, thisBaseUrl } from "./util";
import { revalidatePath } from "next/cache";

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
  redirect: jest.fn(),
  notFound: jest.fn(),
}));

jest.mock("./authState", () => ({
  getAuthState: jest.fn(),
  clearAuth: jest.fn(),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

describe("Actions Module", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("ensureAuthenticated", () => {
    it("should return true when authenticated", async () => {
      (getAuthState as jest.Mock).mockResolvedValue({ isAuthenticated: true });
      const result = await ensureAuthenticated();
      expect(result).toBe(true);
    });

    it("should return false and clear auth when not authenticated", async () => {
      (getAuthState as jest.Mock).mockResolvedValue({ isAuthenticated: false });
      const result = await ensureAuthenticated();
      expect(clearAuth).toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  describe("authenticatedFetch", () => {
    it("should make a successful request with valid token", async () => {
      (getAuthState as jest.Mock).mockResolvedValue({ isAuthenticated: true });
      (cookies as jest.Mock).mockReturnValue({
        get: jest.fn((name: string) => ({ value: `${name}-valid-token` })),
      });

      server.use(
        http.get("https://example.com", () => {
          return HttpResponse.json({}, { status: 201 });
        })
      );

      const response = await authenticatedFetch("https://example.com");
      expect(response?.ok).toBe(true);
    });

    it("should handle 401 Unauthorized response", async () => {
      (getAuthState as jest.Mock).mockResolvedValue({ isAuthenticated: true });
      (cookies as jest.Mock).mockReturnValue({
        get: jest.fn((name: string) => ({ value: `${name}-expired-token` })),
      });

      server.use(
        http.get("https://example.com", () => {
          return HttpResponse.json({}, { status: 401 });
        })
      );

      const response = await authenticatedFetch("https://example.com");
      expect(clearAuth).toHaveBeenCalled();
      expect(response).toBeNull();
    });
  });

  describe("signUpAction", () => {
    it("should handle successful sign-up", async () => {
      const formData = new FormData();
      formData.append("name", "John Doe");
      formData.append("nickName", "John");
      formData.append("email", "john@example.com");
      formData.append("password", "password123");

      server.use(
        http.post(`${serverAddress}/users`, () => {
          return HttpResponse.json({ success: true }, { status: 200 });
        })
      );

      const result = await signUpAction({}, formData);

      expect(result).not.toBeDefined();
      expect(redirect).toHaveBeenCalledWith("/login");
    });

    it("should handle failed sign-up due to invalid fields", async () => {
      const formData = new FormData();
      formData.append("name", "");
      formData.append("nickName", "");
      formData.append("email", "invalid-email");
      formData.append("password", "short");

      const result = await signUpAction({}, formData);

      expect(result.errors?.name).toBeDefined();
      expect(result.errors?.nickName).toBeDefined();
      expect(result.errors?.email).toBeDefined();
      expect(result.errors?.password).toBeDefined();
      expect(result.message).toBe("Missing Fields. Failed to Sign Up.");
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
        http.post(`${thisBaseUrl}/api/login`, () => {
          return HttpResponse.json(
            {
              access_token: "valid-access-token",
              refresh_token: "valid-refresh-token",
            },
            { status: 200 }
          );
        })
      );

      await LoginAction({}, formData);

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
      expect(revalidatePath).toHaveBeenCalledWith("/");
      expect(redirect).toHaveBeenCalledWith("/dashboard");
    });

    it("should handle failed login due to invalid credentials", async () => {
      const formData = new FormData();
      formData.append("email", "invalid@example.com");
      formData.append("password", "wrong-password");

      server.use(
        http.post(`${thisBaseUrl}/api/login`, () => {
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
      await LogoutAction();

      expect(clearAuth).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalledWith("/");
      expect(redirect).toHaveBeenCalledWith("/login");
    });
  });

  describe("FetchAllPosts", () => {
    it("should fetch posts successfully", async () => {
      const posts = await FetchAllPosts();
      expect(posts).toEqual(mockPosts);
    });

    it("should throw an error when the response is not ok", async () => {
      server.use(
        http.get(`${serverAddress}/posts`, () => {
          return HttpResponse.json({ status: 500 }, { status: 500 });
        })
      );

      await FetchAllPosts();
      expect(notFound).toHaveBeenCalled();
    });

    it("should handle empty posts array", async () => {
      server.use(
        http.get(`${serverAddress}/posts`, () =>
          HttpResponse.json([], { status: 200 })
        )
      );

      const posts = await FetchAllPosts();
      expect(posts).toEqual([]);
    });
  });

  describe("FetchPost", () => {
    it("should fetch a post successfully", async () => {
      const postId = 1;
      const mockPost = {
        id: postId,
        title: "Post 1",
        content: "Content of Post 1",
        videoUrl: "https://example.com/video1",
        nickName: "UserA",
        createdAt: "2023-10-01T12:00:00Z",
        updatedAt: "2023-10-01T12:00:00Z",
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

      await FetchPost(postId);
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

      await FetchPost(postId);
      expect(notFound).toHaveBeenCalled();
    });
  });

  describe("CreatePost", () => {
    it("should create a post successfully", async () => {
      const formData = new FormData();
      formData.append("title", "New Post");
      formData.append("content", "This is the content of the new post.");
      formData.append("videoUrl", "https://example.com/video");

      server.use(
        http.post(`${serverAddress}/posts`, () => {
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

      await CreatePost({}, formData);

      expect(revalidatePath).toHaveBeenCalledWith("/posts");
      expect(redirect).toHaveBeenCalledWith("/posts");
    });

    it("should handle validation errors", async () => {
      const formData = new FormData();
      formData.append("title", "");
      formData.append("content", "");
      formData.append("videoUrl", "");

      const result = await CreatePost({}, formData);

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

      await CreatePost({}, formData);

      expect(clearAuth).toHaveBeenCalled();
      expect(redirect).toHaveBeenCalledWith("/login");
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

      const result = await CreatePost({}, formData);

      expect(result.message).toBe("Create post failed.");
    });
  });
});
