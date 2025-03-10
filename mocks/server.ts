// mocks/server.ts

import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { serverAddress } from "../lib/util";
import { PostDto } from "@/lib/definition";

export const mockPosts: PostDto[] = [
  {
    id: 1,
    title: "Post 1",
    content: "Content of Post 1",
    videoUrl: "https://example.com/video1",
    nickname: "UserA",
    createdAt: "2023-10-01T12:00:00Z",
    updatedAt: "2023-10-01T12:00:00Z",
  },
  {
    id: 2,
    title: "Post 2",
    content: "Content of Post 2",
    videoUrl: undefined,
    nickname: "UserB",
    createdAt: "2023-09-30T12:00:00Z",
    updatedAt: "2023-09-30T12:00:00Z",
  },
];

export const mockEditPostForm = {
  title: "Changed",
  content: "Content of Changed",
  videoUrl: "https://example.com/changed",
};

export const server = setupServer(
  // Mock API for user sign-up
  http.post(`${serverAddress}/users`, () => {
    return HttpResponse.json({ success: true }, { status: 200 });
  }),

  // Mock API for login
  http.post(`${serverAddress}/auth/login`, () => {
    return HttpResponse.json(
      {
        access_token: "valid-access-token",
        refresh_token: "valid-refresh-token",
        name: "John Doe",
        nickname: "John",
        email: "john@example.com",
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
  }),

  // Mock API for fetch post
  http.get(`${serverAddress}/posts/:id`, ({ params }) => {
    const postId = Number(params.id);

    if (postId === 1) {
      return HttpResponse.json(
        {
          id: 1,
          title: "Post 1",
          content: "Content of Post 1",
          videoUrl: "https://example.com/video1",
          nickname: "UserA",
          createdAt: "2023-10-01T12:00:00Z",
          updatedAt: "2023-10-01T12:00:00Z",
        },
        { status: 200 }
      );
    }

    return HttpResponse.json({ error: "Post not found" }, { status: 404 });
  }),

  // Mock API for authenicatedFetch
  http.get("https://example.com", () => {
    return HttpResponse.json({}, { status: 200 });
  }),

  // Mock API for delete post
  http.delete(`${serverAddress}/posts/:id`, () => {
    return HttpResponse.json(
      { message: "Post deleted successfully." },
      { status: 200 }
    );
  }),

  // Mock API for edit post
  http.patch(`${serverAddress}/posts/:id`, () => {
    return HttpResponse.json(
      { ...mockPosts[0], ...mockEditPostForm },
      { status: 200 }
    );
  }),

  // Mock API for delete user
  http.delete(`${serverAddress}/users`, () => {
    return HttpResponse.json(
      { message: "Successfully deleted account" },
      { status: 200 }
    );
  }),

  // Mock API for update nickname
  http.patch(`${serverAddress}/users/nickname`, () => {
    return HttpResponse.json(
      { message: "Nickname change successful." },
      { status: 200 }
    );
  }),

  // Mock API for testing authenticatedFetch
  http.get(`${serverAddress}/test-endpoint`, () => {
    return HttpResponse.json({ data: "success" }, { status: 200 });
  })
);
