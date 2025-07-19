import { test, expect, BrowserContext, Page } from "@playwright/test";
import { withTemporaryLogout } from "../util/helper";
import { loginAsAdminIsolated } from "../util/auth-utils";
import { generateAdminUrls } from "../util/adminRoutes";

// 테스트 대상 admin 페이지 목록
const adminPages = generateAdminUrls();

adminPages.forEach((pageUrl) => {
  test.describe(`Admin Page Access - ${pageUrl}`, () => {
    test(`일반 회원 접근 시 forbidden 페이지로 리다이렉트 - ${pageUrl}`, async ({
      page,
    }) => {
      await page.goto(pageUrl);
      await page.waitForURL("/forbidden", { timeout: 5000 });
    });

    test(`비로그인 상태 접근 시 로그아웃으로 리다이렉트 및 세션 아웃 메세지 표시 - ${pageUrl}`, async ({
      page,
    }) => {
      await withTemporaryLogout(page, async () => {
        await page.goto(pageUrl);
        await page.waitForURL("/login?error=session_expired", {
          timeout: 5000,
        });
      });
    });

    test(`관리자 접근 시 리다이렉트 없음 - ${pageUrl}`, async ({ browser }) => {
      let context: BrowserContext | undefined;
      let page: Page | undefined;

      try {
        const result = await loginAsAdminIsolated(browser);
        context = result.context;
        page = result.page;

        await page.goto(pageUrl);
        await expect(page).toHaveURL(pageUrl);
      } catch (error) {
        test.fail();
      } finally {
        if (context) {
          await context.close();
        }
      }
    });
  });
});
