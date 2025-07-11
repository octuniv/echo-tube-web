// mocks/admin/boardHandlers.ts
import { BoardPurpose, UserRole } from "../../lib/definition";
import { BOARD_ERROR_MESSAGES } from "../../lib/constants/board/errorMessage";
import { http, HttpResponse } from "msw";
import { serverAddress } from "../../lib/util";
import {
  AdminBoardResponse,
  BoardFormSchema,
} from "../../lib/definition/adminBoardManagementSchema";

export const mockBoards: AdminBoardResponse[] = [
  {
    id: 1,
    slug: "general",
    name: "General Discussion",
    description: "General discussion board",
    requiredRole: UserRole.USER,
    type: BoardPurpose.GENERAL,
    categoryId: 1,
    categoryName: "test",
    deletedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const categorySlugs = [
  [],
  ["general", "ai", "used"],
  ["free", "notice", "used1"],
];

export const usedSlugs = new Set<string>(["used", "used1"]);

export const adminBoardHandlers = [
  // GET /admin/boards
  http.get(`${serverAddress}/admin/boards`, () => {
    return HttpResponse.json(
      mockBoards.filter((board) => !board.deletedAt),
      { status: 200 }
    );
  }),

  // GET /admin/boards/:id
  http.get(`${serverAddress}/admin/boards/:id`, ({ params }) => {
    const id = Number(params.id);
    const board = mockBoards.find((b) => b.id === id && !b.deletedAt);
    if (!board) {
      return HttpResponse.json(
        { error: BOARD_ERROR_MESSAGES.NOT_FOUND_BOARD },
        { status: 404 }
      );
    }
    return HttpResponse.json(board, { status: 200 });
  }),

  // POST /admin/boards
  http.post(`${serverAddress}/admin/boards`, async ({ request }) => {
    const body = await request.json();
    const result = BoardFormSchema.safeParse(body);

    if (!result.success) {
      return HttpResponse.json(
        {
          message: "Validation failed",
          error: result.error.format(),
        },
        { status: 400 }
      );
    }

    const { slug, categoryId, type, requiredRole } = result.data;

    // 슬러그 중복 체크
    if (usedSlugs.has(slug)) {
      return HttpResponse.json(
        { message: BOARD_ERROR_MESSAGES.DUPLICATE_SLUG(slug) },
        { status: 400 }
      );
    }

    // 카테고리 슬러그 허용 체크
    if (!categorySlugs[categoryId]?.includes(slug)) {
      return HttpResponse.json(
        { message: BOARD_ERROR_MESSAGES.SLUG_NOT_ALLOWED_IN_CATEGORY(slug) },
        { status: 400 }
      );
    }

    // AI_DIGEST 권한 체크
    if (type === BoardPurpose.AI_DIGEST && requiredRole === UserRole.USER) {
      return HttpResponse.json(
        { message: BOARD_ERROR_MESSAGES.NOT_ALLOWED_BOARD_TYPE },
        { status: 400 }
      );
    }

    // 새 게시판 생성
    const newBoard = {
      id: mockBoards.length + 1,
      ...result.data,
      description: result.data?.description ?? "",
      requiredRole: result.data?.requiredRole ?? UserRole.USER,
      type: result.data?.type ?? BoardPurpose.GENERAL,
      categoryName: "test",
      deletedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockBoards.push(newBoard);
    usedSlugs.add(slug);

    return HttpResponse.json(newBoard, { status: 201 });
  }),

  // PUT /admin/boards/:id
  http.put(`${serverAddress}/admin/boards/:id`, async ({ request, params }) => {
    const id = Number(params.id);
    const body = await request.json();
    const result = BoardFormSchema.safeParse(body);

    if (!result.success) {
      return HttpResponse.json(
        {
          message: "Validation failed",
          error: result.error.format(),
        },
        { status: 400 }
      );
    }

    const boardIndex = mockBoards.findIndex((b) => b.id === id && !b.deletedAt);
    if (boardIndex === -1) {
      return HttpResponse.json(
        { message: BOARD_ERROR_MESSAGES.NOT_FOUND_BOARD },
        { status: 404 }
      );
    }

    const { slug, categoryId, type, requiredRole } = result.data;
    const existingBoard = mockBoards[boardIndex];

    // 슬러그 변경 시 중복 체크
    if (slug && slug !== existingBoard.slug) {
      if (usedSlugs.has(slug)) {
        return HttpResponse.json(
          { message: BOARD_ERROR_MESSAGES.DUPLICATE_SLUG(slug) },
          { status: 400 }
        );
      }

      // 카테고리 슬러그 허용 체크
      if (!categorySlugs[categoryId]?.includes(slug)) {
        return HttpResponse.json(
          { message: BOARD_ERROR_MESSAGES.SLUG_NOT_ALLOWED_IN_CATEGORY(slug) },
          { status: 400 }
        );
      }
    }

    // AI_DIGEST 권한 체크
    if (
      (type ?? existingBoard.type) === BoardPurpose.AI_DIGEST &&
      (requiredRole ?? existingBoard.requiredRole) === UserRole.USER
    ) {
      return HttpResponse.json(
        { message: BOARD_ERROR_MESSAGES.NOT_ALLOWED_BOARD_TYPE },
        { status: 400 }
      );
    }

    // 기존 슬러그 제거
    if (slug && slug !== existingBoard.slug) {
      usedSlugs.delete(existingBoard.slug);
      usedSlugs.add(slug);
    }

    // 업데이트 적용
    const updatedBoard = {
      ...existingBoard,
      ...result.data,
      description: result.data?.description ?? "",
      updatedAt: new Date().toISOString(),
    };
    mockBoards[boardIndex] = updatedBoard;

    return HttpResponse.json(updatedBoard, { status: 200 });
  }),

  // DELETE /admin/boards/:id
  http.delete(`${serverAddress}/admin/boards/:id`, ({ params }) => {
    const id = Number(params.id);
    const boardIndex = mockBoards.findIndex((b) => b.id === id);

    if (boardIndex === -1) {
      return HttpResponse.json(
        { message: BOARD_ERROR_MESSAGES.NOT_FOUND_BOARD },
        { status: 404 }
      );
    }

    // 슬러그도 함께 제거
    const deletedBoard = mockBoards[boardIndex];
    usedSlugs.delete(deletedBoard.slug);

    // 배열에서 요소 제거
    mockBoards.splice(boardIndex, 1);

    // 204 No Content 반환
    return new HttpResponse(null, { status: 204 });
  }),
];
