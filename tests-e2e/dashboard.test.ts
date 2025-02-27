import { test, expect } from "@playwright/test";

test.describe("Dashboard Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
    await page.reload();
  });

  test("should access dashboard without login page", async ({ page }) => {
    await expect(page).toHaveURL("/dashboard");
  });
});
