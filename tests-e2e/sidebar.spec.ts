import { test, expect } from "@playwright/test";
import { withTemporaryLogout } from "./util/helper";

test.describe("Sidebar test", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should be visible all buttons if user is logined.", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Sidebar Activation" }).click();
    await expect(page.getByRole("link", { name: "dashboard" })).toBeVisible();
    await expect(page.getByRole("link", { name: "settings" })).toBeVisible();

    const generalBoardHeading = page.locator("#general-heading");
    await expect(generalBoardHeading).toBeVisible();
    await expect(generalBoardHeading).toContainText("일반 게시판");
    await expect(
      page.getByRole("link", { name: `일반 게시판 - 자유 게시판 category` })
    ).toBeVisible();

    const aiDigestBoardHeading = page.locator("#ai-digest-heading");
    await expect(aiDigestBoardHeading).toBeVisible();
    await expect(aiDigestBoardHeading).toContainText("AI 추천 게시판");
  });

  test("Only permitted buttons should be shown in the logout state.", async ({
    page,
  }) => {
    await withTemporaryLogout(page, async (page) => {
      await page.goto("/");
      await page.getByRole("button", { name: "Sidebar Activation" }).click();
      await expect(
        page.getByRole("link", { name: "dashboard" })
      ).not.toBeVisible();
      await expect(
        page.getByRole("link", { name: "settings" })
      ).not.toBeVisible();
      await expect(
        page.getByRole("link", {
          name: `일반 게시판 - 자유 게시판 category`,
        })
      ).toBeVisible();
    });
  });
});
