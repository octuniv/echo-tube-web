import { test, expect } from "@playwright/test";

function extractDate(dateText: string) {
  const dateMatch = dateText.match(
    /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)/
  );
  if (!dateMatch || !dateMatch[1]) {
    throw new Error("Creation date not found or invalid format");
  }

  // 추출된 날짜를 Date 객체로 변환
  const creationDate = new Date(dateMatch[1]);

  // 유효한 날짜인지 확인
  if (isNaN(creationDate.getTime())) {
    throw new Error("Invalid date extracted");
  }

  return creationDate;
}

test.describe("Create Post Test", () => {
  test.beforeEach(async ({ page }) => {
    // 게시판 목록 이동
    await page.goto("/posts");
    await page.waitForURL("/posts", { timeout: 5000 });
    await page.reload();
  });

  test("should move create post page when click create post button", async ({
    page,
  }) => {
    // 게시물 작성 버튼 확인
    await expect(
      page.getByRole("button", { name: "게시물 작성" })
    ).toBeVisible();

    // 게시물 작성 버튼 클릭
    await page.getByRole("button", { name: "게시물 작성" }).click();

    // 게시물 작성 페이지 리다이렉트 확인
    await expect(page).toHaveURL("/posts/create");
  });

  test("renders the form correctly", async ({ page }) => {
    // 페이지에 컴포넌트 마운트
    await page.goto("/posts/create");
    await page.waitForURL("/posts/create", { timeout: 5000 });

    // 폼 요소 확인
    const titleInput = page.locator("input#title");
    const contentTextarea = page.locator("textarea#content");
    const videoUrlInput = page.locator("input#videoUrl");
    const submitButton = page.locator('button[type="submit"]');
    const backButton = page.locator('a[href="/posts"] button');

    await expect(titleInput).toBeVisible();
    await expect(contentTextarea).toBeVisible();
    await expect(videoUrlInput).toBeVisible();
    await expect(submitButton).toBeVisible();
    await expect(backButton).toBeVisible();
  });

  test("displays validation errors when fields are empty", async ({ page }) => {
    // 페이지에 컴포넌트 마운트
    await page.goto("/posts/create");
    await page.waitForURL("/posts/create", { timeout: 5000 });

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
    await page.goto("/posts/create");
    await page.waitForURL("/posts/create", { timeout: 5000 });

    // 폼 입력값 채우기
    const titleInput = page.locator("input#title");
    const contentTextarea = page.locator("textarea#content");
    const submitButton = page.locator('button[type="submit"]');

    await titleInput.fill("Test Title");
    await contentTextarea.fill("Test Content");

    // 폼 제출
    await submitButton.click();

    // 리다이렉션 확인
    await expect(page).toHaveURL("/posts");
  });
});

test.describe("Posts E2E Tests", () => {
  // 게시물 작성 테스트
  test("should create a new post with valid videoUrl", async ({ page }) => {
    await page.goto("/posts/create");

    await page.fill("input#title", "New Post Title");
    await page.fill("textarea#content", "New Post Content");
    await page.fill(
      "input#videoUrl",
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    );

    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/posts");

    const newPost = page.getByLabel("Post title: New Post Title").first();
    await expect(newPost).toBeVisible();
  });

  // 게시물 상세 페이지 테스트
  test("should navigate to post details page when a post card is clicked", async ({
    page,
  }) => {
    await page.goto("/posts");
    const post = page.getByLabel("Post title: New Post Title").first();
    await post.click();

    await expect(page).toHaveURL(/\/posts\/\d+/);
    await expect(page.getByText("New Post Title")).toBeVisible();
  });

  test("should display embedded YouTube video if valid video URL is provided", async ({
    page,
  }) => {
    await page.goto("/posts");
    const post = page.getByLabel("Post title: New Post Title").first();
    await post.click();

    const iframe = page.locator('iframe[src*="youtube.com/embed"]');
    await expect(iframe).toBeVisible();
  });

  test("should display error message if invalid video URL is provided", async ({
    page,
  }) => {
    await page.goto("/posts/create");

    await page.fill("input#title", "Invalid Video URL Test");
    await page.fill("textarea#content", "Test Content");
    await page.fill("input#videoUrl", "https://invalid-video-url.com");

    await page.click('button[type="submit"]');

    // await page.goto("/posts");
    await expect(page).toHaveURL("/posts");

    const post = page.getByLabel("Post title: Invalid Video URL Test").first();
    await post.click();

    await expect(
      page.getByText(
        "비디오를 로드할 수 없습니다. 제공된 링크가 유효하지 않습니다."
      )
    ).toBeVisible();
  });

  // 게시물 목록 페이지 테스트
  test("should display posts in descending order by creation date", async ({
    page,
  }) => {
    await page.goto("/posts");
    const firstPost = page
      .locator('p[aria-label^="Post creation date"]')
      .first();
    const lastPost = page.locator('p[aria-label^="Post creation date"]').last();

    const firstPostDateText = await firstPost.innerText();
    const lastPostDateText = await lastPost.innerText();

    expect(
      new Date(extractDate(firstPostDateText)).getTime()
    ).toBeGreaterThanOrEqual(new Date(extractDate(lastPostDateText)).getTime());
  });
});
