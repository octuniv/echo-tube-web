import { authenticatedFetch } from "./authenticatedFetch";
import { cookies } from "next/headers";
import { server } from "../../mocks/server";
import { http, HttpResponse } from "msw";
import { AuthenticatedFetchErrorType } from "./types";
import { revalidatePath } from "next/cache";

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

const revalidatePathMock = revalidatePath as jest.Mock;

jest.mock("next/headers", () => ({
  cookies: jest.fn(() =>
    Promise.resolve({
      get: jest.fn((key: string) => {
        if (key === "access_token") return { value: "valid-access-token" };
        if (key === "refresh_token") return { value: "valid-refresh-token" };
        return undefined;
      }),
    })
  ),
}));

const mockServerAddress = process.env.SERVER_ADDRESS || "http://localhost:3000";

const setupCookies = (
  access_token = "valid-access-token",
  refresh_token = "valid-refresh-token"
) => {
  (cookies as jest.Mock).mockResolvedValue({
    get: jest.fn((key: string) => {
      if (key === "access_token") return { value: access_token };
      if (key === "refresh_token") return { value: refresh_token };
      return undefined;
    }),
    set: jest.fn(),
    delete: jest.fn(),
  });
};

describe("AuthenticatedFetch", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    server.resetHandlers();
  });

  it("should send request with valid token successfully", async () => {
    setupCookies();
    const mockData = { data: "success" };

    server.use(
      http.get(`${mockServerAddress}/test-endpoint`, () => {
        return HttpResponse.json(mockData, { status: 200 });
      })
    );

    const response = await authenticatedFetch({
      url: `${mockServerAddress}/test-endpoint`,
    });
    const result = await response.data;

    expect(response.error).toBeNull();
    expect(result).toEqual(mockData);
  });

  it("should refresh token and retry on 401 error", async () => {
    setupCookies("expired-access-token", "valid-refresh-token");

    server.use(
      // 첫 번째 요청은 401 반환
      http.get(
        `${mockServerAddress}/test-endpoint`,
        () => HttpResponse.json({}, { status: 401 }),
        { once: true }
      ),

      // 토큰 갱신 성공
      http.post(`${mockServerAddress}/auth/refresh`, () =>
        HttpResponse.json(
          {
            access_token: "new-access-token",
            refresh_token: "new-refresh-token",
          },
          { status: 200 }
        )
      ),

      // 재요청 성공
      http.get(`${mockServerAddress}/test-endpoint`, () =>
        HttpResponse.json({ data: "retry-success" }, { status: 200 })
      )
    );

    const response = await authenticatedFetch({
      url: `${mockServerAddress}/test-endpoint`,
    });
    const cookieStore = await cookies();

    expect(response.data).toEqual({ data: "retry-success" });
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

  it("should throw InvalidJwtToken error if token refresh fails", async () => {
    setupCookies("expired-access-token", "invalid-refresh-token");

    server.use(
      http.get(`${mockServerAddress}/test-endpoint`, () =>
        HttpResponse.json({}, { status: 401 })
      ),
      http.post(`${mockServerAddress}/auth/refresh`, () =>
        HttpResponse.json({}, { status: 401 })
      )
    );

    const response = await authenticatedFetch({
      url: `${mockServerAddress}/test-endpoint`,
    });

    expect(response.error?.type).toBe(AuthenticatedFetchErrorType.Unauthorized);
    expect(response.error?.message).toBe("세션이 만료되었습니다.");
  });

  it("should throw server error after token refresh if retry fails", async () => {
    setupCookies("expired-access-token", "valid-refresh-token");

    server.use(
      http.get(
        `${mockServerAddress}/test-endpoint`,
        () => {
          return HttpResponse.json({}, { status: 401 });
        },
        {
          once: true,
        }
      ),
      http.post(`${mockServerAddress}/auth/refresh`, () =>
        HttpResponse.json(
          {
            access_token: "new-access-token",
            refresh_token: "new-refresh-token",
          },
          { status: 200 }
        )
      ),
      http.get(`${mockServerAddress}/test-endpoint`, () =>
        HttpResponse.json({}, { status: 500 })
      )
    );

    const response = await authenticatedFetch({
      url: `${mockServerAddress}/test-endpoint`,
    });

    expect(response.error?.type).toBe(AuthenticatedFetchErrorType.ServerError);
    expect(response.error?.message).toBe("서버 오류가 발생했습니다.");
  });

  it("should handle 409 Conflict error correctly", async () => {
    setupCookies();

    server.use(
      http.get(`${mockServerAddress}/test-endpoint`, () =>
        HttpResponse.json(
          { message: "요청한 값이 중복되었습니다." },
          { status: 409 }
        )
      )
    );

    const response = await authenticatedFetch({
      url: `${mockServerAddress}/test-endpoint`,
    });

    expect(response.error?.type).toBe(
      AuthenticatedFetchErrorType.ConflictError
    );
    expect(response.error?.message).toBe("요청한 값이 중복되었습니다.");
  });

  it("should handle network errors", async () => {
    setupCookies();

    server.use(
      http.get(`${mockServerAddress}/test-endpoint`, () => {
        return new HttpResponse(null, { status: 0 }); // network error
      })
    );

    const response = await authenticatedFetch({
      url: `${mockServerAddress}/test-endpoint`,
    });

    expect(response.error?.type).toBe(AuthenticatedFetchErrorType.NetworkError);
    expect(response.error?.message).toBe("네트워크 연결에 실패했습니다.");
  });

  it("should handle 404 Not Found error", async () => {
    setupCookies();

    server.use(
      http.get(`${mockServerAddress}/test-endpoint`, () =>
        HttpResponse.json(
          { message: "요청한 리소스를 찾을 수 없습니다." },
          { status: 404 }
        )
      )
    );

    const response = await authenticatedFetch({
      url: `${mockServerAddress}/test-endpoint`,
    });

    expect(response.error?.type).toBe(AuthenticatedFetchErrorType.NotFound);
    expect(response.error?.message).toBe("요청한 리소스를 찾을 수 없습니다.");
  });

  it("should handle 500 Internal Server Error", async () => {
    setupCookies();

    server.use(
      http.get(`${mockServerAddress}/test-endpoint`, () =>
        HttpResponse.json(
          { message: "서버 내부 오류가 발생했습니다." },
          { status: 500 }
        )
      )
    );

    const response = await authenticatedFetch({
      url: `${mockServerAddress}/test-endpoint`,
    });

    expect(response.error?.type).toBe(AuthenticatedFetchErrorType.ServerError);
    expect(response.error?.message).toBe("서버 오류가 발생했습니다.");
  });

  it("should not revalidate path on failed requests", async () => {
    setupCookies();

    server.use(
      http.get(`${mockServerAddress}/test-endpoint`, () =>
        HttpResponse.json({}, { status: 500 })
      )
    );

    await authenticatedFetch({
      url: `${mockServerAddress}/test-endpoint`,
      revalidatePath: "/admin/users",
    });

    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("should revalidate path on successful requests", async () => {
    setupCookies();
    server.use(
      http.get(`${mockServerAddress}/test-endpoint`, () =>
        HttpResponse.json({ data: "success" }, { status: 200 })
      )
    );

    await authenticatedFetch({
      url: `${mockServerAddress}/test-endpoint`,
      revalidatePath: "/admin/users",
    });

    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/users");
  });
});
