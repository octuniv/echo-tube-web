import { UserRole } from "../../../lib/definition/enums";
import {
  AdminUserDetailResponse,
  AdminUserListPaginatedResponse,
} from "../../../lib/definition/admin/adminUserManagementSchema";
import { BASE_API_URL } from "../../../lib/util";
import { http, HttpResponse } from "msw";

export const mockUserList: AdminUserDetailResponse[] = [
  {
    id: 1,
    name: "John Doe",
    nickname: "johndoe123",
    email: "john@example.com",
    role: UserRole.USER,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    deletedAt: null,
  },
  {
    id: 2,
    name: "Jane Smith",
    nickname: "janesmith",
    email: "jane@example.com",
    role: UserRole.ADMIN,
    createdAt: "2024-01-02T00:00:00Z",
    updatedAt: "2024-01-02T00:00:00Z",
    deletedAt: "2024-01-03T00:00:00Z",
  },
];

export const mockSearchResults: AdminUserListPaginatedResponse = {
  data: mockUserList,
  currentPage: 1,
  totalItems: 2,
  totalPages: 1,
};

export const adminUserHandlers = [
  http.get(`${BASE_API_URL}/admin/users`, ({ request }) => {
    const url = new URL(request.url);
    const sort = url.searchParams.get("sort") || "createdAt";
    const order = url.searchParams.get("order") || "DESC";

    // Sort mock data based on parameters
    const sortedData = [...mockUserList].sort((a, b) => {
      const dateA = new Date(a[sort as keyof typeof a] as string).getTime();
      const dateB = new Date(b[sort as keyof typeof b] as string).getTime();
      return order === "ASC" ? dateA - dateB : dateB - dateA;
    });

    return HttpResponse.json(
      {
        ...mockSearchResults,
        data: sortedData,
      },
      { status: 200 }
    );
  }),

  // Add new mock for search endpoint
  http.get(`${BASE_API_URL}/admin/users/search`, ({ request }) => {
    const url = new URL(request.url);
    const searchEmail = url.searchParams.get("searchEmail");
    const searchNickname = url.searchParams.get("searchNickname");
    const searchRole = url.searchParams.get("searchRole");
    const sort = url.searchParams.get("sort") || "createdAt";
    const order = url.searchParams.get("order") || "DESC";

    // Filter mock data based on search criteria
    let filteredData = [...mockUserList];

    if (searchEmail) {
      filteredData = filteredData.filter((user) =>
        user.email.includes(searchEmail)
      );
    }

    if (searchNickname) {
      filteredData = filteredData.filter((user) =>
        user.nickname.includes(searchNickname)
      );
    }

    if (searchRole) {
      filteredData = filteredData.filter((user) => user.role === searchRole);
    }

    // Sort results
    const sortedData = filteredData.sort((a, b) => {
      const dateA = new Date(a[sort as keyof typeof a] as string).getTime();
      const dateB = new Date(b[sort as keyof typeof b] as string).getTime();
      return order === "ASC" ? dateA - dateB : dateB - dateA;
    });

    return HttpResponse.json(
      {
        ...mockSearchResults,
        data: sortedData,
        totalItems: sortedData.length,
      },
      { status: 200 }
    );
  }),

  http.patch(`${BASE_API_URL}/admin/users/:id`, async ({ request, params }) => {
    const url = new URL(request.url);
    const userId = Number(params.id);

    if (userId === 777) {
      // 삭제된 사용자 ID
      return HttpResponse.json(
        { message: "User not found. Please check the user ID." },
        { status: 404 }
      );
    }

    if (userId === 999) {
      return HttpResponse.json(
        { message: "This nickname already exists" },
        { status: 409 }
      );
    }

    if (userId === 888) {
      return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    return HttpResponse.json(
      {
        message: "User updated successfully",
        success: true,
        updatedFields: body,
      },
      { status: 200 }
    );
  }),

  http.get(`${BASE_API_URL}/admin/users/:id`, ({ params }) => {
    const userId = Number(params.id);

    // 예시 데이터
    const mockUserDetail = {
      id: userId,
      name: "John Doe",
      nickname: "johndoe123",
      email: "john.doe@example.com",
      role: UserRole.USER,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-02T00:00:00Z",
      deletedAt: null,
    } satisfies AdminUserDetailResponse;

    // 테스트용 특수 ID 처리
    if (userId === 777) {
      return HttpResponse.json(
        { message: "User not found. Please check the user ID." },
        { status: 404 }
      );
    }

    if (userId === 888) {
      return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // 기본 성공 응답
    return HttpResponse.json(mockUserDetail, { status: 200 });
  }),

  http.delete(`${BASE_API_URL}/admin/users/:id`, ({ params }) => {
    const userId = Number(params.id);

    // 테스트용 특수 ID 처리
    if (userId === 777) {
      // 삭제된 사용자 ID
      return HttpResponse.json(
        {
          message: "User not found. Please check the user ID.",
          success: false,
        },
        { status: 404 }
      );
    }

    if (userId === 888) {
      // 권한 없음
      return HttpResponse.json(
        { message: "Unauthorized", success: false },
        { status: 401 }
      );
    }

    if (userId === 999) {
      // 서버 오류
      return HttpResponse.json(
        { message: "Internal Server Error", success: false },
        { status: 500 }
      );
    }

    // 기본 성공 응답
    return HttpResponse.json(
      {
        message: "Successfully deleted user",
        success: true,
      },
      { status: 200 }
    );
  }),
];
