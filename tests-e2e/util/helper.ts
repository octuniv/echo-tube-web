import { Page } from "@playwright/test";

/**
 * 임시 로그아웃 상태에서 특정 동작을 수행한 후 세션 복원
 * @param Page Playwright 페이지지 객체
 * @param action 로그아웃 상태에서 실행할 테스트 동작
 */

export async function withTemporaryLogout(
  page: Page,
  action: (page: Page) => Promise<void>
) {
  const cookies = await page.context().cookies();
  await page.context().clearCookies();
  await page.reload();
  try {
    await action(page);
  } catch (error) {
    throw error;
  } finally {
    await page.context().addCookies(cookies);
    await page.goto("/");
  }
}
