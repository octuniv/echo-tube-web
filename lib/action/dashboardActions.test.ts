import { server } from "../../mocks/server";
import { mockDashboardSummary } from "../../mocks/handlers/dashboardHandlers";
import { mockPosts } from "../../mocks/handlers/postHandlers";
import { http, HttpResponse } from "msw";
import { BASE_API_URL } from "../util";
import { FetchDashboardSummary } from "./dashboardActions";

describe("dashboardActions Module", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    server.resetHandlers();
  });

  describe("FetchDashboardSummary", () => {
    const consoleErrorMock = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    afterEach(() => {
      consoleErrorMock.mockClear();
    });

    it("should fetch dashboard summary successfully", async () => {
      const result = await FetchDashboardSummary();
      expect(result).toEqual(mockDashboardSummary);
      expect(result.recentPosts).toBeInstanceOf(Array);
      expect(result.popularPosts).toBeInstanceOf(Array);
      expect(result.noticesPosts).toBeInstanceOf(Array);
    });

    it("should throw error when response is invalid", async () => {
      // invalid data (배열 대신 단일 객체 반환)
      const invalidData = {
        visitors: 150,
        recentPosts: mockPosts[0], // 배열이 아닌 단일 객체
        popularPosts: mockPosts[1],
        noticesPosts: mockPosts[0],
      };

      server.use(
        http.get(`${BASE_API_URL}/dashboard/summary`, () =>
          HttpResponse.json(invalidData, { status: 200 })
        )
      );

      await expect(FetchDashboardSummary()).rejects.toThrow(
        "Invalid data format for DashboardSummary"
      );
      expect(console.error).toHaveBeenCalled();
    });

    it("should throw error when server returns 500", async () => {
      server.use(
        http.get(`${BASE_API_URL}/dashboard/summary`, () =>
          HttpResponse.json({ error: "Internal Server Error" }, { status: 500 })
        )
      );

      await expect(FetchDashboardSummary()).rejects.toThrow(
        "Failed to fetch DashboardSummary"
      );
    });
  });
});
