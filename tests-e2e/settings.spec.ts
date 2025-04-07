import * as dotenv from "dotenv";
import { test, expect, chromium, Cookie } from "@playwright/test";
import { signUpAndLogin } from "./util/authUtil";
import { User, UserRole } from "@/lib/definition";

dotenv.config({ path: ".env.e2e.test" });

const settingsTestAccount = {
  name: "settingsTester",
  nickname: "settingsTester",
  email: "settings@test.com",
  password: "forSettings",
} satisfies User;

const existingAccount = {
  name: process.env.tester_name as string,
  nickname: process.env.tester_nickname as string,
  email: process.env.tester_email as string,
  password: process.env.tester_password as string,
} satisfies User;

test.describe("Settings Test", () => {
  let currentCookies: Cookie[];

  test.beforeAll(async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await browser.newPage();
    await page.context().clearCookies();
    await signUpAndLogin({ account: settingsTestAccount, page, context });
    currentCookies = await page.context().cookies();
    await browser.close();
  });

  test.describe("Settings Page", () => {
    test.beforeEach(async ({ page }) => {
      await page.context().clearCookies();
      await page.context().addCookies(currentCookies);
      const insertedCookies = await page.context().cookies();
      ["access_token", "refresh_token", "user"].forEach((name) =>
        expect(
          insertedCookies.find((cookie) => cookie.name === name)
        ).toBeDefined()
      );
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
    test.beforeEach(async ({ page }) => {
      await page.context().clearCookies();
      await page.context().addCookies(currentCookies);
      const insertedCookies = await page.context().cookies();
      ["access_token", "refresh_token", "user"].forEach((name) =>
        expect(
          insertedCookies.find((cookie) => cookie.name === name)
        ).toBeDefined()
      );

      await page.goto("/settings");
      const updateNicknameLink = page.getByRole("link", {
        name: "닉네임 변경",
      });
      await updateNicknameLink.click();

      expect(page).toHaveURL("/settings/nickname");
    });

    test("should update nickname successfully", async ({ page }) => {
      await page.fill('input[name="nickname"]', "newnickname");
      await page.click('button[type="submit"]');

      await page.waitForURL("/dashboard", { timeout: 1000 });

      const cookies = await page.context().cookies();

      const userCookie = cookies.find((cookie) => cookie.name === "user");
      expect(userCookie).toBeDefined();

      const decodedValue = decodeURIComponent(userCookie!.value);
      const userData = JSON.parse(decodedValue);

      expect(userData.nickname).toBe("newnickname");
      expect(userData.role).toBe(UserRole.USER);
      expect(userData.email).toBe("settings@test.com");
      expect(userData).toHaveProperty("name", "settingsTester");
      currentCookies = cookies;
    });

    test("should handle when trying to change to duplicate nicknames", async ({
      page,
    }) => {
      await page.fill('input[name="nickname"]', existingAccount.nickname);
      await page.click('button[type="submit"]');

      await expect(page.locator("#nickname-error")).toHaveText(
        "The nickname is already in use"
      );

      await expect(
        page.getByText(
          `This nickname ${existingAccount.nickname} is already existed!`
        )
      ).toBeVisible();
    });
  });

  test.describe("Updating Password", () => {
    test.beforeEach(async ({ page }) => {
      await page.context().clearCookies();
      await page.context().addCookies(currentCookies);
      const insertedCookies = await page.context().cookies();
      ["access_token", "refresh_token", "user"].forEach((name) =>
        expect(
          insertedCookies.find((cookie) => cookie.name === name)
        ).toBeDefined()
      );

      await page.goto("/settings");
      const updatePasswordLink = page.getByRole("link", {
        name: "비밀번호 변경",
      });
      await updatePasswordLink.click();

      expect(page).toHaveURL("/settings/password");
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
    });
  });

  test.describe("Delete User", () => {
    test.beforeEach(async ({ page }) => {
      await page.context().clearCookies();
      await page.context().addCookies(currentCookies);
      const insertedCookies = await page.context().cookies();
      ["access_token", "refresh_token", "user"].forEach((name) =>
        expect(
          insertedCookies.find((cookie) => cookie.name === name)
        ).toBeDefined()
      );

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
      ["access_token", "refresh_token", "name", "nickname", "email"].forEach(
        (name) =>
          expect(
            insertedCookies.find((cookie) => cookie.name === name)
          ).toBeUndefined()
      );
    });
  });
});
