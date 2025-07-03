import { Page, BrowserContext, expect, Browser } from "@playwright/test";
import { User } from "@/lib/definition";
import { expectCookiesToBeDefined, expectValidUserCookie } from "./test-utils";

interface authenticationProps {
  account: User;
  page: Page;
  context: BrowserContext;
}

const adminAccount = {
  email: process.env.SYSTEM_USER_EMAIL || "system@example.com",
  password: process.env.SYSTEM_USER_PASSWORD || "system1234",
};

export const signUpAndLogin = async ({
  account,
  page,
  context,
}: authenticationProps) => {
  await page.goto("/signup");

  await page.fill('input[name="name"]', account.name);
  await page.fill('input[name="nickname"]', account.nickname);
  await page.fill('input[name="email"]', account.email);
  await page.fill('input[name="password"]', account.password);

  await page.click('button[type="submit"]');

  await page.waitForTimeout(1000);

  await page.goto("/login");

  await page.waitForSelector('input[name="email"]');
  await page.fill('input[name="email"]', account.email);
  await page.fill('input[name="password"]', account.password);

  await page.waitForSelector('button[type="submit"]:not([disabled])');
  await page.click('button[type="submit"]');

  await page.waitForURL("/dashboard", { timeout: 5000 });

  const cookies = await context.cookies();

  expectCookiesToBeDefined(cookies, ["access_token", "refresh_token", "user"]);

  expectValidUserCookie(cookies);
};

export const loginAsAdmin = async ({
  page,
  context,
}: {
  page: Page;
  context: BrowserContext;
}) => {
  await context.clearCookies();

  await page.goto("/login");
  await page.fill('input[name="email"]', adminAccount.email);
  await page.fill('input[name="password"]', adminAccount.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("/dashboard", { timeout: 5000 });

  await expect(page).toHaveURL("/dashboard");
};

export const loginAsAdminIsolated = async (
  browser: Browser
): Promise<{ context: BrowserContext; page: Page }> => {
  const context = await browser.newContext();

  await context.clearCookies();

  const page = await context.newPage();
  await page.goto("/login");

  await page.fill('input[name="email"]', adminAccount.email);
  await page.fill('input[name="password"]', adminAccount.password);
  await page.click('button[type="submit"]');

  await page.waitForURL("/dashboard", { timeout: 5000 });
  await expect(page).toHaveURL("/dashboard");

  return { context, page };
};
