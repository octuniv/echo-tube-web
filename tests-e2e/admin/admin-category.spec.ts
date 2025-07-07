import { test, expect, Page, Locator } from "@playwright/test";
import { loginAsAdmin } from "../util/auth-utils";

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

const TEST_CATEGORY = {
  name: "통합테스트",
  slugs: ["e2e-test", "e2e-test-1"],
};

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
      await expect(page.locator("h1:text('카테고리 관리')")).toBeVisible();

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
      for (const category of CATEGORIES) {
        const row = page.locator(
          `table tbody tr:has(td:text("${category.name}"))`
        );

        await expect(row).toBeVisible();

        const slugCell = row.locator("td").nth(2);
        const slugText = await slugCell.textContent();
        expect(slugText?.includes(category.requiredSlug)).toBe(true);

        const boardCount = parseInt(
          (await row.locator("td").nth(3).textContent()) || "0"
        );
        expect(boardCount).toBeGreaterThanOrEqual(1);
      }
    });

    test("상세, 수정 및 삭제 버튼이 각 카테고리에 표시되어야 합니다", async ({
      page,
    }) => {
      for (const category of CATEGORIES) {
        const row = page.locator(
          `table tbody tr:has(td:text("${category.name}"))`
        );

        await expect(row.locator('a:text("상세")')).toBeVisible();

        await expect(row.locator('a:text("수정")')).toBeVisible();

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
      await page.goto("/admin/categories/999999");

      const mainContainer = page.locator("main.p-4");
      await expect(mainContainer).toBeVisible();

      const errorHeading = mainContainer.locator("h1.next-error-h1");
      await expect(errorHeading).toBeVisible();
      await expect(errorHeading).toContainText("404");

      const errorMessage = mainContainer.locator("h2");
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText("This page could not be found.");
    });
  });

  test.describe("Test Create-Delete Action", () => {
    test.describe("Create Category Form", () => {
      test.beforeEach(async ({ page }) => {
        await page.goto("/admin/categories");
        const createButton = page.locator("a:text('새로운 카테고리 생성')");
        await expect(createButton).toBeVisible();
        await createButton.click();

        await page.waitForURL("/admin/categories/create", { timeout: 3000 });
        await expect(
          page.locator("h1:text('새로운 카테고리 생성')")
        ).toBeVisible();
      });

      test("should show validation errors when submitting empty form", async ({
        page,
      }) => {
        await page.click('button[type="submit"]');

        await expect(
          page.locator(
            "p:text('Missing or invalid fields. Failed to create category.')"
          )
        ).toBeVisible();

        await expect(
          page.locator("p:text('이름은 필수입니다.')")
        ).toBeVisible();

        await expect(
          page.locator("p:text('슬러그는 필수입니다.')")
        ).toBeVisible();
      });

      test("should validate duplicate slugs", async ({ page }) => {
        await page.fill('input[name="name"]', TEST_CATEGORY.name);
        await page.fill(
          'input[name="allowedSlugs"]',
          CATEGORIES[0].requiredSlug
        );

        await page.waitForTimeout(500);

        await expect(
          page.locator("p:text('이미 사용 중인 슬러그입니다.')")
        ).toBeVisible();
      });

      test("should allow adding/removing slug fields", async ({ page }) => {
        await page.click('button:text("+ 슬러그 추가")');
        const slugInputs = page.locator('input[name="allowedSlugs"]');
        await expect(slugInputs).toHaveCount(2);

        await page.click('button:text("✕")');
        await expect(slugInputs).toHaveCount(1);
      });

      test("should successfully create category with valid data", async ({
        page,
      }) => {
        await page.fill('input[name="name"]', TEST_CATEGORY.name);

        await page.click('button:text("+ 슬러그 추가")');

        const slugInputs = page.locator('input[name="allowedSlugs"]');
        await expect(slugInputs).toHaveCount(2);
        await slugInputs.nth(0).fill(TEST_CATEGORY.slugs[0]);
        await slugInputs.nth(1).fill(TEST_CATEGORY.slugs[1]);

        await page.click('button[type="submit"]');

        await expect(page).toHaveURL("/admin/categories");

        const categoryRow = page.locator(
          `table tbody tr:has(td:text("${TEST_CATEGORY.name}"))`
        );
        await expect(categoryRow).toBeVisible();

        const slugCell = categoryRow.locator("td").nth(2);
        await expect(slugCell).toContainText(TEST_CATEGORY.slugs.join(", "));
      });
    });

    test.describe("Delete Category", () => {
      let categoryRow: Locator;

      test.beforeEach(async ({ page }) => {
        await page.goto("/admin/categories");
        categoryRow = page
          .locator(`table tbody tr:has(td:text("${TEST_CATEGORY.name}"))`)
          .first();
      });

      test("should cancel deletion when dialog dismissed", async ({ page }) => {
        const deleteButton = categoryRow.locator('button:text("삭제")');

        page.on("dialog", async (dialog) => await dialog.dismiss());

        await deleteButton.click();

        await expect(categoryRow).toBeVisible();
      });

      test("should successfully delete category", async ({ page }) => {
        const initialCount = await page.locator("table tbody tr").count();
        const deleteButton = categoryRow.locator('button:text("삭제")');

        page.on("dialog", async (dialog) => await dialog.accept());

        await deleteButton.click();

        await page.waitForTimeout(1000);

        const newCount = await page.locator("table tbody tr").count();
        expect(newCount).toBeLessThan(initialCount);
      });
    });
  });
});
