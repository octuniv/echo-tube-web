import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "../util/auth-utils";
import { BoardPurpose, UserRole } from "@/lib/definition";

const initState = {
  커뮤니티: [
    {
      name: "자유 게시판",
      slug: "free",
      requiredRole: UserRole.USER,
      type: BoardPurpose.GENERAL,
    },
  ],
  공지사항: [
    {
      name: "공지 게시판",
      slug: "notices",
      requiredRole: UserRole.ADMIN,
      type: BoardPurpose.GENERAL,
    },
  ],
  SCRAPER: [
    {
      name: "NESTJS",
      slug: "nestjs",
      requiredRole: UserRole.BOT,
      type: BoardPurpose.AI_DIGEST,
    },
  ],
};

test.describe("Admin Board Management E2E Tests", () => {
  test.beforeEach(async ({ page, context }) => {
    await loginAsAdmin({ page, context });
    await page.goto("/admin/boards");
    await page.waitForURL("/admin/boards");
  });

  test("게시판 목록이 초기 데이터와 일치하는지 검증", async ({ page }) => {
    for (const [categoryName, boards] of Object.entries(initState)) {
      const categoryHeading = page.getByText(categoryName).first();
      await categoryHeading.waitFor();

      const categoryTable = page.locator(
        `table[data-category='${categoryName}']`
      );

      const rows = categoryTable.locator("tbody tr");
      await expect(rows).toHaveCount(boards.length);

      for (const board of boards) {
        await expect(
          categoryTable
            .locator("td[data-role='name']")
            .filter({ hasText: board.name })
        ).toBeVisible();
        await expect(
          categoryTable
            .locator("td[data-role='slug']")
            .filter({ hasText: board.slug })
        ).toBeVisible();
        await expect(
          categoryTable
            .locator("td[data-role='requiredRole']")
            .filter({ hasText: board.requiredRole })
        ).toBeVisible();
        await expect(
          categoryTable
            .locator("td[data-role='type']")
            .filter({ hasText: board.type })
        ).toBeVisible();
      }
    }
  });

  test("상세 버튼 클릭 시 해당 게시판 상세 페이지로 이동", async ({ page }) => {
    await page.getByRole("link", { name: "상세" }).first().click();

    await page.waitForURL(/\/admin\/boards\/\d+/);

    const board = initState.커뮤니티[0];
    await expect(page.locator("h1")).toHaveText(board.name);
    await expect(page.getByText(board.slug)).toBeVisible();
    await expect(page.getByText(board.requiredRole)).toBeVisible();
    await expect(page.getByText(board.type)).toBeVisible();

    await expect(page.getByText("Active")).toBeVisible();
  });
});
