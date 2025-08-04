import { test, expect } from "@playwright/test";

test.describe("Verifying permissions on bulletin boards E2E test", () => {
  test.beforeEach(async ({ page }) => {
    // 공지 게시판 (편집 ADMIN 권한) 이동
    await page.goto("/boards/notices");
    await page.waitForURL("/boards/notices", { timeout: 5000 });
    await page.reload();
  });

  test("USER permissions user button status verification in ADMIN permissions bulletin", async ({
    page,
  }) => {
    // 1. ADMIN 권한이 필요한 게시판으로 이동
    await page.goto("/boards/notices");

    // 2. 비활성화된 게시물 작성 버튼 표시 없음 확인
    const createButton = page.getByRole("button", {
      name: "게시물 작성",
    });

    await expect(createButton).not.toBeVisible();

    // 3. 첫 번째 게시물로 이동 (실제 게시물 존재를 전제)
    const firstPost = page
      .getByRole("link", {
        name: /Go to post/, // 정규식으로 동적 부분 처리
        exact: false, // 부분 일치 허용
      })
      .first();

    await expect(firstPost).toBeVisible(); // 존재 확인
    await firstPost.click();
    await page.waitForURL(/\/boards\/notices\/\d+/);

    // 4. 수정/삭제 버튼 상태 검증
    const editButton = page.getByRole("link", { name: "수정" });
    const deleteButton = page.getByRole("button", { name: "삭제" });

    // 수정 버튼 검증 (Link 컴포넌트)
    await expect(editButton).toBeVisible();
    await expect(editButton).toHaveAttribute("aria-disabled", "true");
    await expect(editButton).toHaveCSS("color", "rgb(156, 163, 175)"); // gray-400

    // 삭제 버튼 검증 (Button 컴포넌트)
    await expect(deleteButton).toBeVisible();
    await expect(deleteButton).toBeDisabled();
    await expect(deleteButton).toHaveCSS("color", "rgb(107, 114, 128)"); // gray-500
  });
});
