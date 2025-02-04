// actions.test.ts

import { signUpAction, LoginAction, LogoutAction } from "./action";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { resetAuthState } from "./authState";
import { server } from "../mocks/server";
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
}));

jest.mock("./authState", () => ({
  resetAuthState: jest.fn(),
}));

describe("Actions Module", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetAuthState(); // 각 테스트 전에 인증 상태 초기화
  });

  it("should handle successful sign-up", async () => {
    // Arrange: FormData 모킹
    const formData = new FormData();
    formData.append("name", "John Doe");
    formData.append("email", "john@example.com");
    formData.append("password", "password123");

    // Mock API 응답을 성공으로 변경
    server.use(
      http.post(`${serverAddress}/users`, () => {
        return HttpResponse.json({ success: true }, { status: 200 });
      })
    );

    // Act: 회원가입 액션 실행
    const result = await signUpAction({}, formData);

    // Assert: 에러가 없어야 함
    expect(result).not.toBeDefined();
    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("should handle failed sign-up due to invalid fields", async () => {
    // Arrange: FormData 모킹 (잘못된 데이터)
    const formData = new FormData();
    formData.append("name", "");
    formData.append("email", "invalid-email");
    formData.append("password", "short");

    // Act: 회원가입 액션 실행
    const result = await signUpAction({}, formData);

    // Assert: 에러 메시지가 반환되어야 함
    expect(result.errors?.name).toBeDefined();
    expect(result.errors?.email).toBeDefined();
    expect(result.errors?.password).toBeDefined();
    expect(result.message).toBe("Missing Fields. Failed to Sign Up.");
  });

  it("should handle successful login", async () => {
    (cookies as jest.Mock).mockResolvedValue({
      set: jest.fn(),
    });
    // Arrange: FormData 모킹
    const formData = new FormData();
    formData.append("email", "john@example.com");
    formData.append("password", "password123");

    // Mock API 응답을 성공으로 변경
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

    // Act: 로그인 액션 실행
    await LoginAction({}, formData);

    // Assert: 쿠키가 설정되고 리다이렉트 되어야 함
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

  it("should handle logout", async () => {
    (cookies as jest.Mock).mockResolvedValue({
      delete: jest.fn(),
    });
    // Act: 로그아웃 액션 실행
    await LogoutAction();

    // Assert: 쿠키가 삭제되고 캐시가 초기화되어야 함
    const cookieStore = await cookies();
    expect(cookieStore.delete).toHaveBeenCalledWith("access_token");
    expect(cookieStore.delete).toHaveBeenCalledWith("refresh_token");
    expect(resetAuthState).toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith("/login");
  });
});
