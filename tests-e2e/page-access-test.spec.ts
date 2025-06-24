import { test, expect } from "@playwright/test";

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
    await page.getByRole("button", { name: "Sidebar Activation" }).click();
    await expect(
      page.getByRole("link", { name: `일반 게시판 - 자유 게시판 category` })
    ).toBeVisible();
    await page
      .getByRole("link", { name: `일반 게시판 - 자유 게시판 category` })
      .click();
    await expect(page).toHaveURL("/boards/free");

    // 글 쓰기 버튼 상태 확인 (비활성화)

    // 게시물 작성 버튼 로케이터
    const postButton = page.getByRole("button", {
      name: "게시물 작성",
      disabled: true,
    });

    // 버튼이 화면에 표시되고 비활성화되었는지 확인
    await expect(postButton).toBeVisible();
    await expect(postButton).toBeDisabled();

    // 접근성 속성 검증
    await expect(postButton).toHaveAttribute(
      "title",
      "게시물 작성 권한이 없습니다"
    );
    await expect(postButton).toHaveAttribute("aria-disabled", "true");

    // 스타일 검증 (옵션)
    const buttonClass = await postButton.getAttribute("class");
    expect(buttonClass).toContain("bg-gray-300");
    expect(buttonClass).toContain("cursor-not-allowed");
    expect(buttonClass).toContain("opacity-70");
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
