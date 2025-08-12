import { User } from "@/lib/definition/userAuthSchemas";
import { expect, Cookie, Page } from "@playwright/test";

export const expectCookiesToBeDefined = (
  cookies: Cookie[],
  cookieNames: string[]
) => {
  cookieNames.forEach((name) => {
    const cookie = cookies.find((c) => c.name === name);
    expect(cookie, `Cookie '${name}' should be defined`).toBeDefined();
  });
};

export const expectValidUserCookie = (cookies: Cookie[]) => {
  const userCookie = cookies.find((c) => c.name === "user");
  expect(userCookie, "User cookie should exist").toBeDefined();

  try {
    const userData = JSON.parse(decodeURIComponent(userCookie!.value));
    expect(userData).toHaveProperty("name");
    expect(userData).toHaveProperty("nickname");
    expect(userData).toHaveProperty("email");
    expect(userData).toHaveProperty("role");
    return userData;
  } catch (e) {
    throw new Error("Invalid user cookie format");
  }
};

export const expectCookiesToNotExist = (
  cookies: Cookie[],
  cookieNames: string[]
) => {
  cookieNames.forEach((name) => {
    const cookie = cookies.find((c) => c.name === name);
    expect(cookie, `Cookie '${name}' should not exist`).toBeFalsy();
  });
};

export const uniqueEmail = (prefix = "user", domain = "example.com") =>
  `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}@${domain}`;

export const uniqueNickname = (prefix = "user") =>
  `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

export const createTestUser = (overrides: Partial<User> = {}): User => ({
  name: overrides.name || "Test User",
  nickname: overrides.nickname || uniqueNickname(),
  email: overrides.email || uniqueEmail(),
  password: overrides.password || "password123",
});

export async function clickSideBarBoard(
  page: Page,
  categoryName: string,
  boardName: string,
  boardSlug: string
) {
  const sidebarToggleButton = page.getByRole("button", {
    name: "Sidebar Activation",
  });
  await expect(sidebarToggleButton).toBeVisible();

  const sidebarLocator = page.locator("div.fixed.inset-y-0.left-0.w-64");

  const sidebarClass = await sidebarLocator.getAttribute("class");

  if (sidebarClass?.includes("-translate-x-full")) {
    await sidebarToggleButton.click();
  }

  const categoryLocator = page.getByLabel(`category-label-${categoryName}`);

  const categorySection = categoryLocator.locator("..");

  const boardLocator = categorySection.getByLabel(
    `board-link-${boardName}-${boardSlug}`
  );

  await expect(boardLocator).toBeVisible();

  await boardLocator.click();

  await expect(page).toHaveURL(`/boards/${boardSlug}`);

  const sidebarCloseButton = page.getByRole("button", { name: "×" });

  await expect(sidebarCloseButton).toBeVisible();

  await sidebarCloseButton.click();

  await expect
    .poll(async () => {
      const updatedSidebarClass = await sidebarLocator.getAttribute("class");
      return updatedSidebarClass;
    }, "사이드바가 닫히지 않았습니다.")
    .toContain("-translate-x-full");
}

/**
 * 로그아웃 버튼을 안전하게 클릭하는 함수.
 * 버튼이 존재하고 클릭 가능할 때까지 기다린 후 클릭을 시도합니다.
 * @param page Playwright Page 객체
 */
export async function safeLogout(page: Page): Promise<void> {
  await page.goto("/");
  try {
    let logoutButton = page.getByRole("button", { name: "Logout" });

    if (!(await logoutButton.isVisible({ timeout: 1000 }).catch(() => false))) {
      logoutButton = page.locator('button[aria-label="Logout"]');
    }

    const isButtonVisible = await logoutButton
      .isVisible({ timeout: 3000 })
      .catch(() => {
        console.log("Logout button is not visible within 3 seconds.");
        return false;
      });

    if (!isButtonVisible) {
      console.log("Skipping logout: Button not found or not visible.");
      return;
    }

    const isButtonEnable = await logoutButton
      .isEnabled({ timeout: 3000 })
      .catch(() => {
        console.log("Logout button is not enabled within 3 seconds.");

        return false;
      });

    if (!isButtonEnable) {
      console.log("Skipping logout: Button is not enabled");
      return;
    }

    await logoutButton.click({
      timeout: 5000,
    });

    await page.waitForURL("/login", { timeout: 5000 }).catch(() => {
      throw Error("Logout process has problem.");
    });
  } catch (error: any) {
    console.error("Error during logout attempt:", error.message || error);
  }
}
