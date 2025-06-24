import { test, expect } from "@playwright/test";
import { createTestUser } from "./util/test-utils";
import { ERROR_MESSAGES } from "@/lib/constants/errorMessage";

test.use({
  storageState: undefined,
});

test.describe("SignUp Form E2E Tests", () => {
  const testAccount = createTestUser();

  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/signup");
    await page.reload();
  });

  test("should display validation errors on empty form submission", async ({
    page,
  }) => {
    await page.click('button[type="submit"]');

    await expect(page.locator("#name-error")).toHaveText(
      "Please enter your valid name."
    );
    await expect(page.locator("#nickname-error")).toHaveText(
      "Please enter your nickname."
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
    await page.fill('input[name="nickname"]', "John");
    await page.fill('input[name="email"]', "invalid-email");
    await page.fill('input[name="password"]', "password123");

    await page.click('button[type="submit"]');

    await expect(page.locator("#email-error")).toHaveText(
      "This email is invalid"
    );
  });

  test("should sign up successfully with valid inputs", async ({ page }) => {
    await page.fill('input[name="name"]', testAccount.name);
    await page.fill('input[name="nickname"]', testAccount.nickname);
    await page.fill('input[name="email"]', testAccount.email);
    await page.fill('input[name="password"]', testAccount.password);

    await page.getByRole("button", { name: "중복 확인" }).nth(0).click();
    await page.getByRole("button", { name: "중복 확인" }).nth(1).click();

    const nicknameCheck = page.locator(
      '[aria-labelledby="nickname-validation"]'
    );
    const emailCheck = page.locator('[aria-labelledby="email-validation"]');

    await expect(nicknameCheck).toHaveText("사용 가능");
    await expect(emailCheck).toHaveText("사용 가능");

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL("/login");
  });

  test("should display server error message on failure if you put an email that already exists on the server ", async ({
    page,
  }) => {
    const duplicatedEmailAccount = createTestUser({ email: testAccount.email });
    await page.fill('input[name="name"]', duplicatedEmailAccount.name);
    await page.fill('input[name="nickname"]', duplicatedEmailAccount.nickname);
    await page.fill('input[name="email"]', duplicatedEmailAccount.email);
    await page.fill('input[name="password"]', duplicatedEmailAccount.password);

    await page.click('button[type="submit"]');

    await expect(page.locator("#email-error")).toHaveText(
      ERROR_MESSAGES.EMAIL_EXISTS
    );

    await expect(page.getByText(ERROR_MESSAGES.INVALID_FIELD)).toBeVisible();
  });

  test("should display server error message on failure if you put an nickname that already exists on the server ", async ({
    page,
  }) => {
    const duplicatedNicknameAccount = createTestUser({
      nickname: testAccount.nickname,
    });
    await page.fill('input[name="name"]', duplicatedNicknameAccount.name);
    await page.fill(
      'input[name="nickname"]',
      duplicatedNicknameAccount.nickname
    );
    await page.fill('input[name="email"]', duplicatedNicknameAccount.email);
    await page.fill(
      'input[name="password"]',
      duplicatedNicknameAccount.password
    );

    await page.click('button[type="submit"]');

    await expect(page.locator("#nickname-error")).toHaveText(
      ERROR_MESSAGES.NICKNAME_EXISTS
    );

    await expect(page.getByText(ERROR_MESSAGES.INVALID_FIELD)).toBeVisible();
  });

  test("should display 'Enter a value' text if the duplicate confirmation button is pressed while the input space for duplicate confirmation is empty.", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "중복 확인" }).nth(0).click();
    await page.getByRole("button", { name: "중복 확인" }).nth(1).click();

    const nicknameCheck = page.locator(
      '[aria-labelledby="nickname-validation"]'
    );
    const emailCheck = page.locator('[aria-labelledby="email-validation"]');

    await expect(nicknameCheck).toHaveText("값을 입력해주세요");
    await expect(emailCheck).toHaveText("값을 입력해주세요");
  });

  test("should display text that is already in use when a duplicate confirmation button is pressed and duplicate input values are entered.", async ({
    page,
  }) => {
    await page.fill('input[name="nickname"]', testAccount.nickname);
    await page.fill('input[name="email"]', testAccount.email);
    await page.getByRole("button", { name: "중복 확인" }).nth(0).click();
    await page.getByRole("button", { name: "중복 확인" }).nth(1).click();

    const nicknameCheck = page.locator(
      '[aria-labelledby="nickname-validation"]'
    );
    const emailCheck = page.locator('[aria-labelledby="email-validation"]');

    await expect(nicknameCheck).toHaveText("이미 사용 중");
    await expect(emailCheck).toHaveText("이미 사용 중");
  });
});
