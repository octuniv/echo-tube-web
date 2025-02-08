import { test, expect } from "@playwright/test";
import { login, logout } from "./authUtil";

test.describe("SignUp Form E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await logout(page);
    await page.goto("/signup");
  });

  test.afterAll(async ({ page }) => {
    try {
      await login(page); // 로그인 상태로 초기화
    } catch (error) {
      console.error("Failed to log in after test:", error);
    }
  });

  test("should display validation errors on empty form submission", async ({
    page,
  }) => {
    await page.click('button[type="submit"]');

    await expect(page.locator("#name-error")).toHaveText(
      "Please enter your valid name."
    );
    await expect(page.locator("#nickName-error")).toHaveText(
      "Please enter your nickName."
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
    await page.fill('input[name="nickName"]', "John");
    await page.fill('input[name="email"]', "invalid-email");
    await page.fill('input[name="password"]', "password123");

    await page.click('button[type="submit"]');

    await expect(page.locator("#email-error")).toHaveText(
      "This email is invalid"
    );
  });

  test("should sign up successfully with valid inputs", async ({ page }) => {
    await page.fill('input[name="name"]', "John Doe");
    await page.fill('input[name="nickName"]', "John");
    await page.fill('input[name="email"]', "john.doe@example.com");
    await page.fill('input[name="password"]', "password123");

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL("/login");
  });

  test("should display server error message on failure if you put an email that already exists on the server ", async ({
    page,
  }) => {
    await page.fill('input[name="name"]', "Existing User");
    await page.fill('input[name="nickName"]', "another");
    await page.fill('input[name="email"]', "john.doe@example.com");
    await page.fill('input[name="password"]', "password123");

    await page.click('button[type="submit"]');

    await expect(page.locator("p.text-red-500")).toHaveText(
      `This email john.doe@example.com is already existed!`
    );
  });

  test("should display server error message on failure if you put an nickName that already exists on the server ", async ({
    page,
  }) => {
    await page.fill('input[name="name"]', "another User");
    await page.fill('input[name="nickName"]', "John");
    await page.fill('input[name="email"]', "anotherTester@example.com");
    await page.fill('input[name="password"]', "password123");

    await page.click('button[type="submit"]');

    await expect(page.locator("p.text-red-500")).toHaveText(
      `This nickName John is already existed!`
    );
  });
});
