import { test, expect, Page } from "@playwright/test";

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

function findPostLink(page: Page, name: string | RegExp) {
  const post = page.getByRole("link", { name }).first();
  return post;
}

test.describe("Create Post Test", () => {
  test.beforeEach(async ({ page }) => {
    // 게시판 목록 이동
    await page.goto("/boards/free");
    await page.waitForURL("/boards/free", { timeout: 5000 });
    await page.reload();
  });

  test("should move create post page when click create post link", async ({
    page,
  }) => {
    // 게시물 작성 버튼 확인
    await expect(page.getByRole("link", { name: "게시물 작성" })).toBeVisible();

    // 게시물 작성 버튼 클릭
    await page.getByRole("link", { name: "게시물 작성" }).click();

    // 게시물 작성 페이지 리다이렉트 확인
    await expect(page).toHaveURL("/boards/free/create");
  });

  test("renders the form correctly", async ({ page }) => {
    // 페이지에 컴포넌트 마운트
    await page.goto("/boards/free/create");
    await page.waitForURL("/boards/free/create", { timeout: 5000 });

    // 폼 요소 확인
    const titleInput = page.locator("input#title");
    const contentTextarea = page.locator("textarea#content");
    const videoUrlInput = page.locator("input#videoUrl");
    const submitButton = page.locator('button[type="submit"]');
    const backButton = page.locator('a[href="/boards/free"] button');

    await expect(titleInput).toBeVisible();
    await expect(contentTextarea).toBeVisible();
    await expect(videoUrlInput).toBeVisible();
    await expect(submitButton).toBeVisible();
    await expect(backButton).toBeVisible();
  });

  test("displays validation errors when fields are empty", async ({ page }) => {
    // 페이지에 컴포넌트 마운트
    await page.goto("/boards/free/create");
    await page.waitForURL("/boards/free/create", { timeout: 5000 });

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
    await page.goto("/boards/free/create");
    await page.waitForURL("/boards/free/create", { timeout: 5000 });

    // 폼 입력값 채우기
    const titleInput = page.locator("input#title");
    const contentTextarea = page.locator("textarea#content");
    const submitButton = page.locator('button[type="submit"]');

    await titleInput.fill("Test Title");
    await contentTextarea.fill("Test Content");

    // 폼 제출
    await submitButton.click();

    // 리다이렉션 확인
    await expect(page).toHaveURL("/boards/free");
  });
});

test.describe("Posts E2E Tests", () => {
  // 게시물 작성 테스트
  const postTitle = "New Post Title";
  test("should create a new post with valid videoUrl", async ({ page }) => {
    await page.goto("/boards/free/create");

    await page.fill("input#title", postTitle);
    await page.fill("textarea#content", "New Post Content");
    await page.fill(
      "input#videoUrl",
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    );

    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/boards/free");

    const newPost = findPostLink(page, postTitle);
    await expect(newPost).toBeVisible();
  });

  // 게시물 상세 페이지 테스트
  test("should navigate to post details page when a post card is clicked", async ({
    page,
  }) => {
    await page.goto("/boards/free");
    const post = findPostLink(page, postTitle);
    await post.click();

    await page.waitForURL(/\/boards\/free\/\d+/, { timeout: 1000 });
    await expect(page.getByText(postTitle)).toBeVisible();
  });

  test("should display embedded YouTube video if valid video URL is provided", async ({
    page,
  }) => {
    await page.goto("/boards/free");
    const post = findPostLink(page, postTitle);
    await post.click();

    const iframe = page.locator('iframe[src*="youtube.com/embed"]');
    await expect(iframe).toBeVisible();
  });

  test("should display error message if invalid video URL is provided", async ({
    page,
  }) => {
    await page.goto("/boards/free/create");

    await page.fill("input#title", "Invalid Video URL Test");
    await page.fill("textarea#content", "Test Content");
    await page.fill("input#videoUrl", "https://invalid-video-url.com");

    await page.click('button[type="submit"]');

    // await page.goto("/boards/free");
    await expect(page).toHaveURL("/boards/free");

    const post = findPostLink(page, "Invalid Video URL Test");
    await post.click();

    await page.waitForURL(/\/boards\/free\/\d+/, { timeout: 1000 });

    await expect(
      page.getByText(
        "비디오를 로드할 수 없습니다. 제공된 링크가 유효하지 않습니다."
      )
    ).toBeVisible();
  });

  test("should raise notfound error if board and post is not pair when access into post", async ({
    page,
  }) => {
    await page.goto("/boards/free/1"); // post 1 is located at notice board

    await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "This page could not be found." })
    ).toBeVisible();

    const notFoundText = page.locator("text=This page could not be found.");
    await expect(notFoundText).toBeVisible();
  });
});

test.describe("Delete Post Tests", () => {
  test("should be able to be deleted post by the author", async ({ page }) => {
    await page.goto("/boards/free/create");

    await page.fill("input#title", "Test to delete this post");
    await page.fill("textarea#content", "Test Content");

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL("/boards/free");

    const post = findPostLink(page, "Test to delete this post");
    await post.click();

    await page.waitForURL(/\/boards\/free\/\d+/, { timeout: 1000 });

    const thisPage = new URL(page.url()).pathname;

    const deleteButton = page.getByRole("button", { name: "게시물 삭제" });
    const isButtonEnabled = await deleteButton.isEnabled();

    expect(isButtonEnabled).toBeTruthy();

    // confirm 대화상자 처리 준비
    page.on("dialog", async (dialog) => {
      await dialog.accept(); // "확인" 버튼 클릭
    });

    await deleteButton.click();

    await expect(page).toHaveURL("/boards/free");

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
    await page.goto("/boards/free/create");

    await page.fill(
      "input#title",
      "Test to confirm that this post cannot be deleted"
    );
    await page.fill("textarea#content", "Test Content");

    await page.click('button[type="submit"]');

    // 게시물 목록 페이지로 리다이렉트 확인
    await expect(page).toHaveURL("/boards/free");

    const cookies = await page.context().cookies();
    await page.context().clearCookies();
    try {
      await page.goto("/boards/free");

      // 특정 게시물 클릭
      const post = page
        .getByText("Test to confirm that this post cannot be deleted")
        .first();
      await post.click();

      // 게시물 상세 페이지 URL 검증
      await page.waitForURL(/\/boards\/free\/\d+/, { timeout: 1000 });

      // 삭제 버튼 상태 확인
      const deleteButton = page.getByRole("button", {
        name: "게시물 삭제",
      });
      const isButtonEnabled = await deleteButton.isEnabled();

      // 삭제 버튼이 비활성화되었는지 확인
      expect(isButtonEnabled).toBeFalsy();
    } catch (e) {
      console.error(e);
      test.fail();
    } finally {
      await page.context().addCookies(cookies);
      await page.goto("/boards/free");
    }
  });
});

test.describe("Edit Post Test", () => {
  let postPage: string;

  // 테스트 필요한 페이지 작성
  test.beforeAll(async ({ page }) => {
    await page.goto("/boards/free/create");
    await page.waitForURL("/boards/free/create", { timeout: 5000 });

    const titleInput = page.locator("input#title");
    const contentTextarea = page.locator("textarea#content");
    const submitButton = page.locator('button[type="submit"]');

    await titleInput.fill("Test Title for edit");
    await contentTextarea.fill("Test Content for edit");

    await submitButton.click();

    await expect(page).toHaveURL("/boards/free");

    const post = findPostLink(page, "Test Title for edit");
    await post.click();

    await page.waitForURL(/\/boards\/free\/\d+/, { timeout: 1000 });

    postPage = new URL(page.url()).pathname;
  });

  test("displays validation errors when fields are empty", async ({ page }) => {
    // 초기 게시물 페이지 방문
    await page.goto(postPage);
    await page.waitForURL(postPage, { timeout: 5000 });

    // 수정 버튼 클릭
    const editLink = page.getByRole("link", { name: "게시물 수정" });
    await editLink.click();
    await expect(page).toHaveURL(/\/boards\/free\/edit\/\d+/);

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
    await expect(page).toHaveURL(/\/boards\/free\/edit\/\d+/);

    // 폼 데이터 입력 및 제출
    const presentPage = new URL(page.url()).pathname;
    await page.fill("input#title", "Edited Title");
    await page.fill("textarea#content", "Edited content");
    await page.fill("input#videoUrl", "https://youtu.be/editedVideo");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/boards/free");

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
      await page.waitForURL(/\/boards\/free\/\d+/, { timeout: 1000 });

      // 편집 버튼 상태 확인
      const editLink = page.getByRole("link", {
        name: "게시물 수정",
      });
      const isLinkEnabled = await editLink.isEnabled();

      // 편집 버튼이 비활성화되었는지 확인
      expect(isLinkEnabled).toBeFalsy();
    } catch (e) {
      console.error(e);
      test.fail();
    } finally {
      await page.context().addCookies(cookies);
      await page.goto("/boards/free");
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
    const postId = postPage.match(/\/boards\/free\/(\d+)/)?.[1];
    if (!postId) throw new Error("Invalid postPage URL format");

    const editPage = `/boards/free/edit/${postId}`;

    // 쿠키(유저 정보) 삭제 및 백업
    const cookies = await page.context().cookies();
    await page.context().clearCookies();
    try {
      // 조회 페이지 방문
      await page.goto(editPage);
      await page.waitForURL("/boards/free", { timeout: 10000 });
    } catch (e) {
      console.error(e);
      test.fail();
    } finally {
      await page.context().addCookies(cookies);
      await page.goto("/boards/free");
    }
  });
});

test.describe("Pagination Tests", () => {
  const POST_TITLE_PREFIX = "Pagination Test Post";
  const POST_SLUG_FOR_THIS_TEST = "paginationtest";

  test("should display correct number of posts per page when limit is 5", async ({
    page,
  }) => {
    // 게시판 목록 페이지로 이동
    await page.goto(`/boards/${POST_SLUG_FOR_THIS_TEST}`);
    await page.waitForURL(`/boards/${POST_SLUG_FOR_THIS_TEST}`, {
      timeout: 5000,
    });

    // Limit을 5로 설정
    await page.selectOption('select[id="limit-select"]', { value: "5" });

    // URL 확인
    await expect(page).toHaveURL(
      new RegExp(`/boards/${POST_SLUG_FOR_THIS_TEST}\\?.*page=1.*limit=5`)
    );

    // 첫 번째 페이지에 생성한 게시물이 모두 표시되는지 확인
    // POST_TITLE_PREFIX가 포함된 서로 다른 5개의 게시물이 있는지 확인
    const postTitles = await page
      .locator(`text=${POST_TITLE_PREFIX}`)
      .allTextContents();

    // PREFIX 뒤에 오는 숫자들을 추출하여 5개의 서로 다른 숫자가 있는지 확인
    const postNumbers = postTitles
      .map((title) => {
        const match = title.match(new RegExp(`${POST_TITLE_PREFIX}\\s*(\\d+)`));
        return match ? parseInt(match[1]) : null;
      })
      .filter((num) => num !== null);

    // 중복 제거를 위해 Set 사용
    const uniqueNumbers = new Set(postNumbers);

    // 서로 다른 5개의 숫자가 존재하는지 확인
    expect(uniqueNumbers.size).toBe(5);

    // 각 게시물이 실제로 화면에 보이는지 확인
    for (const number of uniqueNumbers) {
      await expect(
        page.getByRole("link", { name: `${POST_TITLE_PREFIX} ${number}` })
      ).toBeVisible();
    }

    // 페이지네이션 버튼 확인
    const paginationButtons = page.locator("div.flex.justify-center a");
    await expect(paginationButtons).toHaveCount(2); // 총 2페이지
    await expect(paginationButtons.nth(0)).toHaveClass(/bg-blue-500/); // 현재 페이지 강조
    await expect(paginationButtons.nth(1)).toHaveClass(/bg-gray-200/);
  });

  test("should navigate to second page and display remaining posts", async ({
    page,
  }) => {
    // 게시판 목록 페이지로 이동
    await page.goto(`/boards/${POST_SLUG_FOR_THIS_TEST}`);
    await page.waitForURL(`/boards/${POST_SLUG_FOR_THIS_TEST}`, {
      timeout: 5000,
    });

    // Limit을 5로 설정
    await page.selectOption('select[id="limit-select"]', { value: "5" });

    // 두 번째 페이지로 이동
    const paginationButtons = page.locator("div.flex.justify-center a");
    await paginationButtons.nth(1).click();

    // URL 확인
    await expect(page).toHaveURL(
      new RegExp(`/boards/${POST_SLUG_FOR_THIS_TEST}\\?.*page=2.*limit=5`)
    );

    // 두 번째 페이지에 1개의 게시물만 표시되는지 확인
    const postTitles = await page
      .locator(`h2:has-text("${POST_TITLE_PREFIX}")`)
      .allTextContents();

    // 이후 검증 로직은 동일하게 사용
    expect(postTitles.length).toBe(1);

    // 6번째 게시물이 표시되는지 확인
    await expect(
      page.getByText(new RegExp(`${POST_TITLE_PREFIX}\\s*(\\d+)`))
    ).toBeVisible();

    // 현재 페이지가 2로 표시되는지 확인
    const currentPageButton = page.locator(
      `div.flex.justify-center a:has-text("2")`
    );
    await expect(currentPageButton).toHaveClass(/bg-blue-500/);
  });

  test("should display all posts on one page when limit is 10", async ({
    page,
  }) => {
    // 게시판 목록 페이지로 이동
    await page.goto(`/boards/${POST_SLUG_FOR_THIS_TEST}`);
    await page.waitForURL(`/boards/${POST_SLUG_FOR_THIS_TEST}`, {
      timeout: 5000,
    });

    // Limit을 10으로 설정
    await page.selectOption('select[id="limit-select"]', { value: "10" });

    await expect(page).toHaveURL(
      new RegExp(`/boards/${POST_SLUG_FOR_THIS_TEST}\\?.*page=1.*limit=10`)
    );

    // 첫 번째 페이지에 생성한 게시물이 모두 표시되는지 확인
    // POST_TITLE_PREFIX가 포함된 서로 다른 6개의 게시물이 있는지 확인
    const postTitles = await page
      .locator(`text=${POST_TITLE_PREFIX}`)
      .allTextContents();

    // PREFIX 뒤에 오는 숫자들을 추출하여 6개의 서로 다른 숫자가 있는지 확인
    const postNumbers = postTitles
      .map((title) => {
        const match = title.match(new RegExp(`${POST_TITLE_PREFIX}\\s*(\\d+)`));
        return match ? parseInt(match[1]) : null;
      })
      .filter((num) => num !== null);

    // 중복 제거를 위해 Set 사용
    const uniqueNumbers = new Set(postNumbers);

    // 서로 다른 5개의 숫자가 존재하는지 확인
    expect(uniqueNumbers.size).toBe(6);

    // 각 게시물이 실제로 화면에 보이는지 확인
    for (const number of uniqueNumbers) {
      await expect(
        page.getByRole("link", { name: `${POST_TITLE_PREFIX} ${number}` })
      ).toBeVisible();
    }

    // 페이지네이션 버튼이 1개만 표시되는지 확인 (총 1페이지)
    const paginationButtons = page.locator("div.flex.justify-center a");
    await expect(paginationButtons).toHaveCount(1);
    await expect(paginationButtons.nth(0)).toHaveClass(/bg-blue-500/);
  });

  test("should maintain limit setting when navigating between pages", async ({
    page,
  }) => {
    // 게시판 목록 페이지로 이동
    await page.goto(`/boards/${POST_SLUG_FOR_THIS_TEST}`);
    await page.waitForURL(`/boards/${POST_SLUG_FOR_THIS_TEST}`, {
      timeout: 5000,
    });

    // Limit을 5로 설정
    await page.selectOption('select[id="limit-select"]', { value: "5" });

    // 두 번째 페이지로 이동
    const paginationButtons = page.locator("div.flex.justify-center a");
    await paginationButtons.nth(1).click();

    // URL 확인
    await expect(page).toHaveURL(
      new RegExp(`/boards/${POST_SLUG_FOR_THIS_TEST}\\?.*page=2.*limit=5`)
    );

    // Limit이 유지되는지 확인
    const limitSelector = page.locator('select[id="limit-select"]');
    await expect(limitSelector).toHaveValue("5");
  });

  test("should reset to first page when limit is changed", async ({ page }) => {
    // 게시판 목록 페이지로 이동
    await page.goto(`/boards/${POST_SLUG_FOR_THIS_TEST}?page=2&limit=5`);
    await page.waitForURL(
      new RegExp(`/boards/${POST_SLUG_FOR_THIS_TEST}\\?.*page=2.*limit=5`),
      { timeout: 5000 }
    );

    // Limit을 10으로 변경
    await page.selectOption('select[id="limit-select"]', { value: "10" });

    // URL이 첫 번째 페이지로 리셋되었는지 확인
    await expect(page).toHaveURL(
      new RegExp(`/boards/${POST_SLUG_FOR_THIS_TEST}\\?.*page=1.*limit=10`)
    );

    // 첫 번째 페이지에 모든 게시물이 표시되는지 확인
    const posts = page.locator('a[aria-label^="Go to post"]');
    await expect(posts).toHaveCount(6);
  });

  test("should maintain correct page count after deleting a post", async ({
    page,
  }) => {
    let isPostDeleted = false;
    let deletedPostTitle = "";

    try {
      // 게시판 목록 페이지로 이동
      await page.goto(`/boards/${POST_SLUG_FOR_THIS_TEST}`);
      await page.waitForURL(`/boards/${POST_SLUG_FOR_THIS_TEST}`, {
        timeout: 5000,
      });

      // 첫번째 게시글 클릭 (삭제할 게시글 찾기)
      const post = findPostLink(
        page,
        new RegExp(`${POST_TITLE_PREFIX}\\s*(\\d+)`)
      );
      // 삭제할 게시글의 제목 저장
      const postTitleElement = post.locator("h2"); // 제목이 들어 있는 h2 태그
      await postTitleElement.waitFor(); // 요소가 로드될 때까지 대기
      deletedPostTitle = (await postTitleElement.textContent()) || "";
      if (!deletedPostTitle) {
        throw new Error("Could not determine the title of the post to delete.");
      }

      await post.click();
      await page.waitForURL(
        new RegExp(`/boards/${POST_SLUG_FOR_THIS_TEST}/\\d+`),
        { timeout: 1000 }
      );

      // 게시물 삭제
      const deleteButton = page.getByRole("button", { name: "게시물 삭제" });
      page.on("dialog", async (dialog) => {
        await dialog.accept();
      });
      await deleteButton.click();

      // 첫 번째 페이지로 리다이렉트 확인
      await expect(page).toHaveURL(`/boards/${POST_SLUG_FOR_THIS_TEST}`);

      // Limit을 5로 변경
      await page.selectOption('select[id="limit-select"]', { value: "5" });
      await expect(page).toHaveURL(
        new RegExp(`/boards/${POST_SLUG_FOR_THIS_TEST}\\?.*page=1.*limit=5`)
      );

      // 페이지네이션 버튼이 1개만 표시되는지 확인 (총 1페이지)
      const updatedPaginationButtons = page.locator(
        "div.flex.justify-center a"
      );
      await expect(updatedPaginationButtons).toHaveCount(1);

      // 5개의 게시물이 표시되는지 확인
      const posts = page.locator('a[aria-label^="Go to post"]');
      await expect(posts).toHaveCount(5);

      isPostDeleted = true; // 삭제 성공 표시
    } finally {
      // 테스트 성공 여부와 관계없이, 테스트가 끝난 후 게시글 복구 시도
      if (isPostDeleted && deletedPostTitle) {
        try {
          console.log(
            `Attempting to restore deleted post: ${deletedPostTitle}`
          );
          // 게시물 작성 페이지로 이동
          await page.goto(`/boards/${POST_SLUG_FOR_THIS_TEST}/create`);
          await page.waitForURL(`/boards/${POST_SLUG_FOR_THIS_TEST}/create`, {
            timeout: 5000,
          });

          // 삭제된 게시글의 제목과 내용을 기반으로 새 게시글 작성
          // 제목에서 번호 추출 (예: "Pagination Test Post 3" -> "3")
          const titleMatch = deletedPostTitle.match(
            new RegExp(`${POST_TITLE_PREFIX}\\s*(\\d+)`)
          );
          const postNumber = titleMatch ? titleMatch[1] : "RESTORED";

          const restoredTitle = `${POST_TITLE_PREFIX} ${postNumber}`;
          const restoredContent = `Content for pagination test post ${postNumber} (Restored)`;

          await page.fill("input#title", restoredTitle);
          await page.fill("textarea#content", restoredContent);

          // 폼 제출
          await page.click('button[type="submit"]');

          // 작성 후 게시판 목록 페이지로 리다이렉션 확인
          await expect(page).toHaveURL(`/boards/${POST_SLUG_FOR_THIS_TEST}`, {
            timeout: 10000,
          });
          console.log(`Successfully restored post: ${restoredTitle}`);

          const restoredPostLink = findPostLink(page, restoredTitle);
          await expect(restoredPostLink).toBeVisible();
        } catch (restoreError) {
          console.error("Failed to restore the deleted post:", restoreError);
        }
      }
    }
  });
});
