import { test, expect } from "@playwright/test";
import { withTemporaryLogout } from "../util/helper";
import { loginAsAdminIsolated } from "../util/auth-utils";

// 테스트 대상 admin 페이지 목록
const adminPages = ["/admin/categories", "/admin/users", "/admin/boards"];

adminPages.forEach((pageUrl) => {
  test.describe(`Admin Page Access - ${pageUrl}`, () => {
    test("일반 회원 접근 시 홈으로 리다이렉트", async ({ page }) => {
      await page.goto(pageUrl);
      await expect(page).toHaveURL("/");
    });

    test("비로그인 상태 접근 시 홈으로 리다이렉트", async ({ page }) => {
      await withTemporaryLogout(page, async () => {
        await page.goto(pageUrl);
        await expect(page).toHaveURL("/");
      });
    });

    test("관리자 접근 시 리다이렉트 없음", async ({ browser }) => {
      const { context, page } = await loginAsAdminIsolated(browser);
      try {
        await page.goto("/admin/categories");
        await expect(page).toHaveURL("/admin/categories");
      } finally {
        await context.close(); // 테스트 종료 후 정리
      }
    });
  });
});
