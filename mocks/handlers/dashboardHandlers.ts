import { BASE_API_URL } from "../../lib/util";
import { http, HttpResponse } from "msw";
import { mockPosts } from "./postHandlers";

export const mockDashboardSummary = {
  visitors: 150,
  recentPosts: [mockPosts[0]],
  popularPosts: [mockPosts[1]],
  noticesPosts: [mockPosts[0]],
};

export const dashboardHandlers = [
  http.get(`${BASE_API_URL}/dashboard/summary`, () => {
    return HttpResponse.json(mockDashboardSummary, { status: 200 });
  }),
];
