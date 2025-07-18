import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "../util/auth-utils";
import { BoardPurpose, UserRole } from "@/lib/definition";
import { clickSideBarBoard } from "../util/test-utils";
import { BOARD_ERROR_MESSAGES } from "@/lib/constants/board/errorMessage";

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

test.describe.configure({ mode: "serial" });

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

  test.describe("보드 생성-편집-삭제 테스트", () => {
    // 테스트 카테고리 생성
    const TEST_CATEGORY = {
      name: "testCategory",
      slugs: ["testboard1", "testboard2"],
    };
    let TEST_CATEGORY_ID: number | null = null;

    const TEST_BOARD = {
      name: "testBoard",
    };

    test.beforeAll(async ({ page, context }) => {
      await loginAsAdmin({ page, context });
      await page.goto("/admin/categories/create");
      await page.waitForURL("/admin/categories/create");

      await page.fill('input[name="name"]', TEST_CATEGORY.name);

      await page.click('button:text("+ 슬러그 추가")');

      const slugInputs = page.locator('input[name="allowedSlugs"]');
      await expect(slugInputs).toHaveCount(2);
      await slugInputs.nth(0).fill(TEST_CATEGORY.slugs[0]);
      await slugInputs.nth(1).fill(TEST_CATEGORY.slugs[1]);

      await page.waitForTimeout(500);

      await expect(
        page.locator("p:text('사용 가능한 이름입니다.')")
      ).toBeVisible();

      await expect(
        page.locator("p:text('사용 가능한 슬러그입니다.')")
      ).toBeVisible();

      await page.click('button[type="submit"]');

      await expect(page).toHaveURL("/admin/categories");

      const categoryRow = page
        .locator(`table tbody tr:has(td:text("${TEST_CATEGORY.name}"))`)
        .first();
      await expect(categoryRow).toBeVisible();

      const slugCell = categoryRow.locator("td").nth(2);
      await expect(slugCell).toContainText(TEST_CATEGORY.slugs.join(", "));

      const categoryIdCell = categoryRow.locator("td").first();
      const categoryIdText = await categoryIdCell.textContent();

      TEST_CATEGORY_ID = parseInt(categoryIdText || "0", 10);
      expect(TEST_CATEGORY_ID).toBeGreaterThan(0);
    });

    test.afterAll(async ({ page, context }) => {
      await loginAsAdmin({ page, context });
      await page.goto("/admin/categories");
      await page.waitForURL("/admin/categories");

      const categoryRow = page
        .locator(`table tbody tr:has(td:text("${TEST_CATEGORY.name}"))`)
        .first();
      await expect(categoryRow).toBeVisible();

      const deleteButton = categoryRow.locator('button:text("삭제")');

      page.on("dialog", async (dialog) => await dialog.accept());

      await deleteButton.click();

      await page.waitForTimeout(1000);

      await expect(categoryRow).not.toBeVisible();
    });

    test.beforeEach(async ({ page }) => {
      await page.goto("/admin/boards");
      await page.waitForURL("/admin/boards");
    });

    test("보드 생성 테스트", async ({ page }) => {
      const createButton = page.locator("a:text('새로운 보드 생성')");
      await expect(createButton).toBeVisible();
      await createButton.click();

      await expect(page).toHaveURL("/admin/boards/create");

      if (!TEST_CATEGORY_ID || isNaN(TEST_CATEGORY_ID)) {
        throw Error("Error from creating test category");
      }
      // 1. 카테고리 선택
      await page.selectOption('select[name="categoryId"]', {
        value: TEST_CATEGORY_ID.toString(),
      });

      // 2. 슬러그 select가 업데이트될 때까지 대기
      await page.waitForTimeout(500);

      // 3. TEST_CATEGORY의 slugs 중 testboard1을 slug로 선택
      await page.selectOption('select[name="slug"]', {
        value: TEST_CATEGORY.slugs[0],
      });

      // 4. name 칸에 TEST_BOARD의 name 값 입력
      await page.fill('input[name="name"]', TEST_BOARD.name);

      // 설명(선택) 필드는 비워두고 기본값 유지
      // 필요한 역할은 기본값(USER) 유지
      // 게시판 타입도 기본값(GENERAL) 유지

      // 폼 제출
      await page.click('button[type="submit"]');

      // 관리자 보드 목록 페이지로 리다이렉트 확인
      await expect(page).toHaveURL("/admin/boards");

      // 생성된 게시판 확인
      const categoryTable = page.locator(
        `table[data-category='${TEST_CATEGORY.name}']`
      );
      const rows = categoryTable.locator("tbody tr");
      await expect(rows).toHaveCount(1);

      await expect(
        categoryTable
          .locator("td[data-role='name']")
          .filter({ hasText: TEST_BOARD.name })
      ).toBeVisible();

      await expect(
        categoryTable
          .locator("td[data-role='slug']")
          .filter({ hasText: TEST_CATEGORY.slugs[0] })
      ).toBeVisible();

      await clickSideBarBoard(
        page,
        TEST_CATEGORY.name,
        TEST_BOARD.name,
        TEST_CATEGORY.slugs[0]
      );
    });

    test("보드 편집 테스트", async ({ page }) => {
      const categoryTable = page.locator(
        `table[data-category='${TEST_CATEGORY.name}']`
      );

      // 1. 수정 링크 클릭
      const editLink = categoryTable
        .locator("tbody tr")
        .locator("td")
        .filter({ hasText: TEST_BOARD.name })
        .locator("..") // tr로 상위 요소 이동
        .locator("td a:text('수정')");

      await expect(editLink).toBeVisible();
      await editLink.click();

      // 2. URL 검증
      await expect(page).toHaveURL(/\/admin\/boards\/edit\/\d+/);

      // 3. 기존 값 검증
      const categoryId = await page
        .locator("select[name='categoryId']")
        .inputValue();
      expect(parseInt(categoryId)).toBe(TEST_CATEGORY_ID);

      const currentSlug = await page
        .locator("select[name='slug']")
        .inputValue();
      expect(currentSlug).toBe(TEST_CATEGORY.slugs[0]);

      // 4. 슬러그 변경
      await page.selectOption('select[name="slug"]', {
        value: TEST_CATEGORY.slugs[1],
      });

      // 5. 폼 제출
      await page.click('button[type="submit"]');

      // 6. 리다이렉트 확인
      await expect(page).toHaveURL("/admin/boards");

      // 7. 수정된 슬러그 검증
      const updatedCategoryTable = page.locator(
        `table[data-category='${TEST_CATEGORY.name}']`
      );

      await expect(
        updatedCategoryTable
          .locator("td[data-role='slug']")
          .filter({ hasText: TEST_CATEGORY.slugs[1] })
      ).toBeVisible();

      await clickSideBarBoard(
        page,
        TEST_CATEGORY.name,
        TEST_BOARD.name,
        TEST_CATEGORY.slugs[1]
      );
    });

    test("보드 폼 권한 부족 오류 확인 테스트", async ({ page }) => {
      const categoryTable = page.locator(
        `table[data-category='${TEST_CATEGORY.name}']`
      );

      const editLink = categoryTable
        .locator("tbody tr")
        .locator("td")
        .filter({ hasText: TEST_BOARD.name })
        .locator("..") // tr로 상위 요소 이동
        .locator("td a:text('수정')");

      await expect(editLink).toBeVisible();
      await editLink.click();

      await expect(page).toHaveURL(/\/admin\/boards\/edit\/\d+/);

      await page.selectOption('select[name="requiredRole"]', {
        value: UserRole.USER,
      });

      const currentRole = await page
        .locator('select[name="requiredRole"]')
        .inputValue();
      expect(currentRole).toBe(UserRole.USER);

      await page.selectOption('select[name="type"]', {
        value: BoardPurpose.AI_DIGEST,
      });

      const currentType = await page
        .locator('select[name="type"]')
        .inputValue();
      expect(currentType).toBe(BoardPurpose.AI_DIGEST);

      await page.click('button[type="submit"]');

      await expect(page).not.toHaveURL("/admin/boards");

      const typeErrorParagraph = page.locator('select[name="type"] + p', {
        hasText: BOARD_ERROR_MESSAGES.NOT_ALLOWED_BOARD_TYPE,
      });
      await expect(typeErrorParagraph).toBeVisible();

      // 전체 상태 메시지 검증
      const generalMessage = page.locator("div.text-sm.text-red-600", {
        hasText: BOARD_ERROR_MESSAGES.NOT_ALLOWED_BOARD_TYPE,
      });
      await expect(generalMessage).toBeVisible();
    });

    test("보드 삭제 테스트", async ({ page }) => {
      const categoryTable = page.locator(
        `table[data-category='${TEST_CATEGORY.name}']`
      );

      await expect(categoryTable).toBeVisible();

      // 1. 삭제 버튼 클릭
      const deleteButton = categoryTable
        .locator("tbody tr")
        .locator("td")
        .filter({ hasText: TEST_BOARD.name })
        .locator("..") // tr로 상위 요소 이동
        .locator("td button:text('삭제')");

      await expect(deleteButton).toBeVisible();
      page.on("dialog", async (dialog) => await dialog.accept());
      await deleteButton.click();

      await page.waitForTimeout(500);
      await expect(page).toHaveURL("/admin/boards");

      // 2. 삭제된 보드 검증
      const deletedCategoryTable = page.locator(
        `table[data-category='${TEST_CATEGORY.name}']`
      );

      // 빈 테이블 상태 검증
      await expect(deletedCategoryTable.locator("tbody tr")).toHaveCount(0);

      // "등록된 게시판이 없습니다" 메시지 검증
      const deletedCategorySection = page.locator(
        `div:has(h2:text('${TEST_CATEGORY.name}'))`
      );

      const emptyMessage = deletedCategorySection.locator(
        "p:text('등록된 게시판이 없습니다.')"
      );
      await expect(emptyMessage).toBeVisible();

      // 선택된 카테고리 테이블에서 기존 게시글이 사라졌는지 확인
      await expect(
        deletedCategorySection
          .locator("td[data-role='name']")
          .filter({ hasText: TEST_BOARD.name })
      ).not.toBeVisible();
    });
  });
});
