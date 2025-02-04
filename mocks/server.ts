// mocks/server.ts

import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { serverAddress, thisBaseUrl } from "../lib/util";

export const server = setupServer(
  // Mock API for user sign-up
  http.post(`${serverAddress}/users`, () => {
    return HttpResponse.json({ success: true }, { status: 200 });
  }),

  // Mock API for login
  http.post(`${thisBaseUrl}/api/login`, () => {
    return HttpResponse.json(
      {
        access_token: "valid-access-token",
        refresh_token: "valid-refresh-token",
      },
      { status: 200 }
    );
  }),

  // Mock API for token validation
  http.get(`${serverAddress}/auth/validate-token`, () => {
    return HttpResponse.json({ valid: true }, { status: 200 });
  }),

  // Mock API for token refresh
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
