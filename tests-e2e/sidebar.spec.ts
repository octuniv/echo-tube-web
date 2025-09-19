import { test, expect, BrowserContext, Page } from "@playwright/test";
import { withTemporaryLogout } from "./util/helper";
import { clickSideBarBoard } from "./util/test-utils";
import { loginAsAdminIsolated } from "./util/auth-utils";

const adminLinks = {
  "admin-users": "/admin/users",
  "admin-categories": "/admin/categories",
  "admin-boards": "/admin/boards",
  "admin-notices": "/admin/notices",
};

test.describe("Sidebar test", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should be accessible with all buttons, except for admin links, if user is logged in.", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Sidebar Activation" }).click();

    await expect(page.getByRole("link", { name: "dashboard" })).toBeVisible();
    await page.getByRole("link", { name: "dashboard" }).click();
    await expect(page).toHaveURL(`/dashboard`);

    await expect(page.getByRole("link", { name: "settings" })).toBeVisible();
    await page.getByRole("link", { name: "settings" }).click();
    await expect(page).toHaveURL(`/settings`);

    await expect(page.getByRole("link", { name: "messages" })).toBeVisible();
    await page.getByRole("link", { name: "messages" }).click();
    await page.waitForURL("/messages");

    await expect(
      page.getByRole("link", { name: "Sending message" })
    ).toBeVisible();
    await page.getByRole("link", { name: "Sending message" }).click();
    await page.waitForURL("/messages/new");

    let categoryName = "커뮤니티";
    let boardName = "자유 게시판";
    let boardSlug = "free";
    await clickSideBarBoard(page, categoryName, boardName, boardSlug);

    categoryName = "공지사항";
    boardName = "공지 게시판";
    boardSlug = "notices";
    await clickSideBarBoard(page, categoryName, boardName, boardSlug);

    for (const key of Object.keys(adminLinks)) {
      await expect(page.getByRole("link", { name: key })).not.toBeVisible();
    }
  });

  test("Only permitted buttons should be accessible in the logout state.", async ({
    page,
  }) => {
    await withTemporaryLogout(page, async (page) => {
      await page.goto("/");

      await expect(
        page.getByRole("link", { name: "dashboard" })
      ).not.toBeVisible();

      await expect(
        page.getByRole("link", { name: "settings" })
      ).not.toBeVisible();

      await expect(
        page.getByRole("link", { name: "messages" })
      ).not.toBeVisible();

      await expect(
        page.getByRole("link", { name: "Sending message" })
      ).not.toBeVisible();

      let categoryName = "커뮤니티";
      let boardName = "자유 게시판";
      let boardSlug = "free";
      await clickSideBarBoard(page, categoryName, boardName, boardSlug);

      categoryName = "공지사항";
      boardName = "공지 게시판";
      boardSlug = "notices";
      await clickSideBarBoard(page, categoryName, boardName, boardSlug);
    });
  });

  test("어드민은 사이드 바의 모든 링크가 보여야 함.", async ({ browser }) => {
    let context: BrowserContext | undefined;
    let page: Page | undefined;

    try {
      const result = await loginAsAdminIsolated(browser);
      context = result.context;
      page = result.page;

      await page.goto("/");
      await page.getByRole("button", { name: "Sidebar Activation" }).click();

      await expect(page.getByRole("link", { name: "dashboard" })).toBeVisible();
      await page.getByRole("link", { name: "dashboard" }).click();
      await expect(page).toHaveURL(`/dashboard`);

      await expect(page.getByRole("link", { name: "settings" })).toBeVisible();
      await page.getByRole("link", { name: "settings" }).click();
      await expect(page).toHaveURL(`/settings`);

      await expect(page.getByRole("link", { name: "messages" })).toBeVisible();
      await page.getByRole("link", { name: "messages" }).click();
      await page.waitForURL("/messages");

      await expect(
        page.getByRole("link", { name: "Sending message" })
      ).toBeVisible();
      await page.getByRole("link", { name: "Sending message" }).click();
      await page.waitForURL("/messages/new");

      let categoryName = "커뮤니티";
      let boardName = "자유 게시판";
      let boardSlug = "free";
      await clickSideBarBoard(page, categoryName, boardName, boardSlug);

      categoryName = "공지사항";
      boardName = "공지 게시판";
      boardSlug = "notices";
      await clickSideBarBoard(page, categoryName, boardName, boardSlug);

      await page.getByRole("button", { name: "Sidebar Activation" }).click();

      for (const [key, value] of Object.entries(adminLinks)) {
        await expect(page.getByRole("link", { name: key })).toBeVisible();
        await page.getByRole("link", { name: key }).click();
        await expect(page).toHaveURL(value);
      }
    } catch (error) {
      test.fail();
    } finally {
      if (context) {
        await context.close();
      }
    }
  });
});
