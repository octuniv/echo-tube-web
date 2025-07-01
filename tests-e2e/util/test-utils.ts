// tests-e2e/util/test-utils.ts
import { User } from "@/lib/definition";
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
    return userData; // 추후 검증에 사용 가능
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

export async function clickSideBarElement(
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
}
