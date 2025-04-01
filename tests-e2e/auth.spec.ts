import { test, expect, Cookie, chromium } from "@playwright/test";
import { signUpAndLogin } from "./util/authUtil";
import { User } from "@/lib/definition";

const authTestAccount = {
  name: "authTest",
  nickname: "authTest",
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
      ["access_token", "refresh_token", "name", "nickname", "email"].forEach(
        (name) =>
          expect(
            insertedCookies.find((cookie) => cookie.name === name)
          ).toBeDefined()
      );
    });

    test("failed to submit with valid data when signUpAndLogin is invalid", async ({
      page,
    }) => {
      // 페이지에 컴포넌트 마운트
      await page.goto("/boards/free/create");
      await page.waitForURL("/boards/free/create", { timeout: 5000 });

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
      await page.goto("/boards/free/create");
      await page.waitForURL("/boards/free/create", { timeout: 5000 });

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
      await page.waitForURL("/boards/free", { timeout: 5000 });

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

  test.describe("About Deleting Post", () => {
    test.beforeEach(async ({ page }) => {
      await page.context().clearCookies();
      await page.context().addCookies(currentCookies);
      const insertedCookies = await page.context().cookies();
      ["access_token", "refresh_token", "name", "nickname", "email"].forEach(
        (name) =>
          expect(
            insertedCookies.find((cookie) => cookie.name === name)
          ).toBeDefined()
      );
    });

    test("should not be able to be deleted post by someone who manipulates cookies", async ({
      page,
    }) => {
      // 첫 번째 사용자: 게시물 작성
      await page.goto("/boards/free/create");

      await page.fill(
        "input#title",
        "Test to confirm that this post cannot be deleted"
      );
      await page.fill("textarea#content", "Test Content");

      await page.click('button[type="submit"]');

      // 게시물 목록 페이지로 리다이렉트 확인
      await expect(page).toHaveURL("/boards/free");

      // 쿠키 가져오기 및 초기화
      const cookies = await page.context().cookies();
      await page.context().clearCookies();

      // 새로운 access_token 및 refresh_token 설정
      const newAccessToken = "new-access-token-value";
      const newRefreshToken = "new-refresh-token-value";

      // 쿠키 재설정
      const manipulatedCookies = cookies.map((cookie) => {
        if (cookie.name === "access_token") {
          return { ...cookie, value: newAccessToken }; // access_token 업데이트
        }
        if (cookie.name === "refresh_token") {
          return { ...cookie, value: newRefreshToken }; // refresh_token 업데이트
        }
        return cookie; // 나머지 쿠키는 그대로 유지
      });

      // 업데이트된 쿠키를 브라우저에 추가
      await page.context().addCookies(manipulatedCookies);

      await page.goto("/boards/free");

      // 작성된 게시물 클릭
      const post = page
        .getByText("Test to confirm that this post cannot be deleted")
        .first();
      await post.click();

      // 게시물 상세 페이지 URL 검증
      await expect(page).toHaveURL(/\/boards\/free\/\d+/);

      // 삭제 버튼 상태 확인
      const deleteButton = page.getByRole("button", {
        name: "게시물 삭제",
      });
      const isButtonEnabled = await deleteButton.isEnabled();

      expect(isButtonEnabled).toBeTruthy();

      // confirm 대화상자 처리 준비
      page.on("dialog", async (dialog) => {
        await dialog.accept(); // "확인" 버튼 클릭
      });

      // 버튼 클릭
      await deleteButton.click();

      // 모든 상태 초기화 확인
      // 로그인 페이지로 변경되었는지 확인
      await page.waitForURL("/login", { timeout: 10000 });

      // 모든 쿠키 삭제되었는지 확인
      const remainingCookies = await page.context().cookies();
      console.log("Remaining Cookies:", remainingCookies);

      // 쿠키 배열이 비어 있는지 검증
      expect(remainingCookies.length).toBe(0);
    });
  });

  test.describe("About Editing Post", () => {
    test.beforeEach(async ({ page }) => {
      await page.context().clearCookies();
      await page.context().addCookies(currentCookies);
      const insertedCookies = await page.context().cookies();
      ["access_token", "refresh_token", "name", "nickname", "email"].forEach(
        (name) =>
          expect(
            insertedCookies.find((cookie) => cookie.name === name)
          ).toBeDefined()
      );
    });

    test("should not be able to be edited post by someone who manipulates cookies", async ({
      page,
    }) => {
      // 첫 번째 사용자: 게시물 작성
      await page.goto("/boards/free/create");

      await page.fill(
        "input#title",
        "Test to confirm that this post cannot be edited"
      );
      await page.fill("textarea#content", "Test Content");

      await page.click('button[type="submit"]');

      // 게시물 목록 페이지로 리다이렉트 확인
      await expect(page).toHaveURL("/boards/free");

      // 쿠키 가져오기 및 초기화
      const cookies = await page.context().cookies();
      await page.context().clearCookies();

      // 새로운 access_token 및 refresh_token 설정
      const newAccessToken = "new-access-token-value";
      const newRefreshToken = "new-refresh-token-value";

      // 쿠키 재설정
      const manipulatedCookies = cookies.map((cookie) => {
        if (cookie.name === "access_token") {
          return { ...cookie, value: newAccessToken }; // access_token 업데이트
        }
        if (cookie.name === "refresh_token") {
          return { ...cookie, value: newRefreshToken }; // refresh_token 업데이트
        }
        return cookie; // 나머지 쿠키는 그대로 유지
      });

      // 업데이트된 쿠키를 브라우저에 추가
      await page.context().addCookies(manipulatedCookies);

      await page.goto("/boards/free");

      // 작성된 게시물 클릭
      const post = page
        .getByText("Test to confirm that this post cannot be edited")
        .first();
      await post.click();

      // 게시물 상세 페이지 URL 검증
      await expect(page).toHaveURL(/\/boards\/free\/\d+/);

      // 편집 페이지 링크 상태 확인
      const editLink = page.getByRole("link", {
        name: "게시물 수정",
      });
      const isLinkEnabled = await editLink.isEnabled();

      expect(isLinkEnabled).toBeTruthy();

      // 링크 클릭
      await editLink.click();

      // 편집 페이지 진입 확인
      await page.waitForURL(/\/boards\/free\/edit\/\d+/, { timeout: 10000 });

      // 편집 내용 입력
      await page.fill("input#title", "This text should not be seen.");
      await page.fill("textarea#content", "This text should not be seen.");

      // 편집 버튼 클릭
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // 모든 상태 초기화 확인
      // 로그인 페이지로 변경되었는지 확인
      await page.waitForURL("/login", { timeout: 10000 });

      // 모든 쿠키 삭제되었는지 확인
      const remainingCookies = await page.context().cookies();
      console.log("Remaining Cookies:", remainingCookies);

      // 쿠키 배열이 비어 있는지 검증
      expect(remainingCookies.length).toBe(0);
    });
  });
});
