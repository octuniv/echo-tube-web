import { BASE_API_URL } from "../../lib/util";
import { http, HttpResponse } from "msw";

export const userProfileHandlers = [
  // Mock API for delete user
  http.delete(`${BASE_API_URL}/users`, () => {
    return HttpResponse.json(
      { message: "Successfully deleted account" },
      { status: 200 }
    );
  }),

  // Mock API for update nickname
  http.patch(`${BASE_API_URL}/users/nickname`, () => {
    return HttpResponse.json(
      { message: "Nickname change successful." },
      { status: 200 }
    );
  }),
];
