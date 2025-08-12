import { BASE_API_URL } from "../../lib/util";
import { http, HttpResponse } from "msw";
import { BoardPurpose } from "../../lib/definition/enums";
import { CategoryWithBoardsResponse } from "../../lib/definition/boardBrowseSchemas";

export const mockCategoriesWithBoards: CategoryWithBoardsResponse = [
  {
    name: "Technology",
    boardGroups: [
      {
        purpose: BoardPurpose.GENERAL,
        boards: [
          {
            id: 1,
            slug: "ai",
            name: "AI Discussion",
          },
        ],
      },
    ],
  },
  {
    name: "General",
    boardGroups: [
      {
        purpose: BoardPurpose.GENERAL,
        boards: [
          {
            id: 2,
            slug: "free",
            name: "Free Discussion",
          },
        ],
      },
    ],
  },
];

export const boardBrowseHandlers = [
  http.get(`${BASE_API_URL}/boards`, () => {
    return HttpResponse.json([{ id: 1, slug: "free", name: "자유 게시판" }], {
      status: 200,
    });
  }),

  http.get(`${BASE_API_URL}/categories/with-boards`, () => {
    return HttpResponse.json(mockCategoriesWithBoards, { status: 200 });
  }),
];
