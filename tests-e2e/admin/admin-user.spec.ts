import { test, expect, Page, Locator } from "@playwright/test";
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
      await page.waitForURL("/admin/users/create");
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

  test.describe("Admin User Page notFound Test", () => {
    const targets = ["/admin/users/99999999", "/admin/users/edit/99999999"];

    targets.forEach((url) => {
      test(`Admin User Page notFound Test - ${url}`, async ({ page }) => {
        await page.goto(url);
        await expect(page.locator("h1")).toContainText("404");

        await expect(
          page.locator("h2", { hasText: "This page could not be found" })
        ).toBeVisible();
      });
    });
  });
});

test.describe("User Detail Page E2E Tests", () => {
  let detailTestUserId: number;

  const detailTestAccount = {
    ...createTestUser(),
    role: UserRole.BOT,
  };
  test.beforeAll(async ({ page, context }) => {
    await loginAsAdmin({ page, context });
    await page.goto("/admin/users");
    await page.waitForURL("/admin/users");

    const existingUser = page.locator(
      `table tbody tr:has(td:text("${detailTestAccount.email}"))`
    );
    if ((await existingUser.count()) !== 0) {
      throw new Error("Something bad happend.");
    } else {
      await page.getByRole("link", { name: "+ 새로운 사용자 생성" }).click();
      await page.fill('input[name="name"]', detailTestAccount.name);
      await page.fill('input[name="nickname"]', detailTestAccount.nickname);
      await page.fill('input[name="email"]', detailTestAccount.email);
      await page.fill('input[name="password"]', detailTestAccount.password);
      await selectUserRole(page, detailTestAccount.role);
      await page.click('button[type="submit"]');
      await page.waitForURL("/admin/users");
    }

    const editLink = page.locator(
      `table tbody tr:has(td:text("${detailTestAccount.email}")) a:text("수정")`
    );
    const href = await editLink.getAttribute("href");
    if (href) {
      const match = href.match(/\/admin\/users\/edit\/(\d+)/);
      if (match && match[1]) {
        detailTestUserId = parseInt(match[1], 10);
      }
    }

    if (!detailTestUserId) {
      throw new Error("User ID 추출 실패");
    }
  });

  test.beforeEach(async ({ page, context }) => {
    await loginAsAdmin({ page, context });
    await page.goto("/admin/users");
    await page.waitForURL("/admin/users");
  });

  test("should navigate to user detail page and display correct user data", async ({
    page,
  }) => {
    const testerRow = page.locator(
      `table tbody tr:has(td:text("${detailTestAccount.email}"))`
    );
    await expect(testerRow).toBeVisible();
    await testerRow.locator('a:text("상세보기")').click();
    await expect(page).toHaveURL(/\/admin\/users\/\d+/);

    await expect(page.locator("h1")).toContainText("사용자 상세 정보");

    const selectLabel = (name: string) =>
      page.locator(`label:text(\"${name}\")`);
    const checkSiblingElem = (label: Locator, text: string) =>
      expect(label.locator("xpath=following-sibling::p[1]")).toHaveText(text);

    const idLabel = selectLabel("ID");
    await checkSiblingElem(idLabel, detailTestUserId.toString());

    const nameLabel = selectLabel("이름");
    await checkSiblingElem(nameLabel, detailTestAccount.name);

    const nicknameLabel = selectLabel("닉네임");
    await checkSiblingElem(nicknameLabel, detailTestAccount.nickname);

    const emailLabel = selectLabel("이메일");
    await checkSiblingElem(emailLabel, detailTestAccount.email);

    const roleLabel = selectLabel("역할");
    await checkSiblingElem(roleLabel, detailTestAccount.role);

    const statusLabelElem = selectLabel("상태").locator(
      "xpath=following-sibling::div[1]//span"
    );
    await expect(statusLabelElem).toHaveText("활성");

    const createdAtElem = page.locator('label:text("생성일") + p');
    await expect(createdAtElem).toBeVisible();
    const createdAtText = await createdAtElem.textContent();
    expect(new Date(createdAtText || "")).toBeInstanceOf(Date);
  });

  test("should show edit and delete buttons for active users", async ({
    page,
  }) => {
    await page.goto(`/admin/users/${detailTestUserId}`);

    await expect(page.getByRole("link", { name: "수정" })).toBeVisible();
    await expect(page.getByRole("button", { name: "삭제" })).toBeVisible();
  });

  test("should hide edit and delete buttons for deleted users", async ({
    page,
  }) => {
    await page.goto("/admin/users");

    const testerRow = page.locator(
      `table tbody tr:has(td:text("${detailTestAccount.email}"))`
    );
    await expect(testerRow).toBeVisible();

    page.on("dialog", async (dialog) => {
      await dialog.accept();
    });

    await testerRow.locator('button:text("삭제")').click();
    await page.waitForTimeout(1000);

    await page.goto(`/admin/users/${detailTestUserId}`);

    await expect(page.getByRole("button", { name: "수정" })).toBeHidden();
    await expect(page.getByRole("button", { name: "삭제" })).toBeHidden();
  });

  test("should navigate back to user list when '목록으로' is clicked", async ({
    page,
  }) => {
    await page.goto(`/admin/users/${detailTestUserId}`);
    await page.getByRole("link", { name: "목록으로" }).click();
    await page.waitForURL("/admin/users");
  });
});

test.describe("Admin User List Search & Sort Functionality", () => {
  const searchTestAccount = {
    ...createTestUser(),
    role: UserRole.BOT,
  };
  test.beforeAll(async ({ page, context }) => {
    await loginAsAdmin({ page, context });
    await page.goto("/admin/users");
    await page.waitForURL("/admin/users");

    const existingUser = page.locator(
      `table tbody tr:has(td:text-is("${searchTestAccount.email}"))`
    );
    const count = await existingUser.count();
    if (count > 0) {
      throw new Error("기존 테스트 계정이 이미 존재합니다.");
    }

    await page.getByRole("link", { name: "+ 새로운 사용자 생성" }).click();
    await page.fill('input[name="name"]', searchTestAccount.name);
    await page.fill('input[name="nickname"]', searchTestAccount.nickname);
    await page.fill('input[name="email"]', searchTestAccount.email);
    await page.fill('input[name="password"]', searchTestAccount.password);
    await selectUserRole(page, searchTestAccount.role);
    await page.click('button[type="submit"]');

    await page.waitForURL("/admin/users");

    const userRow = page.locator(
      `table tbody tr:has(td:nth-child(4):text-is("${searchTestAccount.email}"))`
    );
    await expect(userRow).toHaveCount(1);
  });

  test.beforeEach(async ({ page, context }) => {
    await loginAsAdmin({ page, context });
    await page.goto("/admin/users");
    await page.waitForURL("/admin/users");
  });

  // Helper functions
  const fillSearchForm = async ({
    page,
    fields,
  }: {
    page: Page;
    fields: {
      email?: string;
      nickname?: string;
      role?: UserRole;
    };
  }) => {
    if (fields.email !== undefined) {
      await page.fill('input[name="email"]', fields.email);
    }
    if (fields.nickname !== undefined) {
      await page.fill('input[name="nickname"]', fields.nickname);
    }
    if (fields.role) {
      await page.selectOption('select[name="role"]', fields.role);
    }
  };

  const getDisplayedUsers = async ({ page }: { page: Page }) => {
    const rows = await page.locator("table tbody tr").all();
    return Promise.all(
      rows.map(async (row) => ({
        email: await row.locator("td").nth(3).textContent(),
        nickname: await row.locator("td").nth(2).textContent(),
        role: await row.locator("td").nth(4).textContent(),
        id: await row.locator("td").nth(0).textContent(),
      }))
    );
  };

  // Test Case 1: Individual Field Search
  test("should filter users by email search", async ({ page }) => {
    const testEmail = searchTestAccount.email;

    await fillSearchForm({ page, fields: { email: testEmail } });
    await page.click('button[type="submit"]');
    await page.waitForURL(
      new RegExp(`[?&]searchEmail=${encodeURIComponent(testEmail)}`)
    );

    const users = await getDisplayedUsers({ page });
    expect(users.every((u) => u.email?.includes(testEmail))).toBe(true);
  });

  // Test Case 2: Combined Search
  test("should filter users by combined email and role search", async ({
    page,
  }) => {
    const testEmail = searchTestAccount.email;
    const testRole = searchTestAccount.role;

    await fillSearchForm({
      page,
      fields: { email: testEmail, role: testRole },
    });
    await page.click('button[type="submit"]');
    await page.waitForURL(new RegExp(`searchRole=${testRole}`));
    await expect(page).toHaveURL(
      new RegExp(`[?&]searchEmail=${encodeURIComponent(testEmail)}`)
    );

    const users = await getDisplayedUsers({ page });
    expect(users.length).toBeGreaterThan(0);
    expect(
      users.every((u) => u.email?.includes(testEmail) && u.role === testRole)
    ).toBe(true);
  });

  // Test Case 3: Empty Search
  test("should show all users when search fields are empty", async ({
    page,
  }) => {
    await fillSearchForm({
      page,
      fields: { email: "", nickname: "", role: undefined },
    });
    await page.click('button[type="submit"]');

    // Wait for data to load
    await page.waitForTimeout(500);

    const users = await getDisplayedUsers({ page });
    expect(users.length).not.toBe(0);
  });

  // Test Case 4: No Results
  test("should show empty state when search returns no results", async ({
    page,
  }) => {
    await fillSearchForm({
      page,
      fields: {
        email: "nonexistent@example.com",
        nickname: "zzzzz",
        role: UserRole.ADMIN,
      },
    });
    await page.click('button[type="submit"]');

    await page.waitForTimeout(500);

    const users = await getDisplayedUsers({ page });
    expect(users.length).toBe(0);
  });

  // Test Case 5: Sorting by Created At
  test("should sort users by created date ascending", async ({ page }) => {
    // First set default sort
    await page
      .locator('div:has(> label:text-is("정렬 기준"))')
      .locator("select")
      .selectOption("createdAt");
    await page.waitForURL(new RegExp("sort=createdAt"));
    await expect(page).toHaveURL(new RegExp("sort=createdAt"));

    await page
      .locator('div:has(> label:text-is("정렬 방향"))')
      .locator("select")
      .selectOption("ASC");
    await page.waitForURL(new RegExp("order=ASC"));
    await expect(page).toHaveURL(new RegExp("order=ASC"));

    const users = await getDisplayedUsers({ page });
    const idSequence = users.map((u) => Number(u.id));

    for (let i = 0; i < idSequence.length - 1; i++) {
      expect(idSequence[i]).toBeLessThanOrEqual(idSequence[i + 1]);
    }
  });

  // Test Case 6: URL Parameters
  test("should update URL parameters when applying search and sort", async ({
    page,
  }) => {
    // Test search URL params
    const testEmail = searchTestAccount.email;
    const testRole = searchTestAccount.role;

    await fillSearchForm({
      page,
      fields: { email: testEmail, role: testRole },
    });
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/searchEmail=.*/);
    await expect(page).toHaveURL(/searchRole=bot/);

    // Test sort URL params
    await page
      .locator('div:has(> label:text-is("정렬 기준"))')
      .locator("select")
      .selectOption("updatedAt");
    await page.waitForURL(new RegExp("sort=updatedAt"));
    await expect(page).toHaveURL(new RegExp("sort=updatedAt"));

    await page
      .locator('div:has(> label:text-is("정렬 방향"))')
      .locator("select")
      .selectOption("DESC");
    await page.waitForURL(new RegExp("order=DESC"));
    await expect(page).toHaveURL(new RegExp("order=DESC"));
  });

  // Test Case 7: Default Sort Behavior
  test("should use default sort when no parameters provided", async ({
    page,
  }) => {
    // Clear all URL parameters
    await page.goto("/admin/users");

    const users = await getDisplayedUsers({ page });
    const idSequence = users.map((u) => Number(u.id));

    // Default should be createdAt DESC
    for (let i = 0; i < idSequence.length - 1; i++) {
      expect(idSequence[i]).toBeGreaterThanOrEqual(idSequence[i + 1]);
    }
  });

  // Test Case 8: Search Form Reset
  test("should reset search form when clearing all fields", async ({
    page,
  }) => {
    // Apply a search
    await fillSearchForm({ page, fields: { email: searchTestAccount.email } });
    await page.click('button[type="submit"]');

    // Clear search
    await fillSearchForm({
      page,
      fields: { email: "", nickname: "", role: undefined },
    });
    await page.click('button[type="submit"]');

    const users = await getDisplayedUsers({ page });
    expect(users.length).not.toBe(0);
  });
});
