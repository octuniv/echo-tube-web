import {
  FetchUserPaginatedList,
  AdminSignUpAction,
  fetchUserDetails,
  deleteUser,
  AdminUserUpdateAction,
  FetchUserSearchResults,
} from "./adminUserManagementApi";
import {
  AdminUserCreateState,
  AdminUserDetailResponse,
  AdminUserUpdateState,
} from "../definition/adminUserManagementSchema";
import { mockUserList } from "../../mocks/admin/userHandlers";
import { server } from "../../mocks/server";
import { http, HttpResponse } from "msw";
import { BASE_API_URL } from "../util";
import { clearAuth } from "../authState";
import { UserRole } from "../definition";
import { ERROR_MESSAGES } from "../constants/errorMessage";
import { forbidden, redirect } from "next/navigation";
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
  revalidatePath: jest.fn(),
}));

describe("Admin User API Test", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    server.resetHandlers();
  });
  describe("FetchUserPaginatedList", () => {
    const consoleErrorMock = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    beforeEach(() => jest.clearAllMocks());
    afterEach(() => consoleErrorMock.mockClear());

    it("should apply default sorting when no parameters provided", async () => {
      const result = await FetchUserPaginatedList({ page: 1, limit: 10 });
      expect(result.data).toEqual(
        [...mockUserList].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
    });

    it("should sort by updatedAt in ascending order", async () => {
      const result = await FetchUserPaginatedList({
        page: 1,
        limit: 10,
        sort: "updatedAt",
        order: "ASC",
      });

      expect(result.data).toEqual(
        [...mockUserList].sort((a, b) => {
          const dateA = new Date(a.updatedAt).getTime();
          const dateB = new Date(b.updatedAt).getTime();
          return dateA - dateB;
        })
      );
    });

    it("should handle invalid sort field gracefully", async () => {
      const invalidData = {
        data: mockUserList,
        currentPage: "invalid",
        totalItems: "invalid",
      };

      server.use(
        http.get(`${BASE_API_URL}/admin/users`, () =>
          HttpResponse.json(invalidData, { status: 200 })
        )
      );

      await expect(
        FetchUserPaginatedList({ page: 1, limit: 10 })
      ).rejects.toThrow("Invalid data format for UserList");
    });

    it("should handle unauthorized access", async () => {
      server.use(
        http.get(`${BASE_API_URL}/admin/users`, () =>
          HttpResponse.json({ message: "Unauthorized" }, { status: 401 })
        )
      );

      await expect(
        FetchUserPaginatedList({ page: 1, limit: 10 })
      ).rejects.toThrow(ERROR_MESSAGES.FORBIDDEN);
    });

    it("should handle permission denied", async () => {
      server.use(
        http.get(`${BASE_API_URL}/admin/users`, () => {
          return HttpResponse.json({ message: "Forbidden" }, { status: 403 });
        })
      );
      await expect(
        FetchUserPaginatedList({ page: 1, limit: 10 })
      ).rejects.toThrow(ERROR_MESSAGES.FORBIDDEN);
    });
  });

  describe("FetchUserSearchResults", () => {
    const consoleErrorMock = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    beforeEach(() => jest.clearAllMocks());
    afterEach(() => consoleErrorMock.mockClear());

    it("should search by email", async () => {
      const result = await FetchUserSearchResults({
        page: 1,
        limit: 10,
        searchEmail: "john@example.com",
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].email).toBe("john@example.com");
    });

    it("should search by nickname", async () => {
      const result = await FetchUserSearchResults({
        page: 1,
        limit: 10,
        searchNickname: "jane",
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].nickname).toBe("janesmith");
    });

    it("should search by role", async () => {
      const result = await FetchUserSearchResults({
        page: 1,
        limit: 10,
        searchRole: UserRole.ADMIN,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].role).toBe(UserRole.ADMIN);
    });

    it("should combine multiple search criteria", async () => {
      const result = await FetchUserSearchResults({
        page: 1,
        limit: 10,
        searchEmail: "jane",
        searchNickname: "jane",
        searchRole: UserRole.ADMIN,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].email).toContain("jane");
      expect(result.data[0].nickname).toContain("jane");
      expect(result.data[0].role).toBe(UserRole.ADMIN);
    });

    it("should sort search results", async () => {
      const result = await FetchUserSearchResults({
        page: 1,
        limit: 10,
        sort: "createdAt",
        order: "ASC",
      });

      const sortedData = [...mockUserList].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      expect(result.data).toEqual(sortedData);
    });

    it("should handle invalid search data", async () => {
      const invalidData = {
        currentPage: "invalid",
      };

      server.use(
        http.get(`${BASE_API_URL}/admin/users/search`, () =>
          HttpResponse.json(invalidData, { status: 200 })
        )
      );

      await expect(
        FetchUserSearchResults({ page: 1, limit: 10 })
      ).rejects.toThrow("Invalid data format for search results");
    });

    it("should handle network errors", async () => {
      server.use(
        http.get(
          `${BASE_API_URL}/admin/users/search`,
          () => new HttpResponse(null, { status: 503 })
        )
      );

      await expect(
        FetchUserSearchResults({ page: 1, limit: 10 })
      ).rejects.toThrow(
        "사용자 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요."
      );
    });

    it("should handle permission denied", async () => {
      server.use(
        http.get(`${BASE_API_URL}/admin/users/search`, () => {
          return HttpResponse.json({ message: "Forbidden" }, { status: 403 });
        })
      );
      await expect(
        FetchUserSearchResults({ page: 1, limit: 10 })
      ).rejects.toThrow(ERROR_MESSAGES.FORBIDDEN);
    });
  });

  describe("AdminSignUpAction", () => {
    const formDataMock = (data: Record<string, string>) => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value);
      });
      return formData;
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should return validation errors when required fields are missing", async () => {
      const emptyFormData = new FormData();
      const result = await AdminSignUpAction(
        {} as AdminUserCreateState,
        emptyFormData
      );

      expect(result).toEqual({
        errors: {
          name: ["Expected string, received null"],
          nickname: ["Expected string, received null"],
          email: ["Expected string, received null"],
          password: ["Expected string, received null"],
          role: ["Expected 'admin' | 'user' | 'bot', received null"],
        },
        message: "Missing or invalid fields. Failed to create admin user.",
      });
    });

    it("should handle email conflict error", async () => {
      const userData = {
        name: "Test User",
        nickname: "testnick",
        email: "test@example.com",
        password: "password123",
        role: UserRole.ADMIN,
      };

      server.use(
        http.post(`${BASE_API_URL}/admin/users`, () => {
          return new HttpResponse(
            JSON.stringify({
              type: "Conflict",
              message: "This email test@example.com is already existed!",
            }),
            { status: 409 }
          );
        })
      );

      const result = await AdminSignUpAction(
        {} as AdminUserCreateState,
        formDataMock(userData)
      );

      expect(result).toEqual({
        message: ERROR_MESSAGES.INVALID_FIELD,
        errors: { email: [ERROR_MESSAGES.EMAIL_EXISTS] },
      });
    });

    it("should handle nickname conflict error", async () => {
      const userData = {
        name: "Test User",
        nickname: "takennick",
        email: "test@example.com",
        password: "password123",
        role: UserRole.ADMIN,
      };

      server.use(
        http.post(`${BASE_API_URL}/admin/users`, () => {
          return new HttpResponse(
            JSON.stringify({
              type: "Conflict",
              message: "This nickname takennick is already existed!",
            }),
            { status: 409 }
          );
        })
      );

      const result = await AdminSignUpAction(
        {} as AdminUserCreateState,
        formDataMock(userData)
      );

      expect(result).toEqual({
        message: ERROR_MESSAGES.INVALID_FIELD,
        errors: { nickname: [ERROR_MESSAGES.NICKNAME_EXISTS] },
      });
    });

    it("should handle unauthorized error", async () => {
      const userData = {
        name: "Test User",
        nickname: "testnick",
        email: "test@example.com",
        password: "password123",
        role: UserRole.ADMIN,
      };

      server.use(
        http.post(`${BASE_API_URL}/admin/users`, () => {
          return new HttpResponse(null, { status: 401 });
        })
      );

      await expect(
        AdminSignUpAction({} as AdminUserCreateState, formDataMock(userData))
      ).rejects.toThrow();

      // Assuming clearAuth and redirect are mocked in global setup
      expect(clearAuth).toHaveBeenCalled();
      expect(redirect).toHaveBeenCalledWith("/login?error=session_expired");
    });

    it("should successfully create admin user", async () => {
      const userData = {
        name: "New Admin",
        nickname: "newadmin",
        email: "newadmin@example.com",
        password: "securePass123",
        role: UserRole.ADMIN,
      };

      server.use(
        http.post(`${BASE_API_URL}/admin/users`, () => {
          return HttpResponse.json({
            email: "newadmin@example.com",
            message: "Successfully created account",
          });
        })
      );

      await expect(
        AdminSignUpAction({} as AdminUserCreateState, formDataMock(userData))
      ).rejects.toThrow();

      expect(revalidatePath).toHaveBeenCalledWith("/admin/users");
      expect(redirect).toHaveBeenCalledWith("/admin/users");
    });

    it("should handle unexpected errors", async () => {
      const userData = {
        name: "Test User",
        nickname: "testnick",
        email: "test@example.com",
        password: "password123",
        role: UserRole.ADMIN,
      };

      server.use(
        http.post(`${BASE_API_URL}/admin/users`, () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      const result = await AdminSignUpAction(
        {} as AdminUserCreateState,
        formDataMock(userData)
      );

      expect(console.error).toHaveBeenCalledWith(
        "Unexpected error during admin signup:",
        expect.anything()
      );
      expect(result).toEqual({
        message: "An unexpected error occurred. Please try again.",
      });
    });

    it("should handle permission denied", async () => {
      const userData = {
        name: "Test User",
        nickname: "testnick",
        email: "test@example.com",
        password: "password123",
        role: UserRole.ADMIN,
      };
      server.use(
        http.post(`${BASE_API_URL}/admin/users`, () => {
          return HttpResponse.json({ message: "Forbidden" }, { status: 403 });
        })
      );
      await expect(
        AdminSignUpAction({} as AdminUserCreateState, formDataMock(userData))
      ).rejects.toThrow();
      expect(forbidden).toHaveBeenCalled();
    });
  });

  describe("fetchUserDetails", () => {
    const mockUser: AdminUserDetailResponse = {
      id: 1,
      name: "John Doe",
      nickname: "johndoe",
      email: "john@example.com",
      role: UserRole.USER,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-02T00:00:00Z",
      deletedAt: null,
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should fetch user details successfully for valid ID", async () => {
      const userId = 1;
      server.use(
        http.get(`${BASE_API_URL}/admin/users/${userId}`, () => {
          return HttpResponse.json(mockUser, { status: 200 });
        })
      );

      const result = await fetchUserDetails(userId);
      expect(result).not.toBeNull();
      expect(result).toEqual(mockUser);
      expect(result?.id).toBe(userId);
      expect(result?.email).toBe(mockUser.email);
    });

    it("should return null when user does not exist", async () => {
      const userId = 999;
      server.use(
        http.get(`${BASE_API_URL}/admin/users/${userId}`, () => {
          return HttpResponse.json(
            { error: "User not found" },
            { status: 404 }
          );
        })
      );
      const result = await fetchUserDetails(userId);
      expect(result).toBeNull();
    });

    it("should handle unauthorized access (401 error)", async () => {
      const userId = 1;
      server.use(
        http.get(`${BASE_API_URL}/admin/users/${userId}`, () => {
          return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
        })
      );

      await expect(fetchUserDetails(userId)).rejects.toThrow(
        ERROR_MESSAGES.FORBIDDEN
      );
    });

    it("should handle network errors", async () => {
      const userId = 1;
      server.use(
        http.get(`${BASE_API_URL}/admin/users/${userId}`, () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      await expect(fetchUserDetails(userId)).rejects.toThrow(
        "사용자 정보를 불러오지 못했습니다"
      );
    });

    it("should handle invalid data format", async () => {
      const userId = 1;
      const invalidData = {
        id: "invalid", // ID가 숫자가 아님
        name: 123, // 이름이 문자열이 아님
        email: "invalid-email",
      };
      server.use(
        http.get(`${BASE_API_URL}/admin/users/${userId}`, () => {
          return HttpResponse.json(invalidData, { status: 200 });
        })
      );

      await expect(fetchUserDetails(userId)).rejects.toThrow(
        "Invalid user data format"
      );
    });

    it("should handle deleted user with deletedAt field", async () => {
      const userId = 2;
      const mockDeletedUser = {
        ...mockUser,
        id: userId,
        deletedAt: "2024-01-03T00:00:00Z",
      };
      server.use(
        http.get(`${BASE_API_URL}/admin/users/${userId}`, () => {
          return HttpResponse.json(mockDeletedUser, { status: 200 });
        })
      );

      const result = await fetchUserDetails(userId);
      expect(result).not.toBeNull();
      expect(result).toEqual(mockDeletedUser);
      expect(result?.deletedAt).toBe(mockDeletedUser.deletedAt);
    });

    it("should handle optional fields correctly", async () => {
      const userId = 3;
      const userWithOptionalFields = {
        ...mockUser,
        id: userId,
        deletedAt: undefined, // 선택적 필드
      };
      server.use(
        http.get(`${BASE_API_URL}/admin/users/${userId}`, () => {
          return HttpResponse.json(userWithOptionalFields, { status: 200 });
        })
      );

      const result = await fetchUserDetails(userId);
      expect(result).not.toBeNull();
      expect(result).toEqual(userWithOptionalFields);
      expect(result?.deletedAt).toBeUndefined();
    });

    it("should handle permission denied", async () => {
      const userId = 1;
      server.use(
        http.get(`${BASE_API_URL}/admin/users/${userId}`, () => {
          return HttpResponse.json({ message: "Forbidden" }, { status: 403 });
        })
      );
      await expect(fetchUserDetails(userId)).rejects.toThrow(
        ERROR_MESSAGES.FORBIDDEN
      );
    });
  });

  describe("deleteUser", () => {
    const userId = 1;
    const apiUrl = `${BASE_API_URL}/admin/users/${userId}`;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should delete user successfully and redirect to /admin/users", async () => {
      // Mock successful DELETE response
      server.use(
        http.delete(apiUrl, () => {
          return HttpResponse.json(
            { message: "Successfully deleted user", success: true },
            { status: 200 }
          );
        })
      );

      await deleteUser(userId);

      expect(revalidatePath).toHaveBeenCalledWith("/admin/users");
    });

    it("should handle unauthorized error and redirect to login", async () => {
      // Mock 401 Unauthorized response
      server.use(
        http.delete(apiUrl, () => {
          return HttpResponse.json(
            { message: "Unauthorized", statusCode: 401 },
            { status: 401 }
          );
        })
      );

      await expect(deleteUser(userId)).rejects.toThrow(
        "Redirect to /login?error=session_expired"
      );

      expect(clearAuth).toHaveBeenCalled();
      expect(redirect).toHaveBeenCalledWith("/login?error=session_expired");
    });

    it("should handle server error (500)", async () => {
      // Mock 500 Internal Server Error
      server.use(
        http.delete(apiUrl, () => {
          return HttpResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
          );
        })
      );

      await expect(deleteUser(userId)).rejects.toThrow(
        "서버 오류가 발생했습니다."
      );
    });

    it("should handle not found error (404)", async () => {
      // Mock 404 Not Found response
      server.use(
        http.delete(apiUrl, () => {
          return HttpResponse.json(
            { message: "User not found" },
            { status: 404 }
          );
        })
      );

      await expect(deleteUser(userId)).rejects.toThrow(
        "요청한 리소스를 찾을 수 없습니다."
      );
    });

    it("should handle network error", async () => {
      // Mock network error
      server.use(
        http.delete(apiUrl, () => {
          return new HttpResponse(null, { status: 503 });
        })
      );

      await expect(deleteUser(userId)).rejects.toThrow(
        "사용자를 삭제할 수 없습니다."
      );
    });

    it("should handle permission denied", async () => {
      const userId = 1;
      server.use(
        http.delete(`${BASE_API_URL}/admin/users/${userId}`, () => {
          return HttpResponse.json({ message: "Forbidden" }, { status: 403 });
        })
      );
      await expect(deleteUser(userId)).rejects.toThrow();
      expect(forbidden).toHaveBeenCalled();
    });
  });

  describe("AdminUserUpdateAction", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should return validation errors when no fields are provided", async () => {
      const formData = new FormData();
      const result = await AdminUserUpdateAction(
        1,
        {} as AdminUserUpdateState,
        formData
      );

      expect(result).toEqual({
        errors: {},
        message: "Invalid fields. Please check your input values.",
      });
    });

    it("should handle invalid role enum value", async () => {
      const formData = new FormData();
      formData.append("role", "invalid_role");

      const result = await AdminUserUpdateAction(
        1,
        {} as AdminUserUpdateState,
        formData
      );

      expect(result.errors?.role).toBeDefined();
      expect(result.message).toBe(
        "Invalid fields. Please check your input values."
      );
    });

    it("should successfully update user and redirect", async () => {
      const formData = new FormData();
      formData.append("nickname", "newnick");

      server.use(
        http.patch(`${BASE_API_URL}/admin/users/1`, () => {
          return HttpResponse.json({ success: true }, { status: 200 });
        })
      );

      await expect(
        AdminUserUpdateAction(1, {} as AdminUserUpdateState, formData)
      ).rejects.toThrow();

      expect(revalidatePath).toHaveBeenCalledWith("/admin/users");
      expect(redirect).toHaveBeenCalledWith("/admin/users");
    });

    it("should handle unauthorized error during update", async () => {
      const formData = new FormData();
      formData.append("nickname", "newnick");

      server.use(
        http.patch(`${BASE_API_URL}/admin/users/1`, () => {
          return HttpResponse.json(
            { message: "Unauthorized" },
            { status: 401 }
          );
        })
      );

      await expect(
        AdminUserUpdateAction(1, {} as AdminUserUpdateState, formData)
      ).rejects.toThrow();

      expect(clearAuth).toHaveBeenCalled();
      expect(redirect).toHaveBeenCalledWith("/login?error=session_expired");
    });

    it("should handle nickname conflict error", async () => {
      const formData = new FormData();
      formData.append("nickname", "takennick");

      server.use(
        http.patch(`${BASE_API_URL}/admin/users/1`, () => {
          return HttpResponse.json(
            {
              type: "Conflict",
              message: "This nickname takennick is already existed!",
            },
            { status: 409 }
          );
        })
      );

      const result = await AdminUserUpdateAction(
        1,
        {} as AdminUserUpdateState,
        formData
      );

      expect(result).toEqual({
        message: ERROR_MESSAGES.INVALID_FIELD,
        errors: { nickname: [ERROR_MESSAGES.NICKNAME_EXISTS] },
      });
    });

    it("should handle general conflict error", async () => {
      const formData = new FormData();
      formData.append("nickname", "test");

      server.use(
        http.patch(`${BASE_API_URL}/admin/users/1`, () => {
          return HttpResponse.json(
            {
              type: "Conflict",
              message: "General conflict occurred",
            },
            { status: 409 }
          );
        })
      );

      const result = await AdminUserUpdateAction(
        1,
        {} as AdminUserUpdateState,
        formData
      );

      expect(result).toEqual({
        message: "Conflict occurred. Please check your input values.",
      });
    });

    it("should handle unexpected error during update", async () => {
      const formData = new FormData();
      formData.append("nickname", "test");

      server.use(
        http.patch(`${BASE_API_URL}/admin/users/1`, () => {
          return HttpResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
          );
        })
      );

      const result = await AdminUserUpdateAction(
        1,
        {} as AdminUserUpdateState,
        formData
      );

      expect(console.error).toHaveBeenCalledWith(
        "Unexpected error during user manager editing:",
        expect.anything()
      );
      expect(result).toEqual({
        message: "An unexpected error occurred. Please try again.",
      });
    });

    it("should handle permission denied", async () => {
      const formData = new FormData();
      formData.append("nickname", "newnick");
      server.use(
        http.patch(`${BASE_API_URL}/admin/users/1`, () => {
          return HttpResponse.json({ message: "Forbidden" }, { status: 403 });
        })
      );
      await expect(
        AdminUserUpdateAction(1, {} as AdminUserUpdateState, formData)
      ).rejects.toThrow();
      expect(forbidden).toHaveBeenCalled();
    });
  });
});
