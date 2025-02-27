import { test, expect } from "@playwright/test";
import path from "path";

const authFile = path.join(__dirname, "./.auth/user.json");
test.use({ storageState: authFile });

test.describe("Logout Button", () => {
  test("should logout when click logout button", async ({ page, context }) => {
    await page.goto("/dashboard");
    await page.waitForURL("/dashboard", { timeout: 5000 });

    // 로그인 상태 확인
    await expect(page.getByRole("link", { name: "SignUp" })).not.toBeVisible();
    await expect(page.getByRole("link", { name: "Login" })).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();

    // 로그아웃 버튼 클릭
    await page.getByRole("button", { name: "Logout" }).click();

    // 로그인 페이지로 리다이렉트 확인
    await expect(page).toHaveURL("/login");

    // 쿠키 삭제 확인
    const cookies = await context.cookies();
    expect(
      cookies.some((cookie) => cookie.name === "access_token")
    ).toBeFalsy();
    expect(
      cookies.some((cookie) => cookie.name === "refresh_token")
    ).toBeFalsy();
  });
});
