// mocks/server.ts

import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { serverAddress, thisBaseUrl } from "../lib/util";
import { PostDto } from "@/lib/definition";

export const mockPosts: PostDto[] = [
  {
    id: 1,
    title: "Post 1",
    content: "Content of Post 1",
    videoUrl: "https://example.com/video1",
    nickName: "UserA",
    createdAt: "2023-10-01T12:00:00Z",
    updatedAt: "2023-10-01T12:00:00Z",
  },
  {
    id: 2,
    title: "Post 2",
    content: "Content of Post 2",
    videoUrl: undefined,
    nickName: "UserB",
    createdAt: "2023-09-30T12:00:00Z",
    updatedAt: "2023-09-30T12:00:00Z",
  },
];

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
  }),

  // Mock API for fetch posts
  http.get(`${serverAddress}/posts`, () => {
    return HttpResponse.json(mockPosts, { status: 200 });
  })
);
