import { test, expect } from "@playwright/test";
import path from "path";

const authFile = path.join(__dirname, "./.auth/user.json");
test.use({ storageState: authFile });

test.describe("Create Post Test", () => {
  test("should move create post page when click create post button", async ({
    page,
  }) => {
    // 게시판 목록 이동
    await page.goto("/dashboard/posts");
    await page.waitForURL("/dashboard/posts", { timeout: 5000 });

    // 게시물 작성 버튼 확인
    await expect(
      page.getByRole("button", { name: "게시물 작성" })
    ).toBeVisible();

    // 게시물 작성 버튼 클릭
    await page.getByRole("button", { name: "게시물 작성" }).click();

    // 게시물 작성 페이지 리다이렉트 확인
    await expect(page).toHaveURL("/dashboard/posts/create");
  });

  test("renders the form correctly", async ({ page }) => {
    // 페이지에 컴포넌트 마운트
    await page.goto("/dashboard/posts/create");
    await page.waitForURL("/dashboard/posts/create", { timeout: 5000 });

    // 폼 요소 확인
    const titleInput = page.locator("input#title");
    const contentTextarea = page.locator("textarea#content");
    const videoUrlInput = page.locator("input#videoUrl");
    const submitButton = page.locator('button[type="submit"]');
    const backButton = page.locator('a[href="/dashboard/posts"] button');

    await expect(titleInput).toBeVisible();
    await expect(contentTextarea).toBeVisible();
    await expect(videoUrlInput).toBeVisible();
    await expect(submitButton).toBeVisible();
    await expect(backButton).toBeVisible();
  });

  test("displays validation errors when fields are empty", async ({ page }) => {
    // 페이지에 컴포넌트 마운트
    await page.goto("/dashboard/posts/create");
    await page.waitForURL("/dashboard/posts/create", { timeout: 5000 });

    // 폼 제출 시도
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // 에러 메시지 확인
    const titleError = page.locator('p:text("Please enter your title.")');
    const contentError = page.locator('p:text("Please enter your content.")');
    const generalError = page.locator(
      'p:text("Missing Fields. Failed to create posts.")'
    );

    await expect(titleError).toBeVisible();
    await expect(contentError).toBeVisible();
    await expect(generalError).toBeVisible();
  });

  test("submits the form successfully with valid data", async ({ page }) => {
    // 페이지에 컴포넌트 마운트
    await page.goto("/dashboard/posts/create");
    await page.waitForURL("/dashboard/posts/create", { timeout: 5000 });

    // 폼 입력값 채우기
    const titleInput = page.locator("input#title");
    const contentTextarea = page.locator("textarea#content");
    const submitButton = page.locator('button[type="submit"]');

    await titleInput.fill("Test Title");
    await contentTextarea.fill("Test Content");

    // 폼 제출
    await submitButton.click();

    // 리다이렉션 확인
    await expect(page).toHaveURL("/dashboard/posts");
  });
});
