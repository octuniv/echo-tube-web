// lib/authState.test.ts

import { getAuthState, resetAuthState } from "./authState";
import { cookies } from "next/headers";
import { server } from "../mocks/server";
import { http, HttpResponse } from "msw";
import { serverAddress } from "./util";

jest.mock("next/headers", () => ({
  cookies: jest.fn(() =>
    Promise.resolve({
      get: jest.fn((key: string) => {
        if (key === "access_token") return { value: "expired-access-token" };
        if (key === "refresh_token") return { value: "valid-refresh-token" };
        return undefined;
      }),
      set: jest.fn(),
      delete: jest.fn(),
    })
  ),
}));

describe("AuthState Module", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAuthState(); // 각 테스트 전에 인증 상태 초기화
  });

  it("should return isAuthenticated: false when tokens do not exist", async () => {
    // Arrange: 쿠키에 토큰이 없는 경우
    (cookies as jest.Mock).mockResolvedValue({
      get: jest.fn(() => undefined),
    });

    // Act: 인증 상태 확인
    const authState = await getAuthState();

    // Assert: 인증 상태가 false여야 함
    expect(authState.isAuthenticated).toBe(false);
    if (!authState.isAuthenticated) {
      expect(authState.message).toBe("The token does not exist.");
    }
  });

  it("should return isAuthenticated: true when tokens are valid", async () => {
    // Arrange: 쿠키에 유효한 토큰을 설정
    (cookies as jest.Mock).mockResolvedValue({
      get: jest.fn((key: string) => {
        if (key === "access_token") return { value: "valid-access-token" };
        if (key === "refresh_token") return { value: "valid-refresh-token" };
        return undefined;
      }),
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
    expect(authState.isAuthenticated).toBe(true);
  });

  it("should refresh tokens and return isAuthenticated: true when refresh token is valid", async () => {
    // Arrange: 쿠키에 만료된 액세스 토큰과 유효한 리프레시 토큰을 설정
    (cookies as jest.Mock).mockResolvedValue({
      get: jest.fn((key: string) => {
        if (key === "access_token") return { value: "expired-access-token" };
        if (key === "refresh_token") return { value: "valid-refresh-token" };
        return undefined;
      }),
      set: jest.fn(),
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
    expect(authState.isAuthenticated).toBe(true);

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
});
