import { test, expect } from "@playwright/test";
import path from "path";

const authFile = path.join(__dirname, "./.auth/user.json");
test.use({ storageState: authFile });

test("should access dashboard without login page", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page).toHaveURL("/dashboard");
});
