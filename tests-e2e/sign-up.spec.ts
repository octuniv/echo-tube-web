import { test, expect } from "@playwright/test";
import { logout } from "./auto-logout";

/*
    Warning : You must start and initialize the app server before you start it.
*/
test.describe("SignUp Form E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await logout(page);
    await page.goto("/signup");
  });

  test("should display validation errors on empty form submission", async ({
    page,
  }) => {
    await page.click('button[type="submit"]');

    await expect(page.locator("#name-error")).toHaveText(
      "Please enter your valid name."
    );
    await expect(page.locator("#email-error")).toHaveText(
      "This email is invalid"
    );
    await expect(page.locator("#password-error")).toHaveText(
      "Password must be at least 6 characters"
    );
  });

  test("should display an error for invalid email format", async ({ page }) => {
    await page.fill('input[name="name"]', "John Doe");
    await page.fill('input[name="email"]', "invalid-email");
    await page.fill('input[name="password"]', "password123");

    await page.click('button[type="submit"]');

    await expect(page.locator("#email-error")).toHaveText(
      "This email is invalid"
    );
  });

  test("should sign up successfully with valid inputs", async ({ page }) => {
    await page.fill('input[name="name"]', "John Doe");
    await page.fill('input[name="email"]', "john.doe@example.com");
    await page.fill('input[name="password"]', "password123");

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL("/login");
  });

  test("should display server error message on failure if you put an email that already exists on the server ", async ({
    page,
  }) => {
    await page.fill('input[name="name"]', "Existing User");
    await page.fill('input[name="email"]', "john.doe@example.com");
    await page.fill('input[name="password"]', "password123");

    await page.click('button[type="submit"]');

    await expect(page.locator("p.text-red-500")).toHaveText(
      `This email john.doe@example.com is already existed!`
    );
  });
});
