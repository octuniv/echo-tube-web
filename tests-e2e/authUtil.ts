import { Page, expect } from "@playwright/test";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.e2e.test" });

const account = {
  name: process.env.tester_name as string,
  email: process.env.tester_email as string,
  password: process.env.tester_password as string,
};

export async function logout(page: Page) {
  try {
    // 로그아웃 버튼이 나타날 때까지 최대 5초간 기다림
    await page.goto("/login");
    const logoutButton = page.getByRole("button", { name: "Logout" });

    const isLogoutButtonVisible = await logoutButton.isVisible();

    if (isLogoutButtonVisible) {
      // 로그아웃 버튼 클릭
      await logoutButton.click();

      // 로그인 페이지로 리다이렉트 확인
      await expect(page).toHaveURL("/login");
    } else {
      console.log("Logout button not found. Skipping logout process.");
    }
  } catch (error) {
    console.log("Logout button not found or failed to log out:", error);
  }
}

// from auth.setup.ts
export async function login(page: Page) {
  await page.goto("/login");

  await page.waitForURL("/login", { timeout: 1000 });

  await page.waitForSelector('input[name="email"]');
  await page.fill('input[name="email"]', account.email);
  await page.fill('input[name="password"]', account.password);

  await page.waitForSelector('button[type="submit"]:not([disabled])');
  await page.click('button[type="submit"]');

  await page.waitForURL("/dashboard", { timeout: 5000 });
}
