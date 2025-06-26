import { test, expect, Cookie } from "@playwright/test";
import { expectCookiesToNotExist } from "./util/test-utils";
import { serverAddress } from "@/lib/util";

test.describe("Logout Button", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
    await page.reload();
    await page.waitForURL("/dashboard", { timeout: 5000 });
  });

  test("should logout and invalidate refresh_token on the server", async ({
    page,
    context,
    request,
  }) => {
    let cookies: Cookie[];
    let refreshToken: string;

    // 1. 초기 로그인 상태 확인
    await page.goto("/dashboard");
    await page.waitForURL("/dashboard", { timeout: 5000 });
    await expect(page.getByLabel("Login")).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();

    // 2. 현재 refresh_token 쿠키 저장
    cookies = await context.cookies();
    const refreshTokenCookie = cookies.find((c) => c.name === "refresh_token");
    expect(refreshTokenCookie).toBeDefined();
    refreshToken = refreshTokenCookie!.value;

    // 3. 로그아웃 버튼 클릭
    await page.getByRole("button", { name: "Logout" }).click();

    // 4. 로그인 페이지로 리다이렉트 확인
    await expect(page).toHaveURL("/login");

    // 5. 쿠키 삭제 확인
    cookies = await context.cookies();
    expectCookiesToNotExist(cookies, ["access_token", "refresh_token", "user"]);

    // 6. 로그아웃 상태 적용 확인
    await expect(page.getByLabel("Login")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Logout" })
    ).not.toBeVisible();

    // 7. 무효화된 refresh_token 사용 시도
    const response = await request.post(`${serverAddress}/auth/refresh`, {
      data: {
        refresh_token: refreshToken,
      },
    });

    // 8. 401(Unauthorized) 응답 확인
    expect(response.status()).toBe(401);
    const responseBody = await response.json();
    expect(responseBody.message).toBe("Invalid refresh token");
  });
});
