// mocks/admin/categoryHandlers.ts
import { http, HttpResponse } from "msw";
import { BASE_API_URL } from "../../../lib/util";
import {
  BoardSummary,
  CategoryDetails,
  CategorySummary,
  CategoryFormValidationSchema,
  SLUG_REGEX,
  AvailableCategoriesResponse,
} from "../../../lib/definition/adminCategoryManagementSchema";
import { BoardPurpose, UserRole } from "../../../lib/definition";
import { CATEGORY_ERROR_MESSAGES } from "../../../lib/constants/category/errorMessage";

// 테스트용 카테고리 데이터
export const mockCategories: CategorySummary[] = [
  {
    id: 1,
    name: "Technology",
    allowedSlugs: ["tech", "innovation"],
    boardIds: [101, 102],
  },
  {
    id: 2,
    name: "General",
    allowedSlugs: ["free", "discussion"],
    boardIds: [201],
  },
];

const mockBoards: BoardSummary[] = [
  {
    id: 101,
    slug: "tech-discussion",
    name: "Technology Discussion",
    type: BoardPurpose.GENERAL,
    requiredRole: UserRole.USER,
  },
  {
    id: 102,
    slug: "ai-research",
    name: "AI Research",
    type: BoardPurpose.AI_DIGEST,
    requiredRole: UserRole.ADMIN,
  },
  {
    id: 201,
    slug: "general-chat",
    name: "General Chat",
    type: BoardPurpose.GENERAL,
    requiredRole: UserRole.USER,
  },
];

// 중복 체크용 슬러그 저장소
const usedSlugs = new Set<string>(["tech", "free"]);

export const availableCategoriesMock: AvailableCategoriesResponse = [
  {
    id: 1,
    name: "Technology",
    availableSlugs: [{ slug: "tech" }, { slug: "innovation" }],
  },
  {
    id: 2,
    name: "General",
    availableSlugs: [{ slug: "free" }, { slug: "discussion" }],
  },
];

export const adminCategoryHandlers = [
  // GET /admin/categories - 카테고리 목록 조회
  http.get(`${BASE_API_URL}/admin/categories`, () => {
    return HttpResponse.json(mockCategories, { status: 200 });
  }),

  // POST /admin/categories - 카테고리 생성
  http.post(`${BASE_API_URL}/admin/categories`, async ({ request }) => {
    const body = await request.json();
    const result = CategoryFormValidationSchema.safeParse(body);

    if (!result.success) {
      return HttpResponse.json(
        {
          message: "유효성 검증 실패",
          error: result.error.format(),
        },
        { status: 400 }
      );
    }

    const { name, allowedSlugs } = result.data;

    // 이름 중복 체크
    if (mockCategories.some((cat) => cat.name === name)) {
      return HttpResponse.json(
        {
          message: CATEGORY_ERROR_MESSAGES.DUPLICATE_CATEGORY_NAME,
          error: "Conflict",
        },
        { status: 409 }
      );
    }

    // 슬러그 중복 체크
    const duplicateSlugs = allowedSlugs.filter((slug) => usedSlugs.has(slug));
    if (duplicateSlugs.length > 0) {
      return HttpResponse.json(
        {
          message: CATEGORY_ERROR_MESSAGES.DUPLICATE_SLUGS(duplicateSlugs),
          error: "Bad Request",
        },
        { status: 400 }
      );
    }

    // 유효하지 않은 슬러그 체크
    const invalidSlugs = allowedSlugs.filter((slug) => !SLUG_REGEX.test(slug));
    if (invalidSlugs.length > 0) {
      return HttpResponse.json(
        {
          message: CATEGORY_ERROR_MESSAGES.INVALID_SLUGS,
          error: "Bad Request",
        },
        { status: 400 }
      );
    }

    // 새 카테고리 생성
    const newCategory: CategorySummary = {
      id: mockCategories.length + 1,
      name,
      allowedSlugs,
      boardIds: [],
    };

    // 슬러그 등록
    allowedSlugs.forEach((slug) => usedSlugs.add(slug));
    mockCategories.push(newCategory);

    return HttpResponse.json(newCategory, { status: 201 });
  }),

  // GET /admin/categories/available - 사용 가능한 카테고리 조회
  http.get(`${BASE_API_URL}/admin/categories/available`, ({ request }) => {
    const url = new URL(request.url);
    const boardId = url.searchParams.get("boardId");

    if (boardId && isNaN(Number(boardId))) {
      return HttpResponse.json(
        {
          message: "boardId must be a number",
          error: "Bad Request",
        },
        { status: 400 }
      );
    }

    // 실제 API 응답 구조와 일치하도록 변환
    const response = availableCategoriesMock;

    return HttpResponse.json(response, { status: 200 });
  }),

  // GET /admin/categories/:id - 카테고리 상세 조회
  http.get(`${BASE_API_URL}/admin/categories/:id`, ({ params }) => {
    const id = Number(params.id);
    const category = mockCategories.find((cat) => cat.id === id);

    if (!category) {
      return HttpResponse.json(
        {
          message: CATEGORY_ERROR_MESSAGES.CATEGORY_NOT_FOUND,
          error: "Not Found",
        },
        { status: 404 }
      );
    }

    const associatedBoards = mockBoards.filter((board) =>
      category.boardIds.includes(board.id)
    );

    // Create CategoryDetails response
    const categoryDetails: CategoryDetails = {
      ...category,
      boards: associatedBoards,
      createdAt: new Date("2023-01-01T00:00:00Z").toISOString(),
      updatedAt: new Date("2024-01-01T00:00:00Z").toISOString(),
    };

    return HttpResponse.json(categoryDetails, { status: 200 });
  }),

  // PUT /admin/categories/:id - 카테고리 수정
  http.put(
    `${BASE_API_URL}/admin/categories/:id`,
    async ({ request, params }) => {
      const id = Number(params.id);
      const body = await request.json();
      const result = CategoryFormValidationSchema.safeParse(body);

      if (!result.success) {
        return HttpResponse.json(
          {
            message: "유효성 검증 실패",
            error: result.error.format(),
          },
          { status: 400 }
        );
      }

      const category = mockCategories.find((cat) => cat.id === id);
      if (!category) {
        return HttpResponse.json(
          {
            message: CATEGORY_ERROR_MESSAGES.CATEGORY_NOT_FOUND,
            error: "Not Found",
          },
          { status: 404 }
        );
      }

      const { name, allowedSlugs } = result.data;

      // 이름 변경 시 중복 체크
      if (name !== category.name) {
        if (mockCategories.some((cat) => cat.name === name)) {
          return HttpResponse.json(
            {
              message: CATEGORY_ERROR_MESSAGES.DUPLICATE_CATEGORY_NAME,
              error: "Conflict",
            },
            { status: 409 }
          );
        }
        category.name = name;
      }

      if (allowedSlugs.length === 0) {
        return HttpResponse.json(
          {
            message: CATEGORY_ERROR_MESSAGES.SLUGS_REQUIRED,
            error: "Bad Request",
          },
          { status: 400 }
        );
      }

      const duplicateSlugs = allowedSlugs.filter(
        (slug) => usedSlugs.has(slug) && !category.allowedSlugs.includes(slug)
      );

      if (duplicateSlugs.length > 0) {
        return HttpResponse.json(
          {
            message: CATEGORY_ERROR_MESSAGES.DUPLICATE_SLUGS(duplicateSlugs),
            error: "Bad Request",
          },
          { status: 400 }
        );
      }

      // 유효하지 않은 슬러그 체크
      const invalidSlugs = allowedSlugs.filter(
        (slug) => !SLUG_REGEX.test(slug)
      );
      if (invalidSlugs.length > 0) {
        return HttpResponse.json(
          {
            message: CATEGORY_ERROR_MESSAGES.INVALID_SLUGS,
            error: "Bad Request",
          },
          { status: 400 }
        );
      }

      // 기존 슬러그 제거
      category.allowedSlugs.forEach((slug) => usedSlugs.delete(slug));
      // 새 슬러그 등록
      allowedSlugs.forEach((slug) => usedSlugs.add(slug));
      category.allowedSlugs = allowedSlugs;

      return HttpResponse.json(category, { status: 200 });
    }
  ),

  // DELETE /admin/categories/:id - 카테고리 삭제
  http.delete(`${BASE_API_URL}/admin/categories/:id`, ({ params }) => {
    const id = Number(params.id);
    const index = mockCategories.findIndex((cat) => cat.id === id);

    if (index === -1) {
      return HttpResponse.json(
        {
          message: CATEGORY_ERROR_MESSAGES.CATEGORY_NOT_FOUND,
          error: "Not Found",
        },
        { status: 404 }
      );
    }

    // 슬러그 제거
    mockCategories[index].allowedSlugs.forEach((slug) =>
      usedSlugs.delete(slug)
    );
    mockCategories.splice(index, 1);

    return HttpResponse.json({ message: "삭제 성공" }, { status: 200 });
  }),

  // GET /admin/categories/validate-slug - 슬러그 중복 검증
  http.get(`${BASE_API_URL}/admin/categories/validate-slug`, ({ request }) => {
    const url = new URL(request.url);
    const slug = url.searchParams.get("slug");
    const categoryId = url.searchParams.get("categoryId");

    if (!slug) {
      return HttpResponse.json({ error: "slug required" }, { status: 400 });
    }

    const isUsed =
      usedSlugs.has(slug) &&
      (!categoryId ||
        !mockCategories.some(
          (cat) =>
            cat.id === Number(categoryId) && cat.allowedSlugs.includes(slug)
        ));

    return HttpResponse.json({ isUsed }, { status: 200 });
  }),

  // GET /admin/categories/validate-name - 카테고리 이름 중복 검증
  http.get(`${BASE_API_URL}/admin/categories/validate-name`, ({ request }) => {
    const url = new URL(request.url);
    const name = url.searchParams.get("name");
    const categoryId = url.searchParams.get("categoryId");

    if (!name) {
      return HttpResponse.json(
        { error: "name should not be empty" },
        { status: 400 }
      );
    }

    const isUsed = mockCategories.some((cat) => {
      if (categoryId && cat.id === Number(categoryId)) {
        return false;
      }
      return cat.name === name;
    });

    return HttpResponse.json({ isUsed }, { status: 200 });
  }),
];
