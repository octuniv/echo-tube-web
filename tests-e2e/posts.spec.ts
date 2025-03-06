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

test.describe("Delete Post Tests", () => {
  test("should be able to be deleted post by the author", async ({ page }) => {
    await page.goto("/posts/create");

    await page.fill("input#title", "Test to delete this post");
    await page.fill("textarea#content", "Test Content");

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL("/posts");

    const post = page
      .getByLabel("Post title: Test to delete this post")
      .first();
    await post.click();

    await expect(page).toHaveURL(/\/posts\/\d+/);

    const thisPage = new URL(page.url()).pathname;

    const deleteButton = page.getByRole("button", { name: "게시물 삭제" });
    const isButtonEnabled = await deleteButton.isEnabled();

    expect(isButtonEnabled).toBeTruthy();

    // confirm 대화상자 처리 준비
    page.on("dialog", async (dialog) => {
      await dialog.accept(); // "확인" 버튼 클릭
    });

    await deleteButton.click();

    await expect(page).toHaveURL("/posts");

    await page.goto(thisPage);
    await expect(page).toHaveURL(thisPage);

    // 1. 제목 검증 (Next.js 기본 404 페이지는 제목이 "404: This page could not be found."임)
    const title = await page.title();
    expect(title).toBe("404: This page could not be found.");

    // 2. 특정 텍스트 검증 (404 페이지의 본문에 포함된 텍스트 확인)
    const notFoundText = page.locator("text=This page could not be found.");
    await expect(notFoundText).toBeVisible();
  });

  test("should not be able to be deleted post by someone who is not the author", async ({
    page,
  }) => {
    // 첫 번째 사용자: 게시물 작성
    await page.goto("/posts/create");

    await page.fill(
      "input#title",
      "Test to confirm that this post cannot be deleted"
    );
    await page.fill("textarea#content", "Test Content");

    await page.click('button[type="submit"]');

    // 게시물 목록 페이지로 리다이렉트 확인
    await expect(page).toHaveURL("/posts");

    const cookies = await page.context().cookies();
    await page.context().clearCookies();
    try {
      await page.goto("/posts");

      // 특정 게시물 클릭
      const post = page
        .getByText("Test to confirm that this post cannot be deleted")
        .first();
      await post.click();

      // 게시물 상세 페이지 URL 검증
      await expect(page).toHaveURL(/\/posts\/\d+/);

      // 삭제 버튼 상태 확인
      const deleteButton = page.getByRole("button", {
        name: "게시물 삭제",
      });
      const isButtonEnabled = await deleteButton.isEnabled();

      // 삭제 버튼이 비활성화되었는지 확인
      expect(isButtonEnabled).toBeFalsy();
    } catch (e) {
      throw e;
    } finally {
      await page.context().addCookies(cookies);
      await page.goto("/posts");
    }
  });
});

test.describe("Edit Post Test", () => {
  let postPage: string;

  // 테스트 필요한 페이지 작성
  test.beforeAll(async ({ page }) => {
    await page.goto("/posts/create");
    await page.waitForURL("/posts/create", { timeout: 5000 });

    const titleInput = page.locator("input#title");
    const contentTextarea = page.locator("textarea#content");
    const submitButton = page.locator('button[type="submit"]');

    await titleInput.fill("Test Title for edit");
    await contentTextarea.fill("Test Content for edit");

    await submitButton.click();

    await expect(page).toHaveURL("/posts");

    const post = page.getByLabel("Post title: Test Title for edit").first();
    await post.click();

    await expect(page).toHaveURL(/\/posts\/\d+/);

    postPage = new URL(page.url()).pathname;
  });

  test("displays validation errors when fields are empty", async ({ page }) => {
    // 초기 게시물 페이지 방문
    await page.goto(postPage);
    await page.waitForURL(postPage, { timeout: 5000 });

    // 수정 버튼 클릭
    const editLink = page.getByRole("link", { name: "게시물 수정" });
    await editLink.click();
    await expect(page).toHaveURL(/\/posts\/edit\/\d+/);

    // 폼 비우기
    await page.fill("input#title", "");
    await page.fill("textarea#content", "");
    await page.fill("input#videoUrl", "");

    // 폼 제출 시도
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // 에러 메시지 확인
    const titleError = page.locator('p:text("Please enter your title.")');
    const contentError = page.locator('p:text("Please enter your content.")');
    const generalError = page.locator(
      'p:text("Missing Fields. Failed to edit posts.")'
    );

    await expect(titleError).toBeVisible();
    await expect(contentError).toBeVisible();
    await expect(generalError).toBeVisible();
  });

  test("submits the form successfully with valid data", async ({ page }) => {
    // 초기 게시물 페이지 방문
    await page.goto(postPage);
    await expect(page).toHaveURL(postPage);

    // 첫 번째 수정 버튼 클릭
    let editLink = page.getByRole("link", { name: "게시물 수정" });
    await editLink.click();
    await expect(page).toHaveURL(/\/posts\/edit\/\d+/);

    // 폼 데이터 입력 및 제출
    const presentPage = new URL(page.url()).pathname;
    await page.fill("input#title", "Edited Title");
    await page.fill("textarea#content", "Edited content");
    await page.fill("input#videoUrl", "https://youtu.be/editedVideo");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/posts");

    // 다시 게시물 페이지 방문
    await page.goto(postPage);
    await expect(page).toHaveURL(postPage);

    // 두 번째 수정 버튼 클릭
    editLink = page.getByRole("link", { name: "게시물 수정" });
    await editLink.click();
    await expect(page).toHaveURL(presentPage);

    // 입력값 유지 확인
    await expect(page.locator("input#title")).toHaveValue("Edited Title");
    await expect(page.locator("textarea#content")).toHaveValue(
      "Edited content"
    );
    await expect(page.locator("input#videoUrl")).toHaveValue(
      "https://youtu.be/editedVideo"
    );
  });

  test("Edit button should be disabled if userInfo is empty or someone else is different from author in Post Page", async ({
    page,
  }) => {
    // 쿠키(유저 정보) 삭제 및 백업
    const cookies = await page.context().cookies();
    await page.context().clearCookies();
    try {
      // 조회 페이지 방문
      await page.goto(postPage);
      await expect(page).toHaveURL(/\/posts\/\d+/);

      // 편집 버튼 상태 확인
      const editLink = page.getByRole("link", {
        name: "게시물 수정",
      });
      const isLinkEnabled = await editLink.isEnabled();

      // 편집 버튼이 비활성화되었는지 확인
      expect(isLinkEnabled).toBeFalsy();
    } catch (e) {
      throw e;
    } finally {
      await page.context().addCookies(cookies);
      await page.goto("/posts");
    }
  });

  test("NotFound should come out for non-existent posts.", async ({ page }) => {
    await page.goto("/edit/2223345");

    await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "This page could not be found." })
    ).toBeVisible();

    const notFoundText = page.locator("text=This page could not be found.");
    await expect(notFoundText).toBeVisible();
  });

  test("should be redirect to the login page when non-author visits the edit page.", async ({
    page,
  }) => {
    const postId = postPage.match(/\/posts\/(\d+)/)?.[1];
    if (!postId) throw new Error("Invalid postPage URL format");

    const editPage = `/posts/edit/${postId}`;

    // 쿠키(유저 정보) 삭제 및 백업
    const cookies = await page.context().cookies();
    await page.context().clearCookies();
    try {
      // 조회 페이지 방문
      await page.goto(editPage);
      await page.waitForURL("/posts", { timeout: 10000 });
    } catch (e) {
      throw e;
    } finally {
      await page.context().addCookies(cookies);
      await page.goto("/posts");
    }
  });
});
