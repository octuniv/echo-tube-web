import { server } from "../../mocks/server";
import { http, HttpResponse } from "msw";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { clearAuth } from "../authState";
import { ERROR_MESSAGES } from "../constants/errorMessage";
import { UserRole, UserAuthInfo } from "../definition";
import { BASE_API_URL } from "../util";
import {
  DeleteUser,
  UpdateNicknameAction,
  UpdatePasswordAction,
} from "./userProfileActions";

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

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

describe("UserProfileAciton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    server.resetHandlers();
  });

  describe("DeleteUser", () => {
    const consoleErrorMock = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    beforeEach(() => {
      jest.clearAllMocks();
    });

    afterEach(() => consoleErrorMock.mockClear());

    it("should delete a user successfully and redirect to /", async () => {
      // Mock the server response for a successful DELETE request
      server.use(
        http.delete(`${BASE_API_URL}/users`, () => {
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
        http.delete(`${BASE_API_URL}/users`, () => {
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
        http.delete(`${BASE_API_URL}/users`, () => {
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
        http.delete(`${BASE_API_URL}/users`, () => {
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
        http.patch(`${BASE_API_URL}/users/nickname`, () => {
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
        http.patch(`${BASE_API_URL}/users/nickname`, () => {
          return HttpResponse.json(
            { error: ERROR_MESSAGES.INVALID_CREDENTIALS },
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
        http.patch(`${BASE_API_URL}/users/nickname`, () => {
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
          nickname: [ERROR_MESSAGES.NICKNAME_EXISTS],
        },
      });
    });

    it("should handle network errors", async () => {
      const formData = new FormData();
      formData.append("nickname", "newnickname");
      server.use(
        http.patch(`${BASE_API_URL}/users/nickname`, () => {
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
        http.patch(`${BASE_API_URL}/users/password`, () => {
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
        http.patch(`${BASE_API_URL}/users/password`, () => {
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
        http.patch(`${BASE_API_URL}/users/password`, () => {
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
        http.patch(`${BASE_API_URL}/users/password`, () => {
          return HttpResponse.json(
            { error: ERROR_MESSAGES.INVALID_CREDENTIALS },
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
        http.patch(`${BASE_API_URL}/users/password`, () => {
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
});
