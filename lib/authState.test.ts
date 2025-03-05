// lib/authState.test.ts
import {
  getAuthState,
  clearAuth,
  loginStatus,
  AuthInfo,
  userStatus,
} from "./authState";
import { cookies } from "next/headers";
import { server } from "../mocks/server";
import { http, HttpResponse } from "msw";
import { serverAddress } from "./util";

jest.mock("next/headers", () => ({
  cookies: jest.fn(() =>
    Promise.resolve({
      get: jest.fn((key: string) => {
        if (key === "access_token") return { value: "valid-access-token" };
        if (key === "refresh_token") return { value: "valid-refresh-token" };
        if (key === "name") return { value: "John Doe" };
        if (key === "nickName") return { value: "John" };
        if (key === "email") return { value: "john@example.com" };
        return undefined;
      }),
      set: jest.fn().mockImplementation(() => {}),
      delete: jest.fn().mockImplementation(() => {}),
    })
  ),
}));

describe("AuthState Module", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return isAuthenticated: true when tokens are valid", async () => {
    // Arrange: 쿠키에 유효한 토큰을 설정
    (cookies as jest.Mock).mockResolvedValue({
      get: jest.fn((key: string) => {
        if (key === "access_token") return { value: "valid-access-token" };
        if (key === "refresh_token") return { value: "valid-refresh-token" };
        if (key === "name") return { value: "John Doe" };
        if (key === "nickName") return { value: "John" };
        if (key === "email") return { value: "john@example.com" };
        return undefined;
      }),
      set: jest.fn().mockImplementation(() => {}),
      delete: jest.fn().mockImplementation(() => {}),
    });

    // Mock API 응답을 성공으로 변경
    server.use(
      http.get(`${serverAddress}/auth/validate-token`, () => {
        return HttpResponse.json({ valid: true }, { status: 200 });
      })
    );

    // Act: 인증 상태 확인
    const authState = await getAuthState();

    // Assert: 인증 상태가 true여야 함
    expect(authState).toEqual({
      isAuthenticated: true,
      message: "Success validation!",
      name: "John Doe",
      nickName: "John",
      email: "john@example.com",
    } satisfies AuthInfo);
  });

  it("should refresh tokens and return isAuthenticated: true when refresh token is valid", async () => {
    // Arrange: 쿠키에 유효한 토큰을 설정
    (cookies as jest.Mock).mockResolvedValue({
      get: jest.fn((key: string) => {
        if (key === "access_token") return { value: "expired-access-token" };
        if (key === "refresh_token") return { value: "valid-refresh-token" };
        if (key === "name") return { value: "John Doe" };
        if (key === "nickName") return { value: "John" };
        if (key === "email") return { value: "john@example.com" };
        return undefined;
      }),
      set: jest.fn().mockImplementation(() => {}),
      delete: jest.fn().mockImplementation(() => {}),
    });

    // Mock API 응답을 실패로 변경 (액세스 토큰 검증 실패)
    server.use(
      http.get(`${serverAddress}/auth/validate-token`, () => {
        return HttpResponse.json({ valid: false }, { status: 200 });
      }),
      http.post(`${serverAddress}/auth/refresh`, () => {
        return HttpResponse.json(
          {
            access_token: "new-access-token",
            refresh_token: "new-refresh-token",
          },
          { status: 200 }
        );
      })
    );

    // Act: 인증 상태 확인
    const authState = await getAuthState();
    const cookieStore = await cookies();

    // Assert: 인증 상태가 true여야 함 (리프레시 토큰으로 갱신 성공)
    expect(authState).toEqual({
      isAuthenticated: true,
      message: "Success validation!",
      name: "John Doe",
      nickName: "John",
      email: "john@example.com",
    } satisfies AuthInfo);

    // 쿠키가 새로 설정되었는지 확인
    expect(cookieStore.set).toHaveBeenCalledWith(
      "access_token",
      "new-access-token",
      expect.any(Object)
    );
    expect(cookieStore.set).toHaveBeenCalledWith(
      "refresh_token",
      "new-refresh-token",
      expect.any(Object)
    );
  });

  it("should return isAuthenticated: false when tokens do not exist", async () => {
    // Arrange: 쿠키에 토큰이 없는 경우
    (cookies as jest.Mock).mockResolvedValue({
      get: jest.fn(() => undefined),
      delete: jest.fn().mockImplementation(() => {}),
    });

    // Act: 인증 상태 확인
    const authState = await getAuthState();

    // Assert: 인증 상태가 false여야 함
    expect(authState.isAuthenticated).toBe(false);
    expect(authState.message).toBe("The token does not exist.");
  });

  it("should return isAuthenticated: false when token refresh fails", async () => {
    // Arrange: 쿠키에 유효한 토큰을 설정
    (cookies as jest.Mock).mockResolvedValue({
      get: jest.fn((key: string) => {
        if (key === "access_token") return { value: "expired-access-token" };
        if (key === "refresh_token") return { value: "expired-refresh-token" };
        return undefined;
      }),
      delete: jest.fn().mockImplementation(() => {}),
    });
    server.use(
      http.get(`${serverAddress}/auth/validate-token`, () => {
        return HttpResponse.json({ valid: false }, { status: 200 });
      }),
      http.post(`${serverAddress}/auth/refresh`, () => {
        return HttpResponse.json({}, { status: 401 });
      })
    );

    const authState = await getAuthState();
    expect(authState.isAuthenticated).toBe(false);
    expect(authState.message).toBe("Refresh token expired or invalid.");
  });

  it("should refresh tokens when access_token is expired and cached state exists", async () => {
    // Arrange: 첫 번째 호출에서 캐싱된 상태를 설정
    (cookies as jest.Mock).mockResolvedValue({
      get: jest.fn((key: string) => {
        if (key === "access_token") return { value: "valid-access-token" };
        if (key === "refresh_token") return { value: "valid-refresh-token" };
        if (key === "name") return { value: "John Doe" };
        if (key === "nickName") return { value: "John" };
        if (key === "email") return { value: "john@example.com" };
        return undefined;
      }),
      set: jest.fn().mockImplementation(() => {}),
      delete: jest.fn().mockImplementation(() => {}),
    });

    // Mock API 응답: 첫 번째 호출에서는 유효한 access_token
    server.use(
      http.get(`${serverAddress}/auth/validate-token`, () => {
        return HttpResponse.json({ valid: true }, { status: 200 });
      })
    );

    // Act: 첫 번째 호출 - 캐싱된 상태 생성
    const firstAuthState = await getAuthState();
    expect(firstAuthState.isAuthenticated).toBe(true);
    expect(firstAuthState.message).toBe("Success validation!");

    // Arrange: 두 번째 호출에서 access_token이 만료된 상황으로 변경
    (cookies as jest.Mock).mockResolvedValue({
      get: jest.fn((key: string) => {
        if (key === "access_token") return { value: "expired-access-token" };
        if (key === "refresh_token") return { value: "valid-refresh-token" };
        if (key === "name") return { value: "John Doe" };
        if (key === "nickName") return { value: "John" };
        if (key === "email") return { value: "john@example.com" };
        return undefined;
      }),
      set: jest.fn().mockImplementation(() => {}),
    });

    // Mock API 응답: 두 번째 호출에서는 access_token 검증 실패 및 refresh_token으로 재발급 성공
    server.use(
      http.get(`${serverAddress}/auth/validate-token`, () => {
        return HttpResponse.json({ valid: false }, { status: 200 });
      }),
      http.post(`${serverAddress}/auth/refresh`, () => {
        return HttpResponse.json(
          {
            access_token: "new-access-token",
            refresh_token: "new-refresh-token",
          },
          { status: 200 }
        );
      })
    );

    // Act: 두 번째 호출 - 캐싱된 상태를 무시하고 refresh_token으로 재발급 시도
    const secondAuthState = await getAuthState();
    const cookieStore = await cookies();

    // Assert: 인증 상태가 true여야 함 (리프레시 토큰으로 갱신 성공)
    expect(secondAuthState.isAuthenticated).toBe(true);
    expect(secondAuthState.message).toBe("Success validation!");

    // 쿠키가 새로 설정되었는지 확인
    expect(cookieStore.set).toHaveBeenCalledWith(
      "access_token",
      "new-access-token",
      expect.any(Object)
    );
    expect(cookieStore.set).toHaveBeenCalledWith(
      "refresh_token",
      "new-refresh-token",
      expect.any(Object)
    );
  });

  it("should clear cached state and cookies when clearAuth is called", async () => {
    // Arrange: 초기 상태에서 유효한 토큰 설정
    (cookies as jest.Mock).mockResolvedValue({
      get: jest.fn((key: string) => {
        if (key === "access_token") return { value: "valid-access-token" };
        if (key === "refresh_token") return { value: "valid-refresh-token" };
        if (key === "name") return { value: "John Doe" };
        if (key === "nickName") return { value: "John" };
        if (key === "email") return { value: "john@example.com" };
        return undefined;
      }),
      set: jest.fn().mockImplementation(() => {}),
      delete: jest.fn().mockImplementation(() => {}),
    });

    // 초기 인증 상태 확인
    const authState = await getAuthState();
    expect(authState.isAuthenticated).toBe(true);

    // Act: clearAuth 호출
    await clearAuth();

    // 쿠키가 삭제되었는지 확인
    const cookieStore = await cookies();
    expect(cookieStore.delete).toHaveBeenCalledWith("access_token");
    expect(cookieStore.delete).toHaveBeenCalledWith("refresh_token");
    expect(cookieStore.delete).toHaveBeenCalledWith("name");
    expect(cookieStore.delete).toHaveBeenCalledWith("nickName");
    expect(cookieStore.delete).toHaveBeenCalledWith("email");
  });
});

describe("loginStatus", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it("should return true when access_token cookie exists", async () => {
    // Arrange: Mock cookies to return an access_token
    (cookies as jest.Mock).mockReturnValue({
      get: jest.fn((name) => {
        if (name === "access_token") {
          return { value: "valid-token" };
        }
        return null;
      }),
    });

    // Act: Call the loginStatus function
    const result = await loginStatus();

    // Assert: Verify the result is true
    expect(result).toBe(true);
  });

  it("should return false when access_token cookie does not exist", async () => {
    // Arrange: Mock cookies to return no access_token
    (cookies as jest.Mock).mockReturnValue({
      get: jest.fn(() => null), // No access_token cookie
    });

    // Act: Call the loginStatus function
    const result = await loginStatus();

    // Assert: Verify the result is false
    expect(result).toBe(false);
  });
});

describe("userStatus", () => {
  beforeEach(() => {
    // 각 테스트 전에 mock을 초기화합니다.
    (cookies as jest.Mock).mockClear();
  });

  it("should return empty strings when no cookies are present", async () => {
    // Mock cookies()가 빈 객체를 반환하도록 설정
    (cookies as jest.Mock).mockReturnValue({
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      get: jest.fn((key) => undefined), // 쿠키가 없는 경우
    });

    const result = await userStatus();

    expect(result).toEqual({
      name: "",
      nickName: "",
      email: "",
    });
  });

  it("should return user data when cookies are present", async () => {
    // Mock cookies()가 특정 값을 반환하도록 설정
    (cookies as jest.Mock).mockReturnValue({
      get: jest.fn((key) => {
        switch (key) {
          case "access_token":
            return { value: "valid-token" };
          case "name":
            return { value: "John Doe" };
          case "nickName":
            return { value: "johndoe123" };
          case "email":
            return { value: "john.doe@example.com" };
          default:
            return undefined;
        }
      }),
    });

    const result = await userStatus();

    expect(result).toEqual({
      name: "John Doe",
      nickName: "johndoe123",
      email: "john.doe@example.com",
    });
  });

  it("should return empty strings for missing optional cookies", async () => {
    // access_token은 있지만, 나머지 쿠키는 없는 경우
    (cookies as jest.Mock).mockReturnValue({
      get: jest.fn((key) => {
        if (key === "access_token") {
          return { value: "valid-token" };
        }
        return undefined;
      }),
    });

    const result = await userStatus();

    expect(result).toEqual({
      name: "",
      nickName: "",
      email: "",
    });
  });

  it("should handle null or undefined values in cookies gracefully", async () => {
    // access_token은 있지만, 나머지 쿠키 값이 null인 경우
    (cookies as jest.Mock).mockReturnValue({
      get: jest.fn((key) => {
        if (key === "access_token") {
          return { value: "valid-token" };
        }
        return { value: null }; // null 값을 반환
      }),
    });

    const result = await userStatus();

    expect(result).toEqual({
      name: "",
      nickName: "",
      email: "",
    });
  });
});
