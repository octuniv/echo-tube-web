import { server } from "../../mocks/server";
import { http, HttpResponse } from "msw";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { clearAuth } from "../authState";
import { ERROR_MESSAGES } from "../constants/errorMessage";
import { UserRole } from "../definition/enums";
import { getTokens } from "../tokenUtils";
import { BASE_API_URL } from "../util";
import {
  signUpAction,
  LoginAction,
  LogoutAction,
  checkEmailExists,
  checkNicknameExists,
} from "./userAuthAction";

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
}));

jest.mock("../authState", () => ({
  clearAuth: jest.fn(),
}));

jest.mock("../tokenUtils", () => ({
  getTokens: jest.fn(),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

describe("userAuthAction Module", () => {
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
        http.post(`${BASE_API_URL}/users`, () => {
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
        http.post(`${BASE_API_URL}/users`, () => {
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
        message: ERROR_MESSAGES.INVALID_FIELD,
        errors: {
          nickname: [ERROR_MESSAGES.NICKNAME_EXISTS],
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
        http.post(`${BASE_API_URL}/users`, () => {
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
        message: ERROR_MESSAGES.INVALID_FIELD,
        errors: {
          email: [ERROR_MESSAGES.EMAIL_EXISTS],
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
        http.post(`${BASE_API_URL}/auth/login`, () => {
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
        http.post(`${BASE_API_URL}/auth/login`, () => {
          return HttpResponse.json(
            { error: ERROR_MESSAGES.INVALID_CREDENTIALS },
            { status: 401 }
          );
        })
      );

      const result = await LoginAction({}, formData);

      expect(result.message).toBe(ERROR_MESSAGES.INVALID_CREDENTIALS);
      expect(redirect).not.toHaveBeenCalled();
    });
  });

  describe("LogoutAction", () => {
    let consoleWarnSpy: jest.SpyInstance;

    beforeEach(() => {
      jest.clearAllMocks();
      server.resetHandlers();
      (getTokens as jest.Mock).mockResolvedValue({
        accessToken: "dummy-access-token",
        refreshToken: "dummy-refresh-token",
      });
      consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
      consoleWarnSpy.mockRestore();
    });

    it("should successfully logout and clear auth data", async () => {
      // Mock successful server response
      server.use(
        http.post(`${BASE_API_URL}/auth/logout`, () => {
          return HttpResponse.json(
            { message: "Logged out successfully" },
            { status: 200 }
          );
        })
      );

      await expect(LogoutAction()).rejects.toThrow();

      expect(clearAuth).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalledWith("/");
      expect(redirect).toHaveBeenCalledWith("/login");
    });

    it("should clear auth even if refresh token is missing", async () => {
      // Mock missing refresh token case
      (getTokens as jest.Mock).mockResolvedValue({
        accessToken: "dummy-access-token",
        refreshToken: undefined,
      });

      await expect(LogoutAction()).rejects.toThrow();

      expect(clearAuth).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalledWith("/");
      expect(redirect).toHaveBeenCalledWith("/login");
    });

    it("should handle 401 unauthorized response from server", async () => {
      // Mock 401 response

      server.use(
        http.post(`${BASE_API_URL}/auth/logout`, () => {
          return HttpResponse.json(
            { statusCode: 401, message: "Invalid refresh token" },
            { status: 401 }
          );
        })
      );

      await expect(LogoutAction()).rejects.toThrow();

      expect(clearAuth).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalledWith("/");
      expect(redirect).toHaveBeenCalledWith("/login");
    });

    it("should handle 500 internal server error", async () => {
      // Mock 500 error
      server.use(
        http.post(`${BASE_API_URL}/auth/logout`, () => {
          return HttpResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
          );
        })
      );

      await expect(LogoutAction()).rejects.toThrow();

      expect(clearAuth).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalledWith("/");
      expect(redirect).toHaveBeenCalledWith("/login");
    });

    it("should handle network errors gracefully", async () => {
      // Mock network error
      server.use(
        http.post(`${BASE_API_URL}/auth/logout`, () => {
          return new HttpResponse(null, { status: 503 });
        })
      );

      await expect(LogoutAction()).rejects.toThrow();

      expect(clearAuth).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalledWith("/");
      expect(redirect).toHaveBeenCalledWith("/login");
    });
  });

  describe("CheckEmailExist", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should check userExist by email successfully", async () => {
      server.use(
        http.post(`${BASE_API_URL}/users/check-email`, () => {
          return HttpResponse.json({ exists: true }, { status: 200 });
        })
      );

      const res = await checkEmailExists("exists@email.com");
      expect(res).toEqual({ exists: true });
    });

    it("should check non-exists user by email successfully", async () => {
      server.use(
        http.post(`${BASE_API_URL}/users/check-email`, () => {
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
        http.post(`${BASE_API_URL}/users/check-nickname`, () => {
          return HttpResponse.json({ exists: true }, { status: 200 });
        })
      );

      const res = await checkNicknameExists("exists");
      expect(res).toEqual({ exists: true });
    });

    it("should check non-exists user by nickname successfully", async () => {
      server.use(
        http.post(`${BASE_API_URL}/users/check-nickname`, () => {
          return HttpResponse.json({ exists: false }, { status: 200 });
        })
      );

      const res = await checkNicknameExists("non-exists");
      expect(res).toEqual({ exists: false });
    });
  });
});
