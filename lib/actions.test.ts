import {
  signUpAction,
  LoginAction,
  LogoutAction,
  FetchPosts,
  CreatePost,
} from "./actions";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { resetAuthState } from "./authState";
import { mockPosts, server } from "../mocks/server";
import { http, HttpResponse } from "msw";
import { serverAddress, thisBaseUrl } from "./util";

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
  resetAuthState: jest.fn(),
}));

describe("Actions Module", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAuthState(); // 각 테스트 전에 인증 상태 초기화
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
      expect(resetAuthState).toHaveBeenCalled();
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
      (cookies as jest.Mock).mockResolvedValue({
        delete: jest.fn(),
      });

      await LogoutAction();

      const cookieStore = await cookies();
      expect(cookieStore.delete).toHaveBeenCalledWith("access_token");
      expect(cookieStore.delete).toHaveBeenCalledWith("refresh_token");
      expect(resetAuthState).toHaveBeenCalled();
      expect(redirect).toHaveBeenCalledWith("/login");
    });
  });

  describe("FetchPosts", () => {
    it("should fetch posts successfully", async () => {
      const posts = await FetchPosts();
      expect(posts).toEqual(mockPosts);
    });

    it("should throw an error when the response is not ok", async () => {
      server.use(
        http.get(`${serverAddress}/posts`, () => {
          return HttpResponse.json({ status: 500 }, { status: 500 });
        })
      );

      await FetchPosts();
      expect(notFound).toHaveBeenCalled();
    });

    it("should handle empty posts array", async () => {
      server.use(
        http.get(`${serverAddress}/posts`, () =>
          HttpResponse.json([], { status: 200 })
        )
      );

      const posts = await FetchPosts();
      expect(posts).toEqual([]);
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

      expect(redirect).toHaveBeenCalledWith("/dashboard/posts");
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

      const result = await CreatePost({}, formData);

      expect(resetAuthState).toHaveBeenCalled();
      expect(result.message).toBe("Your login has expired.");
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
