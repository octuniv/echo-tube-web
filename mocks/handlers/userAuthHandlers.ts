import { LoginResponse } from "../../lib/definition/userAuthSchemas";
import { UserRole } from "../../lib/definition/enums";
import { BASE_API_URL } from "../../lib/util";
import { http, HttpResponse } from "msw";

export const userAuthHandlers = [
  // Mock API for user sign-up
  http.post(`${BASE_API_URL}/users`, () => {
    return HttpResponse.json({ success: true }, { status: 200 });
  }),

  // Mock API for login
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
      } satisfies LoginResponse,
      { status: 200 }
    );
  }),

  // Mock API for token refresh
  http.post(`${BASE_API_URL}/auth/refresh`, () => {
    return HttpResponse.json(
      {
        access_token: "new-access-token",
        refresh_token: "new-refresh-token",
      },
      { status: 200 }
    );
  }),

  // Mock API for testing checkEmailExists
  http.post(`${BASE_API_URL}/users/check-email`, () => {
    return HttpResponse.json({ exists: true }, { status: 200 });
  }),

  // Mock API for testing checkNicknameExists
  http.post(`${BASE_API_URL}/users/check-nickname`, () => {
    return HttpResponse.json({ exists: true }, { status: 200 });
  }),

  // Mock API for testing password
  http.patch(`${BASE_API_URL}/users/check-nickname`, () => {
    return HttpResponse.json(
      { message: "Passcode change successful." },
      { status: 200 }
    );
  }),

  // Mock API for testing logout
  http.post(`${BASE_API_URL}/auth/logout`, () => {
    return HttpResponse.json(
      { message: "Logged out successfully" },
      { status: 200 }
    );
  }),
];
