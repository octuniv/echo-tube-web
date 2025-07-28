import { test, expect, Cookie, chromium } from "@playwright/test";
import { signUpAndLogin } from "./util/auth-utils";
import {
  createTestUser,
  expectCookiesToBeDefined,
  expectValidUserCookie,
  safeLogout,
} from "./util/test-utils";

const testAccount = createTestUser();

test.use({
  storageState: undefined,
});

test.describe("Auth Test", () => {
  test.beforeEach(async ({ page }) => {
    await safeLogout(page);
  });

  test.describe("About Creating Post", () => {
    test.beforeEach(async ({ page, context }) => {
      await signUpAndLogin({ account: testAccount, page, context });
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

    test("failed to submit with valid data when signUpAndLogin is invalid", async ({
      page,
    }) => {
      await page.goto("/boards/free/create");
      await page.waitForURL("/boards/free/create", { timeout: 5000 });

      await page.context().clearCookies();

      const titleInput = page.locator("input#title");
      const contentTextarea = page.locator("textarea#content");
      const submitButton = page.locator('button[type="submit"]');
      await titleInput.fill("Test Title");
      await contentTextarea.fill("Test Content");

      await submitButton.click();

      await page.reload();
      await expect(page).toHaveURL("/login");
    });

    test("submits the form successfully when access_token is expired but refresh_token is valid", async ({
      page,
      context,
    }) => {
      await page.goto("/boards/free/create");
      await page.waitForURL("/boards/free/create", { timeout: 5000 });

      const cookies = await context.cookies();
      const prevAccessToken = cookies.find(
        (cookie) => cookie.name === "access_token"
      );

      const expireAccessTokenCookies = cookies.map((cookie) => {
        if (cookie.name === "access_token") {
          return {
            ...cookie,
            expires: Date.now() / 1000 + 1,
          };
        }
        return cookie;
      });

      await context.clearCookies();
      await context.addCookies(expireAccessTokenCookies);
      await page.reload();

      await page.waitForTimeout(2000);

      const titleInput = page.locator("input#title");
      const contentTextarea = page.locator("textarea#content");
      const submitButton = page.locator('button[type="submit"]');
      await titleInput.fill("Test Title with Refresh Token");
      await contentTextarea.fill("Test Content with Refresh Token");

      await submitButton.click();

      await page.waitForURL("/boards/free", { timeout: 5000 });

      const updatedCookies = await context.cookies();
      const newAccessToken = updatedCookies.find(
        (cookie) => cookie.name === "access_token"
      );
      expect(newAccessToken).toBeDefined();
      expect(newAccessToken?.value).not.toBe(prevAccessToken?.value);
    });
  });

  test.describe("About Deleting Post", () => {
    test.beforeEach(async ({ page, context }) => {
      await signUpAndLogin({ account: testAccount, page, context });
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

    test("should not be able to be deleted post by someone who manipulates cookies", async ({
      page,
      context,
    }) => {
      await page.goto("/boards/free/create");
      await page.fill(
        "input#title",
        "Test to confirm that this post cannot be deleted"
      );
      await page.fill("textarea#content", "Test Content");
      await page.click('button[type="submit"]');

      await expect(page).toHaveURL("/boards/free");

      const post = page
        .getByText("Test to confirm that this post cannot be deleted")
        .first();
      await post.click();

      await expect(page).toHaveURL(/\/boards\/free\/\d+/);

      const cookies = await context.cookies();
      await context.clearCookies();

      const newAccessToken = "new-access-token-value";
      const newRefreshToken = "new-refresh-token-value";

      const manipulatedCookies = cookies
        .filter(
          (cookie) =>
            cookie.name !== "access_token" && cookie.name !== "refresh_token"
        )
        .concat([
          {
            name: "access_token",
            value: newAccessToken,
            domain:
              cookies.find((c) => c.name === "access_token")?.domain ||
              "localhost",
            path: "/",
            expires: -1,
            httpOnly: true,
            secure: false,
            sameSite: "Lax" as const,
          },
          {
            name: "refresh_token",
            value: newRefreshToken,
            domain:
              cookies.find((c) => c.name === "refresh_token")?.domain ||
              "localhost",
            path: "/",
            expires: -1,
            httpOnly: true,
            secure: false,
            sameSite: "Lax" as const,
          },
        ]);

      await context.addCookies(manipulatedCookies);

      await page.reload();

      const deleteButton = page.getByRole("button", {
        name: "게시물 삭제",
      });

      const isButtonVisible = await deleteButton.isVisible();
      expect(isButtonVisible).toBeTruthy();

      page.on("dialog", async (dialog) => {
        await dialog.accept();
      });

      await deleteButton.click();

      await page.waitForURL("/login?error=session_expired", { timeout: 10000 });
      await expect(
        page.getByText("세션이 만료되었습니다. 다시 로그인해주세요")
      ).toBeVisible();

      const remainingCookies = await context.cookies();

      expect(remainingCookies.length).toBe(0);
    });
  });

  test.describe("About Editing Post", () => {
    test.beforeEach(async ({ page, context }) => {
      await signUpAndLogin({ account: testAccount, page, context });

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

    test("should not be able to be edited post by someone who manipulates cookies", async ({
      page,
      context,
    }) => {
      await page.goto("/boards/free/create");
      await page.fill(
        "input#title",
        "Test to confirm that this post cannot be edited"
      );
      await page.fill("textarea#content", "Test Content");
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL("/boards/free");
      const post = page
        .getByText("Test to confirm that this post cannot be edited")
        .first();
      await post.click();
      await expect(page).toHaveURL(/\/boards\/free\/\d+/);

      const cookies = await context.cookies();
      await context.clearCookies();

      const newAccessToken = "new-access-token-value";
      const newRefreshToken = "new-refresh-token-value";

      const manipulatedCookies = cookies
        .filter(
          (cookie) =>
            cookie.name !== "access_token" && cookie.name !== "refresh_token"
        )
        .concat([
          {
            name: "access_token",
            value: newAccessToken,
            domain:
              cookies.find((c) => c.name === "access_token")?.domain ||
              "localhost",
            path: "/",
            expires: -1,
            httpOnly: true,
            secure: false,
            sameSite: "Lax" as const,
          },
          {
            name: "refresh_token",
            value: newRefreshToken,
            domain:
              cookies.find((c) => c.name === "refresh_token")?.domain ||
              "localhost",
            path: "/",
            expires: -1,
            httpOnly: true,
            secure: false,
            sameSite: "Lax" as const,
          },
        ]);

      await context.addCookies(manipulatedCookies);

      await page.reload();

      const editLink = page.getByRole("link", {
        name: "게시물 수정",
      });

      const isLinkVisible = await editLink.isVisible();
      expect(isLinkVisible).toBeTruthy();

      await editLink.click();

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      await page.waitForURL("/login?error=session_expired", { timeout: 10000 });
      await expect(
        page.getByText("세션이 만료되었습니다. 다시 로그인해주세요")
      ).toBeVisible();

      const remainingCookies = await context.cookies();
      expect(remainingCookies.length).toBe(0);
    });
  });
});
