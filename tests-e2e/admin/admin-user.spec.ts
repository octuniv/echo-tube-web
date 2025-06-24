import { test, expect, Page } from "@playwright/test";
import { loginAsAdmin } from "../util/auth-utils";
import { createTestUser, uniqueNickname } from "../util/test-utils";
import { ERROR_MESSAGES } from "@/lib/constants/errorMessage";

import { UserRole } from "@/lib/definition";

async function selectUserRole(page: Page, role: UserRole) {
  const roleSelector = 'select[name="role"]';

  await page.selectOption(roleSelector, {
    value: role,
  });
}

const testAccount = {
  ...createTestUser(),
  role: UserRole.BOT,
};

test.use({
  storageState: undefined,
});

test.describe("Admin User Management E2E Tests", () => {
  test.beforeEach(async ({ page, context }) => {
    await loginAsAdmin({ page, context });
    await page.goto("/admin/users");
    await page.waitForURL("/admin/users");
  });

  test.describe("Testing the administrator creating users", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/admin/users");
      await page.waitForURL("/admin/users");
      await page.getByRole("link", { name: "+ 새로운 사용자 생성" }).click();
    });

    test("should display validation errors on empty form submission", async ({
      page,
    }) => {
      await page.click('button[type="submit"]');

      await expect(page.locator("#name-error")).toHaveText(
        "Please enter your valid name."
      );
      await expect(page.locator("#nickname-error")).toHaveText(
        "Please enter your nickname."
      );
      await expect(page.locator("#email-error")).toHaveText(
        "This email is invalid"
      );
      await expect(page.locator("#password-error")).toHaveText(
        "Password must be at least 6 characters"
      );
    });

    test("should display an error for invalid email format", async ({
      page,
    }) => {
      await page.fill('input[name="name"]', "John Doe");
      await page.fill('input[name="nickname"]', "John");
      await page.fill('input[name="email"]', "invalid-email");
      await page.fill('input[name="password"]', "password123");

      await page.click('button[type="submit"]');

      await expect(page.locator("#email-error")).toHaveText(
        "This email is invalid"
      );
    });

    test("should create a new user successfully", async ({ page }) => {
      await page.fill('input[name="name"]', testAccount.name);
      await page.fill('input[name="nickname"]', testAccount.nickname);
      await page.fill('input[name="email"]', testAccount.email);
      await page.fill('input[name="password"]', testAccount.password);
      await selectUserRole(page, testAccount.role);

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

    test("should display server error message on failure if you put an email that already exists on the server ", async ({
      page,
    }) => {
      const duplicatedEmailAccount = createTestUser({
        email: testAccount.email,
      });
      await page.fill('input[name="name"]', duplicatedEmailAccount.name);
      await page.fill(
        'input[name="nickname"]',
        duplicatedEmailAccount.nickname
      );
      await page.fill('input[name="email"]', duplicatedEmailAccount.email);
      await page.fill(
        'input[name="password"]',
        duplicatedEmailAccount.password
      );

      await page.click('button[type="submit"]');

      await expect(page.locator("#email-error")).toHaveText(
        ERROR_MESSAGES.EMAIL_EXISTS
      );

      await expect(page.getByText(ERROR_MESSAGES.INVALID_FIELD)).toBeVisible();
    });

    test("should display server error message on failure if you put an nickname that already exists on the server ", async ({
      page,
    }) => {
      const duplicatedNicknameAccount = createTestUser({
        nickname: testAccount.nickname,
      });
      await page.fill('input[name="name"]', duplicatedNicknameAccount.name);
      await page.fill(
        'input[name="nickname"]',
        duplicatedNicknameAccount.nickname
      );
      await page.fill('input[name="email"]', duplicatedNicknameAccount.email);
      await page.fill(
        'input[name="password"]',
        duplicatedNicknameAccount.password
      );

      await page.click('button[type="submit"]');

      await expect(page.locator("#nickname-error")).toHaveText(
        ERROR_MESSAGES.NICKNAME_EXISTS
      );

      await expect(page.getByText(ERROR_MESSAGES.INVALID_FIELD)).toBeVisible();
    });

    test("should display 'Enter a value' text if the duplicate confirmation button is pressed while the input space for duplicate confirmation is empty.", async ({
      page,
    }) => {
      await page.getByRole("button", { name: "중복 확인" }).nth(0).click();
      await page.getByRole("button", { name: "중복 확인" }).nth(1).click();

      const nicknameCheck = page.locator(
        '[aria-labelledby="nickname-validation"]'
      );
      const emailCheck = page.locator('[aria-labelledby="email-validation"]');

      await expect(nicknameCheck).toHaveText("값을 입력해주세요");
      await expect(emailCheck).toHaveText("값을 입력해주세요");
    });

    test("should display text that is already in use when a duplicate confirmation button is pressed and duplicate input values are entered.", async ({
      page,
    }) => {
      await page.fill('input[name="nickname"]', testAccount.nickname);
      await page.fill('input[name="email"]', testAccount.email);
      await page.getByRole("button", { name: "중복 확인" }).nth(0).click();
      await page.getByRole("button", { name: "중복 확인" }).nth(1).click();

      const nicknameCheck = page.locator(
        '[aria-labelledby="nickname-validation"]'
      );
      const emailCheck = page.locator('[aria-labelledby="email-validation"]');

      await expect(nicknameCheck).toHaveText("이미 사용 중");
      await expect(emailCheck).toHaveText("이미 사용 중");
    });
  });

  test.describe("Testing the administrator editing users", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/admin/users");
      await page.waitForURL("/admin/users");

      const testerRow = page.locator(
        `table tbody tr:has(td:text("${testAccount.email}"))`
      );
      await expect(testerRow).toBeVisible();

      await expect(testerRow.locator('a:text("수정")')).toBeVisible();
      await testerRow.locator('a:text("수정")').click();

      await expect(page).toHaveURL(/\/admin\/users\/edit\/\d+/);
    });

    test("should display server error message on failure if you put an nickname that already exists on the server", async ({
      page,
    }) => {
      await page.fill('input[name="name"]', testAccount.name);
      await page.fill('input[name="nickname"]', testAccount.nickname);
      await selectUserRole(page, testAccount.role);

      await page.click('button[type="submit"]');

      await expect(page.locator("#nickname-error")).toHaveText(
        ERROR_MESSAGES.NICKNAME_EXISTS
      );

      await expect(page.getByText(ERROR_MESSAGES.INVALID_FIELD)).toBeVisible();
    });

    test("should apply to change role when all spaces except role are blank", async ({
      page,
    }) => {
      const newRole = UserRole.USER;

      await page.fill('input[name="name"]', "");
      await page.fill('input[name="nickname"]', "");
      await selectUserRole(page, newRole);

      await page.click('button[type="submit"]');

      await page.waitForURL("/admin/users");

      const testerRow = page.locator(
        `table tbody tr:has(td:text("${testAccount.email}"))`
      );
      await expect(testerRow).toBeVisible();

      await expect(testerRow.locator("td").nth(4)).toHaveText(newRole);

      const statusCell = testerRow.locator('td span:has-text("활성")');
      await expect(statusCell).toBeVisible();

      await expect(testerRow.locator('button:text("삭제")')).toBeVisible();
      await expect(testerRow.locator('a:text("수정")')).toBeVisible();

      testAccount.role = newRole;
    });

    test("should apply to change all values normally when you put the appropriate values in all the columns in user manager edit", async ({
      page,
    }) => {
      const newName = "newName";
      const newNickname = uniqueNickname();
      const newRole = UserRole.BOT;

      await page.fill('input[name="name"]', newName);
      await page.fill('input[name="nickname"]', newNickname);
      await selectUserRole(page, newRole);

      await page.click('button[type="submit"]');

      await page.waitForURL("/admin/users");

      const testerRow = page.locator(
        `table tbody tr:has(td:text("${testAccount.email}"))`
      );
      await expect(testerRow).toBeVisible();

      await expect(testerRow.locator("td").nth(1)).toHaveText(newName);
      await expect(testerRow.locator("td").nth(2)).toHaveText(newNickname);
      await expect(testerRow.locator("td").nth(4)).toHaveText(newRole);

      const statusCell = testerRow.locator('td span:has-text("활성")');
      await expect(statusCell).toBeVisible();

      await expect(testerRow.locator('button:text("삭제")')).toBeVisible();
      await expect(testerRow.locator('a:text("수정")')).toBeVisible();

      testAccount.name = newName;
      testAccount.nickname = newNickname;
      testAccount.role = newRole;
    });
  });

  test.describe("Testing the administrator deleting users", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/admin/users");
      await page.waitForURL("/admin/users");
    });

    test("should remains in the user state without being deleted when you cancel a request to delete a user", async ({
      page,
    }) => {
      const testerRow = page.locator(
        `table tbody tr:has(td:text("${testAccount.email}"))`
      );
      await expect(testerRow).toBeVisible();

      const statusCell = testerRow.locator('td span:has-text("활성")');
      await expect(statusCell).toBeVisible();

      page.on("dialog", async (dialog) => {
        await dialog.dismiss();
      });

      await testerRow.locator('button:text("삭제")').click();

      const afterStatusCell = testerRow.locator('td span:has-text("활성")');
      await expect(afterStatusCell).toBeVisible();

      await expect(testerRow.locator('button:text("삭제")')).toBeVisible();
      await expect(testerRow.locator('a:text("수정")')).toBeVisible();
    });

    test("should delete a user successfully and update status", async ({
      page,
    }) => {
      const testerRow = page.locator(
        `table tbody tr:has(td:text("${testAccount.email}"))`
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
});
