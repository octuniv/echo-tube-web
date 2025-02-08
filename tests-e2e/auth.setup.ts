import { test as setup, expect } from "@playwright/test";
import path from "path";
import * as dotenv from "dotenv";
import { User } from "@/lib/definition";

dotenv.config({ path: ".env.e2e.test" });

const authFile = path.join(__dirname, "./.auth/user.json");

const account = {
  name: process.env.tester_name as string,
  nickName: process.env.tester_nickName as string,
  email: process.env.tester_email as string,
  password: process.env.tester_password as string,
} satisfies User;

setup("authenticate (login)", async ({ page, context }) => {
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

  await page.context().storageState({ path: authFile });
});
