// mocks/server.ts

import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { BASE_API_URL } from "../lib/util";
import { adminBoardHandlers } from "./handlers/admin/boardHandlers";
import { adminCategoryHandlers } from "./handlers/admin/categoryHandlers";
import { adminUserHandlers } from "./handlers/admin/userHandlers";
import { userAuthHandlers } from "./handlers/userAuthHandlers";
import { userProfileHandlers } from "./handlers/userProfileHandlers";
import { postHandlers } from "./handlers/postHandlers";
import { boardBrowseHandlers } from "./handlers/boardBrowseHandlers";
import { dashboardHandlers } from "./handlers/dashboardHandlers";

export const server = setupServer(
  // Mock API for testing authenticatedFetch
  http.get(`${BASE_API_URL}/test-endpoint`, () => {
    return HttpResponse.json({ data: "success" }, { status: 200 });
  }),
  ...userAuthHandlers,
  ...userProfileHandlers,
  ...postHandlers,
  ...boardBrowseHandlers,
  ...dashboardHandlers,
  ...adminUserHandlers,
  ...adminCategoryHandlers,
  ...adminBoardHandlers
);
