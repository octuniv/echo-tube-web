import * as dotenv from "dotenv";
import { test, expect, chromium, Cookie } from "@playwright/test";
import { signUpAndLogin } from "./util/authUtil";
import { User } from "@/lib/definition";

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
      ["access_token", "refresh_token", "name", "nickname", "email"].forEach(
        (name) =>
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
      const deleteAccountButton = page.getByRole("button", {
        name: "회원탈퇴",
      });

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
      ["access_token", "refresh_token", "name", "nickname", "email"].forEach(
        (name) =>
          expect(
            insertedCookies.find((cookie) => cookie.name === name)
          ).toBeDefined()
      );
    });

    test("should update nickname successfully", async ({ page }) => {
      await page.goto("/settings");
      const updateNicknameLink = page.getByRole("link", {
        name: "닉네임 변경",
      });
      await updateNicknameLink.click();

      expect(page).toHaveURL("/settings/nickname");
      await page.fill('input[name="nickname"]', "newnickname");
      await page.click('button[type="submit"]');

      await page.waitForURL("/dashboard", { timeout: 1000 });

      const cookies = await page.context().cookies();

      const nicknameCookie = cookies.find(
        (cookie) => cookie.name === "nickname"
      );
      expect(nicknameCookie).toBeDefined();
      expect(nicknameCookie?.value).toBe("newnickname");
      currentCookies = cookies;
    });

    test("should handle when trying to change to duplicate nicknames", async ({
      page,
    }) => {
      await page.goto("/settings");
      const updateNicknameLink = page.getByRole("link", {
        name: "닉네임 변경",
      });
      await updateNicknameLink.click();

      expect(page).toHaveURL("/settings/nickname");
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
});
