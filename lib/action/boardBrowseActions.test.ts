import { http, HttpResponse } from "msw";
import { server } from "../../mocks/server";
import { mockCategoriesWithBoards } from "../../mocks/handlers/boardBrowseHandlers";
import { BoardPurpose, UserRole } from "../definition/enums";
import { BoardListItemDto } from "../definition/boardBrowseSchemas";
import { BASE_API_URL } from "../util";
import {
  FetchAllBoards,
  FetchCategoriesWithBoards,
} from "./boardBrowseActions";

describe("Actions Module", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    server.resetHandlers();
  });

  describe("FetchAllBoards", () => {
    const consoleErrorMock = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    afterEach(() => {
      consoleErrorMock.mockClear();
    });

    it("should fetch all boards successfully", async () => {
      const mockBoards: BoardListItemDto[] = [
        {
          id: 1,
          slug: "free",
          name: "General",
          requiredRole: UserRole.USER,
          boardType: BoardPurpose.GENERAL,
        },
        {
          id: 2,
          slug: "qna",
          name: "Q&A",
          requiredRole: UserRole.USER,
          boardType: BoardPurpose.GENERAL,
        },
      ];

      server.use(
        http.get(`${BASE_API_URL}/boards`, () =>
          HttpResponse.json(mockBoards, { status: 200 })
        )
      );

      const boards = await FetchAllBoards();
      expect(boards).toEqual(mockBoards);
      expect(boards[0]).toHaveProperty("id");
      expect(boards[0]).toHaveProperty("slug");
      expect(boards[0]).toHaveProperty("name");
    });

    it("should throw error on failure", async () => {
      server.use(
        http.get(`${BASE_API_URL}/boards`, () =>
          HttpResponse.json({ error: "Internal Server Error" }, { status: 500 })
        )
      );

      await expect(FetchAllBoards()).rejects.toThrow("Failed to fetch boards");
    });

    it("should return empty array when board data is invalid", async () => {
      const invalidBoards = [
        {
          id: 1,
          slug: "free",
          name: "General",
          // requiredRole이 유효하지 않은 값
          requiredRole: "invalid-role",
        },
      ];
      server.use(
        http.get(`${BASE_API_URL}/boards`, () =>
          HttpResponse.json(invalidBoards, { status: 200 })
        )
      );
      const boards = await FetchAllBoards();
      expect(boards).toEqual([]); // Zod 검증 실패 시 빈 배열 반환
      expect(console.error).toHaveBeenCalled(); // 에러 로깅 확인
    });
  });

  describe("FetchCategoriesWithBoards", () => {
    const consoleErrorMock = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    afterEach(() => {
      consoleErrorMock.mockClear();
    });

    it("should fetch categories with boards successfully", async () => {
      const result = await FetchCategoriesWithBoards();
      expect(result).toEqual(mockCategoriesWithBoards);
      expect(result.length).toBe(2);
      expect(result[0].boardGroups[0].boards[0].slug).toBe("ai");
    });

    it("should throw error when response is invalid", async () => {
      // Mock invalid response format
      server.use(
        http.get(`${BASE_API_URL}/categories/with-boards`, () => {
          return HttpResponse.json([{ invalid: "data" }], { status: 200 });
        })
      );

      await expect(FetchCategoriesWithBoards()).resolves.toEqual([]);
      expect(consoleErrorMock).toHaveBeenCalled();
    });

    it("should handle server error", async () => {
      server.use(
        http.get(`${BASE_API_URL}/categories/with-boards`, () => {
          return HttpResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
          );
        })
      );

      await expect(FetchCategoriesWithBoards()).resolves.toEqual([]);
      expect(consoleErrorMock).toHaveBeenCalled();
    });

    it("should handle empty response", async () => {
      server.use(
        http.get(`${BASE_API_URL}/categories/with-boards`, () => {
          return HttpResponse.json([], { status: 200 });
        })
      );

      const result = await FetchCategoriesWithBoards();
      expect(result).toEqual([]);
      expect(consoleErrorMock).not.toHaveBeenCalled();
    });
  });
});
