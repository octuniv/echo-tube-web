import { test, expect, Page, Locator } from "@playwright/test";
import { loginAsAdmin } from "../util/auth-utils";
import { ERROR_MESSAGES } from "@/lib/constants/errorMessage";

// 테스트에 사용할 카테고리 데이터
const CATEGORIES = [
  {
    name: "커뮤니티",
    requiredSlug: "free",
  },
  {
    name: "공지사항",
    requiredSlug: "notices",
  },
  {
    name: "SCRAPER",
    requiredSlug: "nestjs",
  },
];

// 관리자 권한으로 로그인한 상태에서 테스트 실행
test.describe("Admin Category Management E2E Tests", () => {
  test.beforeEach(async ({ page, context }) => {
    await loginAsAdmin({ page, context });
    await page.goto("/admin/categories");
    await page.waitForURL("/admin/categories");
  });

  test.describe("카테고리 목록 표시 검증", () => {
    test("페이지 제목과 생성 버튼이 올바르게 표시되어야 합니다", async ({
      page,
    }) => {
      // 페이지 제목 확인
      await expect(page.locator("h1:text('카테고리 관리')")).toBeVisible();

      // "새로운 카테고리 생성" 버튼 확인
      const createButton = page.locator("a:text('새로운 카테고리 생성')");
      await expect(createButton).toBeVisible();
      await expect(createButton).toHaveAttribute(
        "href",
        "/admin/categories/create"
      );
    });

    test("테이블 헤더가 올바르게 표시되어야 합니다", async ({ page }) => {
      const headers = ["ID", "이름", "허용 슬러그", "게시판 수", "작업"];

      for (const header of headers) {
        await expect(page.locator(`th:text('${header}')`)).toBeVisible();
      }
    });

    test("기대한 카테고리들이 테이블에 표시되어야 합니다", async ({ page }) => {
      // 각 카테고리 항목 확인
      for (const category of CATEGORIES) {
        // 카테고리 이름이 포함된 행 찾기
        const row = page.locator(
          `table tbody tr:has(td:text("${category.name}"))`
        );

        // 행이 존재하는지 확인
        await expect(row).toBeVisible();

        // 필수 슬러그가 포함되어 있는지 확인 (정확한 일치 여부는 검사하지 않음)
        const slugCell = row.locator("td").nth(2);
        const slugText = await slugCell.textContent();
        expect(slugText?.includes(category.requiredSlug)).toBe(true);

        // 게시판 수가 1 이상인지 확인
        const boardCount = parseInt(
          (await row.locator("td").nth(3).textContent()) || "0"
        );
        expect(boardCount).toBeGreaterThanOrEqual(1);
      }
    });

    test("상세, 수정 및 삭제 버튼이 각 카테고리에 표시되어야 합니다", async ({
      page,
    }) => {
      // 각 카테고리 항목 확인
      for (const category of CATEGORIES) {
        // 카테고리 이름이 포함된 행 찾기
        const row = page.locator(
          `table tbody tr:has(td:text("${category.name}"))`
        );

        // 상세 링크 확인
        await expect(row.locator('a:text("상세")')).toBeVisible();

        // 수정 링크 확인
        await expect(row.locator('a:text("수정")')).toBeVisible();

        // 삭제 버튼 확인
        await expect(row.locator('button:text("삭제")')).toBeVisible();
      }
    });
  });

  test.describe("Category Details Page", () => {
    test.beforeEach(async ({ page, context }) => {
      await page.goto("/admin/categories");
      await page.waitForURL("/admin/categories");
    });
    test("should navigate to category details page when clicking '상세' link", async ({
      page,
    }) => {
      const firstCategoryRow = page.locator("table tbody tr").first();

      const categoryId = await firstCategoryRow
        .locator("td")
        .first()
        .textContent();

      let categoryTitle = await firstCategoryRow
        .locator("td")
        .nth(1)
        .textContent();
      if (categoryTitle === null) {
        throw new Error("categoryTitle is null");
      }
      expect(typeof categoryTitle).toBe("string");
      categoryTitle = categoryTitle as string;

      await firstCategoryRow.locator('a:text("상세")').click();

      await expect(page).toHaveURL(
        new RegExp(`/admin/categories/${categoryId}`)
      );

      const categoryTitleInDetailPage = page.locator("h1");
      await expect(categoryTitleInDetailPage).toBeVisible();
      await expect(categoryTitleInDetailPage).toContainText(categoryTitle);
    });

    test("should display correct category metadata", async ({ page }) => {
      await page
        .locator("table tbody tr")
        .first()
        .locator('a:text("상세")')
        .click();

      await expect(
        page.locator('[aria-label="MetadataCard : Category Name"]')
      ).toBeVisible();
      await expect(
        page.locator('[aria-label="MetadataCard : Allowed Slugs"]')
      ).toBeVisible();
      await expect(
        page.locator('[aria-label="MetadataCard : Created At"]')
      ).toBeVisible();
      await expect(
        page.locator('[aria-label="MetadataCard : Updated At"]')
      ).toBeVisible();

      await expect(
        page.locator(
          '[aria-label="MetadataCard : Category Name"] h3:text("Category Name")'
        )
      ).toBeVisible();

      await expect(
        page.locator(
          '[aria-label="MetadataCard : Allowed Slugs"] h3:text("Allowed Slugs")'
        )
      ).toBeVisible();

      await expect(
        page.locator(
          '[aria-label="MetadataCard : Created At"] h3:text("Created At")'
        )
      ).toBeVisible();
      await expect(
        page.locator('[aria-label="MetadataCard : Created At"] p')
      ).toBeVisible();

      await expect(
        page.locator(
          '[aria-label="MetadataCard : Updated At"] h3:text("Updated At")'
        )
      ).toBeVisible();
      await expect(
        page.locator('[aria-label="MetadataCard : Updated At"] p')
      ).toBeVisible();
    });

    test("should display associated boards correctly", async ({ page }) => {
      await page
        .locator("table tbody tr")
        .first()
        .locator('a:text("상세")')
        .click();

      await expect(page.locator("h2:text('Associated Boards')")).toBeVisible();

      const expectedHeaders = ["ID", "Name", "Slug", "Type", "Required Role"];
      for (const header of expectedHeaders) {
        await expect(page.locator(`th:text('${header}')`)).toBeVisible();
      }

      await expect(page.locator('[aria-label="BoardList"]')).toBeVisible();

      const boardRows = page.locator('[aria-label="BoardList"] tbody tr');
      const boardCount = await boardRows.count();

      if (boardCount > 0) {
        for (let i = 0; i < boardCount; i++) {
          const cells = boardRows.nth(i).locator("td");
          await expect(cells).toHaveCount(5);

          const idText = await cells.nth(0).textContent();
          expect(!isNaN(parseInt(idText || "NaN"))).toBeTruthy();

          await expect(cells.nth(1)).not.toHaveText("");

          const slugText = await cells.nth(2).textContent();
          expect(slugText).toMatch(/^[A-Za-z0-9-]+$/);

          const typeText = await cells.nth(3).textContent();
          expect(["general", "ai_digest"]).toContain(typeText?.toLowerCase());

          const roleText = await cells.nth(4).textContent();
          expect(["admin", "user", "bot"]).toContain(roleText?.toLowerCase());
        }
      } else {
        await expect(page.locator("div.text-center.py-12")).toBeVisible();
        await expect(
          page.locator("p:text('No boards associated with this category')")
        ).toBeVisible();
      }
    });

    // Test case: Verify "Go to categories" button functionality
    test("should navigate back to categories page when clicking 'Go to categories' button", async ({
      page,
    }) => {
      await page
        .locator("table tbody tr")
        .first()
        .locator('a:text("상세")')
        .click();

      await page.locator('a:text("Go to categories")').click();

      await expect(page).toHaveURL("/admin/categories");
      await expect(page.locator("h1:text('카테고리 관리')")).toBeVisible();
    });

    test("should handle category not found", async ({ page }) => {
      await page.goto("/admin/categories/999999"); // Assuming this ID doesn't exist

      const mainContainer = page.locator("main.p-4");
      await expect(mainContainer).toBeVisible();

      // Verify 404 heading
      const errorHeading = mainContainer.locator("h1.next-error-h1");
      await expect(errorHeading).toBeVisible();
      await expect(errorHeading).toContainText("404");

      // Verify error message
      const errorMessage = mainContainer.locator("h2");
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText("This page could not be found.");
    });
  });
  /*
  test.describe("카테고리 삭제 기능 검증", () => {
    test("삭제 확인 대화상자를 취소하면 카테고리가 삭제되지 않아야 합니다", async ({ page }) => {
      // 첫 번째 카테고리 행 선택
      const firstCategoryRow = page.locator("table tbody tr").first();
      
      // 삭제 버튼 클릭
      await firstCategoryRow.locator('button:text("삭제")').click();
      
      // 대화상자 취소
      page.on("dialog", async (dialog) => {
        await dialog.dismiss();
      });
      
      // 카테고리가 여전히 표시되는지 확인
      await expect(firstCategoryRow).toBeVisible();
    });

    test("삭제 확인을 하면 카테고리가 성공적으로 삭제되어야 합니다", async ({ page }) => {
      // 테스트용 카테고리 생성
      const testCategoryName = "테스트 카테고리";
      
      // 테스트 카테고리 생성
      await page.getByRole("link", { name: "새로운 카테고리 생성" }).click();
      await page.waitForURL("/admin/categories/create");
      
      await page.fill('input[name="name"]', testCategoryName);
      await page.fill('input[name="allowedSlugs"]', "test-slug");
      
      await page.click('button[type="submit"]');
      await page.waitForURL("/admin/categories");
      
      // 생성된 카테고리 행
      const categoryRow = page.locator(`table tbody tr:has(td:text("${testCategoryName}"))`);
      
      // 카테고리 행이 표시되는지 확인
      await expect(categoryRow).toBeVisible();
      
      // 삭제 버튼 클릭
      await categoryRow.locator('button:text("삭제")').click();
      
      // 대화상자 확인
      page.on("dialog", async (dialog) => {
        await dialog.accept();
      });
      
      // 페이지 새로고침
      await page.reload();
      
      // 카테고리가 더 이상 표시되지 않는지 확인
      await expect(categoryRow).toBeHidden();
    });
  });

  test.describe("카테고리 수정 기능 검증", () => {
    test("수정 링크를 클릭하면 올바른 URL로 이동해야 합니다", async ({ page }) => {
      // 첫 번째 카테고리의 ID 추출
      const firstCategoryRow = page.locator("table tbody tr").first();
      const categoryId = await firstCategoryRow.locator("td").first().textContent();
      
      // 수정 링크 클릭
      await firstCategoryRow.locator('a:text("수정")').click();
      
      // URL이 올바른 형식인지 확인
      await expect(page).toHaveURL(new RegExp(`/admin/categories/${categoryId}/edit`));
    });
  });
  */
});
