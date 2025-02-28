import { test, expect, Cookie, chromium } from "@playwright/test";
import { signUpAndLogin } from "./util/authUtil";
import { User } from "@/lib/definition";

const authTestAccount = {
  name: "authTest",
  nickName: "authTest",
  email: "authTest@test.com",
  password: "authTest",
} satisfies User;

test.describe("Auth Test", () => {
  let currentCookies: Cookie[];

  test.beforeAll(async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await browser.newPage();
    await page.context().clearCookies();
    await signUpAndLogin({ account: authTestAccount, page, context });
    currentCookies = await page.context().cookies();
    await browser.close();
  });

  test.describe("About Creating Post", () => {
    test.beforeEach(async ({ page }) => {
      await page.context().clearCookies();
      await page.context().addCookies(currentCookies);
      const insertedCookies = await page.context().cookies();
      const accessToken = insertedCookies.find(
        (cookie) => cookie.name === "access_token"
      );
      const refreshToken = insertedCookies.find(
        (cookie) => cookie.name === "refresh_token"
      );
      expect(accessToken).toBeDefined();
      expect(refreshToken).toBeDefined();
    });

    test("failed to submit with valid data when signUpAndLogin is invalid", async ({
      page,
    }) => {
      // 페이지에 컴포넌트 마운트
      await page.goto("/dashboard/posts/create");
      await page.waitForURL("/dashboard/posts/create", { timeout: 5000 });

      // Authentication 쿠키 제거
      await page.context().clearCookies();

      // 폼 입력값 채우기
      const titleInput = page.locator("input#title");
      const contentTextarea = page.locator("textarea#content");
      const submitButton = page.locator('button[type="submit"]');

      await titleInput.fill("Test Title");
      await contentTextarea.fill("Test Content");

      // 폼 제출
      await submitButton.click();

      // 로그인 페이지로 리다이렉션 확인
      await page.reload();
      await expect(page).toHaveURL("/login");
    });

    test("submits the form successfully when access_token is expired but refresh_token is valid", async ({
      page,
    }) => {
      // Arrange: 페이지에 컴포넌트 마운트
      await page.goto("/dashboard/posts/create");
      await page.waitForURL("/dashboard/posts/create", { timeout: 5000 });

      // 기존 access_token 저장
      const prevAccessToken = currentCookies.find(
        (cookie) => cookie.name === "access_token"
      );

      // access_token 만료 된 쿠키 생성
      const expireAccessTokenCookies = currentCookies.map((cookie) => {
        if (cookie.name === "access_token") {
          return {
            ...cookie,
            expires: Date.now() / 1000 + 1, // 만료 기간 변경경
          };
        }
        return cookie;
      });

      // Act: 쿠키 재 설정
      await page.context().clearCookies(); // 기존 쿠키를 모두 제거
      await page.context().addCookies(expireAccessTokenCookies); // 업데이트된 쿠키를 추가
      await page.reload();

      // access_token 만료까지 기다리기
      await page.waitForTimeout(2000);

      // 폼 입력값 채우기
      const titleInput = page.locator("input#title");
      const contentTextarea = page.locator("textarea#content");
      const submitButton = page.locator('button[type="submit"]');

      await titleInput.fill("Test Title with Refresh Token");
      await contentTextarea.fill("Test Content with Refresh Token");

      // Act: 폼 제출
      await submitButton.click();

      // Assert: 리다이렉션 확인 (게시물 목록 페이지로 이동)
      await page.waitForURL("/dashboard/posts", { timeout: 5000 });

      // Optional: 새로 발급된 access_token이 쿠키에 저장되었는지 확인
      const cookies = await page.context().cookies();
      const newAccessToken = cookies.find(
        (cookie) => cookie.name === "access_token"
      );
      expect(newAccessToken).toBeDefined();
      expect(newAccessToken?.value).not.toBe(prevAccessToken?.value);

      // 갱신된 토큰으로 로그인 정보 쿠키 갱신
      currentCookies = cookies;
      expect(currentCookies).toEqual(cookies);
    });
  });
});
