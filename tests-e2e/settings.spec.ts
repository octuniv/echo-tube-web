import * as dotenv from "dotenv";
import { test, expect, chromium, Cookie } from "@playwright/test";
import { signUpAndLogin } from "./util/auth-utils";
import { User, UserRole } from "@/lib/definition";
import {
  createTestUser,
  expectCookiesToBeDefined,
  expectCookiesToNotExist,
  expectValidUserCookie,
  safeLogout,
  uniqueNickname,
} from "./util/test-utils";
import { ERROR_MESSAGES } from "@/lib/constants/errorMessage";

dotenv.config({ path: ".env.e2e.test" });

const settingsTestAccount = createTestUser();

const existingAccount = createTestUser({
  name: process.env.tester_name as string,
  nickname: process.env.tester_nickname as string,
  email: process.env.tester_email as string,
  password: process.env.tester_password as string,
});

test.use({
  storageState: undefined,
});

test.describe("Settings Test", () => {
  test.beforeEach(async ({ page }) => {
    await safeLogout(page);
  });

  test.describe("Settings Page", () => {
    test.beforeEach(async ({ page, context }) => {
      await signUpAndLogin({ account: settingsTestAccount, page, context });
      const cookies = await context.cookies();
      expectCookiesToBeDefined(cookies, [
        "access_token",
        "refresh_token",
        "user",
      ]);
      expectValidUserCookie(cookies);
    });

    test.afterEach(async ({ page }) => {
      await safeLogout(page);
    });

    test("Exist components in settings page", async ({ page }) => {
      await page.goto("/settings");
      const updateNicknameLink = page.getByRole("link", {
        name: "닉네임 변경",
      });
      const updatePasswordLink = page.getByRole("link", {
        name: "비밀번호 변경",
      });
      const deleteAccountButton = page.locator(
        '[aria-label="DeleteUserButton"]'
      );

      await expect(updateNicknameLink).toBeVisible();
      await expect(updatePasswordLink).toBeVisible();
      await expect(deleteAccountButton).toBeVisible();
    });
  });

  test.describe("Updating Nickname", () => {
    test.beforeEach(async ({ page, context }) => {
      await signUpAndLogin({ account: settingsTestAccount, page, context });
      const cookies = await context.cookies();
      expectCookiesToBeDefined(cookies, [
        "access_token",
        "refresh_token",
        "user",
      ]);
      expectValidUserCookie(cookies);

      await page.goto("/settings");
      const updateNicknameLink = page.getByRole("link", {
        name: "닉네임 변경",
      });
      await updateNicknameLink.click();

      expect(page).toHaveURL("/settings/nickname");
    });

    test.afterEach(async ({ page }) => {
      await safeLogout(page);
    });

    test("should update nickname successfully", async ({ page }) => {
      const newNickname = uniqueNickname();
      await page.fill('input[name="nickname"]', newNickname);
      await page.click('button[type="submit"]');

      await page.waitForURL("/dashboard", { timeout: 1000 });

      const userData = expectValidUserCookie(await page.context().cookies());
      expect(userData.nickname).toBe(newNickname);
      expect(userData.role).toBe(UserRole.USER);
    });

    test("should handle when trying to change to duplicate nicknames", async ({
      page,
    }) => {
      await page.fill('input[name="nickname"]', existingAccount.nickname);
      await page.click('button[type="submit"]');

      await expect(page.locator("#nickname-error")).toHaveText(
        ERROR_MESSAGES.NICKNAME_EXISTS
      );

      await expect(
        page.getByText(
          `This nickname ${existingAccount.nickname} is already existed!`
        )
      ).toBeVisible();
    });
  });

  test.describe("Updating Password", () => {
    test.beforeEach(async ({ page, context }) => {
      await signUpAndLogin({ account: settingsTestAccount, page, context });
      const cookies = await context.cookies();
      expectCookiesToBeDefined(cookies, [
        "access_token",
        "refresh_token",
        "user",
      ]);
      expectValidUserCookie(cookies);

      await page.goto("/settings");
      const updatePasswordLink = page.getByRole("link", {
        name: "비밀번호 변경",
      });
      await updatePasswordLink.click();

      expect(page).toHaveURL("/settings/password");
    });

    test.afterEach(async ({ page }) => {
      await safeLogout(page);
    });

    test("should reject request to change invalid password", async ({
      page,
    }) => {
      await page.fill('input[name="password"]', "short");
      await page.fill('input[name="confirmPassword"]', "short");
      await page.click('button[type="submit"]');

      await expect(page.locator("#password-error")).toHaveText(
        "Password must be at least 6 characters"
      );
      await expect(page.locator("#confirmPassword-error")).toHaveText(
        "Password must be at least 6 characters"
      );
      await expect(
        page.getByText("Missing Fields. Failed to update password.")
      ).toBeVisible();
    });

    test("should reject request if the password you entered and the verification number do not match", async ({
      page,
    }) => {
      await page.fill('input[name="password"]', "newpassword");
      await page.fill('input[name="confirmPassword"]', "newdifferpw");
      await page.click('button[type="submit"]');

      await expect(page.locator("#confirmPassword-error")).toHaveText(
        "The password you entered does not match"
      );
      await expect(
        page.getByText("Missing Fields. Failed to update password.")
      ).toBeVisible();
    });

    test("should update password successfully", async ({ page }) => {
      await page.fill('input[name="password"]', "newpassword");
      await page.fill('input[name="confirmPassword"]', "newpassword");
      await page.click('button[type="submit"]');

      await page.waitForURL("/dashboard", { timeout: 1000 });
      settingsTestAccount.password = "newpassword";
    });
  });

  test.describe("Delete User", () => {
    test.beforeEach(async ({ page, context }) => {
      await signUpAndLogin({ account: settingsTestAccount, page, context });
      const cookies = await context.cookies();
      expectCookiesToBeDefined(cookies, [
        "access_token",
        "refresh_token",
        "user",
      ]);
      expectValidUserCookie(cookies);

      await page.goto("/settings");
    });

    test("should delete userInfo if user press delete button.", async ({
      page,
    }) => {
      page.on("dialog", async (dialog) => {
        await dialog.accept();
      });

      const deleteUserButton = page.locator('[aria-label="DeleteUserButton"]');
      await deleteUserButton.click();

      await page.waitForURL("/", { timeout: 1000 });

      const insertedCookies = await page.context().cookies();
      expectCookiesToNotExist(insertedCookies, [
        "access_token",
        "refresh_token",
        "user",
      ]);
    });
  });
});
