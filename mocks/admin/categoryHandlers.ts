// mocks/admin/categoryHandlers.ts
import { http, HttpResponse } from "msw";
import { serverAddress } from "../../lib/util";
import {
  CategoryDetail,
  CreateCategorySchema,
  UpdateCategorySchema,
} from "../../lib/definition/adminCategoryManagementSchema";

// 테스트용 카테고리 데이터
export const mockCategories: CategoryDetail[] = [
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

// 중복 체크용 슬러그 저장소
const usedSlugs = new Set<string>(["tech", "free"]);

export const adminCategoryHandlers = [
  // GET /admin/categories - 카테고리 목록 조회
  http.get(`${serverAddress}/admin/categories`, () => {
    return HttpResponse.json(mockCategories, { status: 200 });
  }),

  // POST /admin/categories - 카테고리 생성
  http.post(`${serverAddress}/admin/categories`, async ({ request }) => {
    const body = await request.json();
    const result = CreateCategorySchema.safeParse(body);

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
          message: "이미 사용 중인 카테고리 이름입니다",
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
          message: `이미 사용 중인 슬러그가 있습니다: ${duplicateSlugs.join(
            ", "
          )}`,
          error: "Bad Request",
        },
        { status: 400 }
      );
    }

    // 새 카테고리 생성
    const newCategory: CategoryDetail = {
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

  // GET /admin/categories/:id - 카테고리 상세 조회
  http.get(`${serverAddress}/admin/categories/:id`, ({ params }) => {
    const id = Number(params.id);
    const category = mockCategories.find((cat) => cat.id === id);

    if (!category) {
      return HttpResponse.json(
        {
          message: "카테고리를 찾을 수 없습니다",
          error: "Not Found",
        },
        { status: 404 }
      );
    }

    return HttpResponse.json(category, { status: 200 });
  }),

  // PATCH /admin/categories/:id - 카테고리 수정
  http.patch(
    `${serverAddress}/admin/categories/:id`,
    async ({ request, params }) => {
      const id = Number(params.id);
      const body = await request.json();
      const result = UpdateCategorySchema.safeParse(body);

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
            message: "카테고리를 찾을 수 없습니다",
            error: "Not Found",
          },
          { status: 404 }
        );
      }

      const { name, allowedSlugs } = result.data;

      // 이름 변경 시 중복 체크
      if (name && name !== category.name) {
        if (mockCategories.some((cat) => cat.name === name)) {
          return HttpResponse.json(
            {
              message: "이미 사용 중인 카테고리 이름입니다",
              error: "Conflict",
            },
            { status: 409 }
          );
        }
        category.name = name;
      }

      // 슬러그 변경 시 중복 체크
      if (allowedSlugs) {
        if (allowedSlugs.length === 0) {
          return HttpResponse.json(
            {
              message: "최소 1개 이상의 슬러그가 필요합니다",
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
              message: `이미 사용 중인 슬러그가 있습니다: ${duplicateSlugs.join(
                ", "
              )}`,
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
      }

      return HttpResponse.json(category, { status: 200 });
    }
  ),

  // DELETE /admin/categories/:id - 카테고리 삭제
  http.delete(`${serverAddress}/admin/categories/:id`, ({ params }) => {
    const id = Number(params.id);
    const index = mockCategories.findIndex((cat) => cat.id === id);

    if (index === -1) {
      return HttpResponse.json(
        {
          message: "카테고리를 찾을 수 없습니다",
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

  // GET /admin/categories/:id/validate-slug - 슬러그 중복 검증
  http.get(
    `${serverAddress}/admin/categories/:id/validate-slug`,
    ({ params, request }) => {
      const categoryId = Number(params.id);
      const url = new URL(request.url);
      const slug = url.searchParams.get("slug");

      if (!slug) {
        return HttpResponse.json(
          {
            message: "slug 파라미터가 필요합니다",
            error: "Bad Request",
          },
          { status: 400 }
        );
      }

      const isUsed =
        usedSlugs.has(slug) &&
        !mockCategories
          .find((cat) => cat.id === categoryId)
          ?.allowedSlugs.includes(slug);

      return HttpResponse.json(
        { isUsedInOtherCategory: isUsed },
        { status: 200 }
      );
    }
  ),
];
