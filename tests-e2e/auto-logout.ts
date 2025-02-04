import { Page, expect } from "@playwright/test";

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
