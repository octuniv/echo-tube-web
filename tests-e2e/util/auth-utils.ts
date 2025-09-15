import { Page, BrowserContext, expect, Browser } from "@playwright/test";
import { User } from "@/lib/definition/userAuthSchemas";
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

const TEST_VIEWPORT = { width: 1920, height: 1080 };

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
  const context = await browser.newContext({ viewport: TEST_VIEWPORT });

  await context.clearCookies();

  const page = await context.newPage();
  await page.goto("/login");

  try {
    await page.fill('input[name="email"]', adminAccount.email);
    await page.fill('input[name="password"]', adminAccount.password);
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard", { timeout: 5000 });
    await expect(page).toHaveURL("/dashboard");
  } catch (error) {
    if (page) await page.close();
    await context.close();
    throw error;
  }

  return { context, page };
};

export const loginAsAnother = async ({
  account,
  page,
  context,
}: {
  account: User;
  page: Page;
  context: BrowserContext;
}) => {
  // 기존 세션 클리어 (필요 시)
  await context.clearCookies();

  // 로그인 페이지로 이동
  await page.goto("/login");
  await page.waitForSelector('input[name="email"]');

  // 정보 입력 및 로그인
  await page.fill('input[name="email"]', account.email);
  await page.fill('input[name="password"]', account.password);
  await page.click('button[type="submit"]');

  // 대시보드로 리디렉션 확인
  await page.waitForURL("/dashboard", { timeout: 5000 });
  expect(await page.url()).toBe("http://localhost:3000/dashboard");

  // 쿠키 검증 (선택 사항)
  const cookies = await context.cookies();
  expectCookiesToBeDefined(cookies, ["access_token", "refresh_token", "user"]);
  expectValidUserCookie(cookies);

  // ✅ tester2 전용 저장소에 세션 저장
  const authFile = "./tests-e2e/.auth/user-tester2.json";
  await context.storageState({ path: authFile });
};
