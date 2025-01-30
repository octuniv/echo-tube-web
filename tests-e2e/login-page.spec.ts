import { test, expect } from "@playwright/test";

test.describe("Login Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("Test to see signup and login buttons", async ({ page }) => {
    await expect(page.getByRole("link", { name: "SignUp" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Logout" })
    ).not.toBeVisible();
  });

  test("should not allow login with empty fields", async ({ page }) => {
    // Click the login button without entering credentials
    await page.click('button[type="submit"]');

    // Expect an error validation message
    await expect(page.locator("#email-error")).toHaveText(
      "This email is invalid"
    );
    await expect(page.locator("#password-error")).toHaveText(
      "Password must be at least 6 characters"
    );
  });

  test("should show error message with invalid credentials", async ({
    page,
  }) => {
    // Fill incorrect email and password fields
    await page.fill('input[name="email"]', "wrong@example.com");
    await page.fill('input[type="password"]', "wrongpassword");

    // Click the login button
    await page.click('button[type="submit"]');

    await expect(page.getByText("Login Failed")).toBeVisible();
  });
});
