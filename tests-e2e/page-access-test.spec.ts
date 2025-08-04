import { test, expect } from "@playwright/test";
import { clickSideBarBoard } from "./util/test-utils";

test.use({
  storageState: undefined,
});

test.describe("Page-to-page movement test", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/");
    await page.reload();
  });

  test("Main Page Access test", async ({ page }) => {
    await expect(page.getByRole("paragraph")).toContainText("Welcome My Home!");
  });

  test("Login Page Access Test", async ({ page }) => {
    await page.getByLabel("Login").click();
    await expect(page).toHaveURL("/login");
    await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
    await expect(page.getByText("Email")).toBeVisible();
    await expect(page.getByText("Password")).toBeVisible();
    await expect(page.getByRole("link", { name: "Signup" })).toBeVisible();
    await page.getByLabel("Go To Home").click();
    await expect(page).not.toHaveURL("/login");
  });

  test("SignUp Page Access Test", async ({ page }) => {
    await page.getByLabel("Login").click();
    await expect(page).toHaveURL("/login");
    await expect(page.getByRole("link", { name: "Signup" })).toBeVisible();
    await page.getByRole("link", { name: "Signup" }).click();
    await expect(page).toHaveURL("/signup");
    await page.getByLabel("Go To Home").click();
    await expect(page).not.toHaveURL("/signup");
  });

  test("Dashboard Page Can't Access Test (if you don't login)", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL("/login");
  });

  test("Board Page Access Test", async ({ page }) => {
    const categoryName = "커뮤니티";
    const boardName = "자유 게시판";
    const boardSlug = "free";
    await clickSideBarBoard(page, categoryName, boardName, boardSlug);

    await expect(
      page.getByRole("link", { name: "게시물 작성" })
    ).not.toBeVisible();
  });

  test("Redirect to login page when ths user is not logged in and access page about creating post", async ({
    page,
  }) => {
    await page.goto("/boards/free/create");
    await expect(page).toHaveURL("/login");
  });

  test.describe("Settings Page can't access (if you don't login)", () => {
    test("'/settings' page can't access", async ({ page }) => {
      await page.goto("/settings");
      await expect(page).toHaveURL("/");
    });
    test("'/settings/nickname' page can't access", async ({ page }) => {
      await page.goto("/settings/nickname");
      await expect(page).toHaveURL("/");
    });
    test("'/settings/password' page can't access", async ({ page }) => {
      await page.goto("/settings/password");
      await expect(page).toHaveURL("/");
    });
  });
});
