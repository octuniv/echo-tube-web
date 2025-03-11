import { cookies } from "next/headers";
import { serverAddress } from "./util";
import { http, HttpResponse } from "msw";
import { authenticatedFetch } from "./authService";
import { createError } from "./errors";
import { server } from "../mocks/server";

jest.mock("next/headers", () => ({
  cookies: jest.fn(() =>
    Promise.resolve({
      get: jest.fn((key: string) => {
        if (key === "access_token") return { value: "valid-access-token" };
        if (key === "refresh_token") return { value: "valid-refresh-token" };
        return undefined;
      }),
      set: jest.fn().mockImplementation(() => {}),
    })
  ),
}));

describe("authenticatedFetch", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    server.resetHandlers();
  });

  it("should send request with valid token successfully", async () => {
    (cookies as jest.Mock).mockReturnValue({
      get: jest.fn((name: string) => ({ value: `${name}-valid-token` })),
    });

    // Arrange
    const mockData = { data: "success" };
    server.use(
      http.get(`${serverAddress}/test-endpoint`, () => {
        return HttpResponse.json(mockData, { status: 200 });
      })
    );

    // Act
    const response = await authenticatedFetch(`${serverAddress}/test-endpoint`);
    const result = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(result).toEqual(mockData);
  });

  it("should refresh token and retry on 401 error", async () => {
    // Arrange
    (cookies as jest.Mock).mockResolvedValue({
      get: jest.fn((key: string) => {
        if (key === "access_token") return { value: "expired-access-token" };
        if (key === "refresh_token") return { value: "valid-refresh-token" };
        return undefined;
      }),
      set: jest.fn().mockImplementation(() => {}),
      delete: jest.fn().mockImplementation(() => {}),
    });
    const mockData = { data: "retry-success" };

    server.use(
      // Initial request returns 401
      http.get(
        `${serverAddress}/test-endpoint`,
        () => {
          return HttpResponse.json({}, { status: 401 });
        },
        {
          once: true,
        }
      ),
      // Refresh token endpoint returns new tokens
      http.post(`${serverAddress}/auth/refresh`, () => {
        return HttpResponse.json(
          {
            access_token: "new-access-token",
            refresh_token: "new-refresh-token",
          },
          { status: 200 }
        );
      }),
      // Retry request with new token succeeds
      http.get(`${serverAddress}/test-endpoint`, () => {
        return HttpResponse.json(mockData, { status: 200 });
      })
    );

    // Act
    const response = await authenticatedFetch(`${serverAddress}/test-endpoint`);
    const result = await response.json();

    // Assert
    expect(result).toEqual(mockData);

    const cookieStore = await cookies();

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

  it("should throw InvalidJwtTokenError if token refresh fails", async () => {
    // Arrange
    (cookies as jest.Mock).mockResolvedValue({
      get: jest.fn((key: string) => {
        if (key === "access_token") return { value: "expired-access-token" };
        if (key === "refresh_token") return { value: "expired-refresh-token" };
        return undefined;
      }),
      set: jest.fn().mockImplementation(() => {}),
      delete: jest.fn().mockImplementation(() => {}),
    });

    server.use(
      // Initial request returns 401
      http.get(`${serverAddress}/test-endpoint`, () => {
        return HttpResponse.json({}, { status: 401 });
      }),

      // Refresh token endpoint returns 401
      http.post(`${serverAddress}/auth/refresh`, () => {
        return HttpResponse.json({}, { status: 401 });
      })
    );

    const expectedError = createError(
      "InvalidJwtToken",
      "Refreshing Token causes error."
    );
    // Act & Assert
    await expect(
      authenticatedFetch(`${serverAddress}/test-endpoint`)
    ).rejects.toMatchObject({
      type: expectedError.type,
      message: expectedError.message,
    });
  });

  it("should throw error for non-401 HTTP errors after token refresh", async () => {
    // Arrange
    // Initial request returns 401
    server.use(
      http.get(`${serverAddress}/test-endpoint`, () => {
        return HttpResponse.json({}, { status: 401 });
      })
    );
    // Refresh token succeeds
    server.use(
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
    // Retry request returns 500
    server.use(
      http.get(`${serverAddress}/test-endpoint`, () => {
        return HttpResponse.json({}, { status: 500 });
      })
    );

    // Act & Assert
    await expect(
      authenticatedFetch(`${serverAddress}/test-endpoint`)
    ).rejects.toThrow("HTTP Error: 500 - Internal Server Error");
  });

  it("should throw error for non-401 HTTP errors", async () => {
    // Arrange
    server.use(
      http.get(`${serverAddress}/test-endpoint`, () => {
        return HttpResponse.json({}, { status: 403 });
      })
    );

    // Act & Assert
    await expect(
      authenticatedFetch(`${serverAddress}/test-endpoint`)
    ).rejects.toThrow("HTTP Error: 403 - Forbidden");
  });

  it("should throw ConflictCustomError for 409 conflict error", async () => {
    const expectedError = createError("ConflictError", "This conflict error");

    server.use(
      http.get(`${serverAddress}/test-endpoint`, () => {
        return HttpResponse.json(
          { message: expectedError.message },
          { status: 409 }
        );
      })
    );

    await expect(
      authenticatedFetch(`${serverAddress}/test-endpoint`)
    ).rejects.toMatchObject({
      type: expectedError.type,
      message: expectedError.message,
    });
  });
});
