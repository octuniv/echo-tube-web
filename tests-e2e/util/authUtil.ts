import { expect, Page, BrowserContext } from "@playwright/test";
import { User } from "@/lib/definition";

interface authenticationProps {
  account: User;
  page: Page;
  context: BrowserContext;
}

export const signUpAndLogin = async ({
  account,
  page,
  context,
}: authenticationProps) => {
  await page.goto("/signup");

  await page.fill('input[name="name"]', account.name);
  await page.fill('input[name="nickName"]', account.nickName);
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
  const accessTokenCookie = cookies.find(
    (cookie) => cookie.name === "access_token"
  );
  const refreshTokenCookie = cookies.find(
    (cookie) => cookie.name === "refresh_token"
  );

  expect(accessTokenCookie).toBeDefined();
  expect(accessTokenCookie?.value).not.toBe("");

  expect(refreshTokenCookie).toBeDefined();
  expect(refreshTokenCookie?.value).not.toBe("");
};
