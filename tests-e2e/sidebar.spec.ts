import { test, expect } from "@playwright/test";
import { withTemporaryLogout } from "./util/helper";
import { clickSideBarBoard } from "./util/test-utils";

test.describe("Sidebar test", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should be accessible with all buttons if user is logged in.", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Sidebar Activation" }).click();

    await expect(page.getByRole("link", { name: "dashboard" })).toBeVisible();
    await page.getByRole("link", { name: "dashboard" }).click();
    await expect(page).toHaveURL(`/dashboard`);

    await expect(page.getByRole("link", { name: "settings" })).toBeVisible();
    await page.getByRole("link", { name: "settings" }).click();
    await expect(page).toHaveURL(`/settings`);

    let categoryName = "커뮤니티";
    let boardName = "자유 게시판";
    let boardSlug = "free";
    await clickSideBarBoard(page, categoryName, boardName, boardSlug);

    categoryName = "공지사항";
    boardName = "공지 게시판";
    boardSlug = "notices";
    await clickSideBarBoard(page, categoryName, boardName, boardSlug);
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
});
