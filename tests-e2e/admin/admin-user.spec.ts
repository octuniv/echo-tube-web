import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "../util/auth-utils";
import { createTestUser } from "../util/test-utils";

const testerAccount = createTestUser();

test.use({
  storageState: undefined,
});

test.describe("Admin User Management E2E Tests", () => {
  test.beforeEach(async ({ page, context }) => {
    await loginAsAdmin({ page, context });
    await page.goto("/admin/users");
    await page.waitForURL("/admin/users");
  });

  test("should create a new user successfully", async ({ page }) => {
    await page.getByRole("link", { name: "+ 새로운 사용자 생성" }).click();

    await page.fill('input[name="name"]', testerAccount.name);
    await page.fill('input[name="nickname"]', testerAccount.nickname);
    await page.fill('input[name="email"]', testerAccount.email);
    await page.fill('input[name="password"]', testerAccount.password);
    await page.selectOption('select[name="role"]', "봇");

    await page.getByRole("button", { name: "중복 확인" }).nth(0).click();
    await page.getByRole("button", { name: "중복 확인" }).nth(1).click();

    const nicknameCheck = page.locator(
      '[aria-labelledby="nickname-validation"]'
    );
    const emailCheck = page.locator('[aria-labelledby="email-validation"]');
    await expect(nicknameCheck).toHaveText("사용 가능");
    await expect(emailCheck).toHaveText("사용 가능");

    await page.click('button[type="submit"]');
    await page.waitForURL("/admin/users");
  });

  test("should delete a user successfully and update status", async ({
    page,
  }) => {
    const testerRow = page.locator(
      `table tbody tr:has(td:text("${testerAccount.email}"))`
    );
    await expect(testerRow).toBeVisible();

    const statusCell = testerRow.locator('td span:has-text("활성")');
    await expect(statusCell).toBeVisible();

    page.on("dialog", async (dialog) => {
      await dialog.accept();
    });

    await testerRow.locator('button:text("삭제")').click();

    const deletedStatus = testerRow.locator('td span:has-text("삭제됨")');
    await deletedStatus.waitFor({ state: "visible", timeout: 5000 });

    await expect(testerRow.locator('button:text("삭제")')).toBeHidden();
    await expect(testerRow.locator('a:text("수정")')).toBeHidden();
  });
});
