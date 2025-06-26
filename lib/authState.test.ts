// lib/authState.test.ts
import { loginStatus, userStatus } from "./authState";
import { cookies } from "next/headers";
import { UserAuthInfo, UserRole } from "./definition";

jest.mock("next/headers", () => ({
  cookies: jest.fn(() =>
    Promise.resolve({
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
      set: jest.fn().mockImplementation(() => {}),
      delete: jest.fn().mockImplementation(() => {}),
    })
  ),
}));

describe("loginStatus", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it("should return true when refresh_token cookie exists", async () => {
    // Arrange: Mock cookies to return an refresh_token
    (cookies as jest.Mock).mockReturnValue({
      get: jest.fn((name) => {
        if (name === "refresh_token") {
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

  it("should return false when refresh_token cookie does not exist", async () => {
    // Arrange: Mock cookies to return no refresh_token
    (cookies as jest.Mock).mockReturnValue({
      get: jest.fn(() => null), // No refresh_token cookie
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
      nickname: "",
      email: "",
      role: null,
    } satisfies UserAuthInfo);
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
          case "user":
            return {
              value: JSON.stringify({
                name: "John Doe",
                nickname: "John",
                email: "john@example.com",
                role: UserRole.USER,
              }),
            };
          default:
            return undefined;
        }
      }),
    });

    const result = await userStatus();

    expect(result).toEqual({
      name: "John Doe",
      nickname: "John",
      email: "john@example.com",
      role: UserRole.USER,
    } satisfies UserAuthInfo);
  });

  it("should return empty strings for missing optional cookies", async () => {
    // access_token은 있지만, 나머지 쿠키는 없는 경우
    (cookies as jest.Mock).mockReturnValue({
      get: jest.fn((key) => {
        switch (key) {
          case "access_token":
            return undefined;
          case "user":
            return {
              value: JSON.stringify({
                name: "John Doe",
                nickname: "John",
                email: "john@example.com",
                role: UserRole.USER,
              }),
            };
          default:
            return undefined;
        }
      }),
    });

    const result = await userStatus();

    expect(result).toEqual({
      name: "",
      nickname: "",
      email: "",
      role: null,
    } satisfies UserAuthInfo);
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
      nickname: "",
      email: "",
      role: null,
    } satisfies UserAuthInfo);
  });
});
