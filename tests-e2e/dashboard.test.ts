import { test, expect } from "@playwright/test";

test.describe("Dashboard Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
    await page.reload();
  });

  test("should access dashboard without login page", async ({ page }) => {
    await expect(page).toHaveURL("/dashboard");
  });

  test.describe("After creating any post", () => {
    const boardTestTitle = "For Dashboard Test";

    test.beforeAll(async ({ page }) => {
      // 자유 게시판 작성 페이지 이동
      await page.goto("/boards/free/create");
      await page.waitForURL("/boards/free/create", { timeout: 5000 });

      // 폼 입력값 채우기
      const titleInput = page.locator("input#title");
      const contentTextarea = page.locator("textarea#content");
      const submitButton = page.locator('button[type="submit"]');

      await titleInput.fill(boardTestTitle);
      await contentTextarea.fill("For Dashboard Test");

      // 폼 제출
      await submitButton.click();

      // 리다이렉션 확인
      await expect(page).toHaveURL("/boards/free");
    });

    test.beforeEach(async ({ page }) => {
      // 대시보드 페이지 이동
      await page.goto("/dashboard");
    });

    test("사용자 인사 메시지 표시", async ({ page }) => {
      await expect(page.getByText(/^안녕하세요, .*님!$/)).toBeVisible();
    });

    test("방문자 수 표시", async ({ page }) => {
      const visitorCount = page.locator('[aria-label="visitorCount"]');
      await expect(visitorCount).toHaveText(/\d+ 명/);
    });

    test("인기 게시물 표시", async ({ page }) => {
      const popularPost = page
        .locator(".bg-white")
        .filter({ hasText: "🔥 인기 게시물" });

      await expect(popularPost.getByRole("link")).toBeVisible();

      await expect(popularPost.getByText(/조회수 \d+/)).toBeVisible();
    });

    test("공지사항 링크 동작", async ({ page }) => {
      await page.waitForSelector("ul.space-y-2");

      const listItem = page.getByRole("listitem", {
        name: /^noticePost : \d+$/i, // 정확한 정규식 패턴
      });

      const noticeLink = listItem.getByRole("link");

      await expect(noticeLink).toHaveAttribute(
        "href",
        /\/boards\/notices\/\d+/
      );

      await noticeLink.click();

      await expect(page).toHaveURL(/\/boards\/notices\/\d+/);
    });

    test("최근 게시물 링크 동작 검증", async ({ page }) => {
      await expect(
        page.locator("text=최근 게시물이 없습니다")
      ).not.toBeVisible();

      const recentPostItem = page
        .getByRole("listitem", {
          name: /recentPost : \d+/i,
        })
        .first();

      const postLink = recentPostItem.getByRole("link");

      await expect(postLink).toHaveAttribute("href", /\/boards\/[^\/]+\/\d+/);

      await postLink.click();

      await expect(page).toHaveURL(/\/boards\/[^\/]+\/\d+/);
    });
  });
});
