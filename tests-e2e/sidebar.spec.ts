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
    await expect(page.getByRole("link", { name: "posts" })).toBeVisible();
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
      await expect(page.getByRole("link", { name: "posts" })).toBeVisible();
    });
  });
});
