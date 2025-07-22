import { test, expect, BrowserContext, Page } from "@playwright/test";
import { withTemporaryLogout } from "../util/helper";
import { loginAsAdminIsolated } from "../util/auth-utils";
import { generateAdminUrls } from "../util/adminRoutes";
import {
  expectCookiesToBeDefined,
  expectCookiesToNotExist,
} from "../util/test-utils";

// 테스트 대상 admin 페이지 목록
const adminPages = generateAdminUrls();
const dataFetchingAdminPages = adminPages.filter(
  (url) => !url.endsWith("/create")
);

test.describe("Admin Page Access", () => {
  // 1. 비관리자 접근 테스트 (모든 URL)
  test.describe("Non-Admin Access", () => {
    adminPages.forEach((pageUrl) => {
      test(`일반 회원 접근 시 forbidden 리다이렉트 - ${pageUrl}`, async ({
        page,
      }) => {
        await page.goto("/");
        await expect(page).toHaveURL("/");
        await page.goto(pageUrl);
        await page.waitForURL("/forbidden", { timeout: 5000 });
      });
    });
  });

  // 2. 비로그인 상태 테스트 (모든 URL)
  test.describe("Logout Access", () => {
    adminPages.forEach((pageUrl) => {
      test(`비로그인 상태 접근 시 로그인 페이지 리다이렉트 - ${pageUrl}`, async ({
        page,
      }) => {
        await withTemporaryLogout(page, async () => {
          await page.goto("/");
          await expect(page).toHaveURL("/");
          await page.goto(pageUrl);
          await page.waitForURL("/login?error=session_expired", {
            timeout: 5000,
          });
        });
      });
    });
  });

  // 3. 관리자 접근 테스트 (모든 URL)
  test.describe("Admin Access", () => {
    let adminContext: BrowserContext;
    let adminPage: Page;

    // 관리자 컨텍스트를 한 번만 생성
    test.beforeAll(async ({ browser }) => {
      const result = await loginAsAdminIsolated(browser);
      adminContext = result.context;
      adminPage = result.page;
    });

    // 모든 URL 테스트 후 컨텍스트 종료
    test.afterAll(async () => {
      await adminContext.close();
    });

    adminPages.forEach((pageUrl) => {
      test(`관리자 접근 시 리다이렉트 없음 - ${pageUrl}`, async () => {
        await adminPage.goto("/");
        await expect(adminPage).toHaveURL("/");
        await adminPage.goto(pageUrl);
        await expect(adminPage).toHaveURL(pageUrl);
      });
    });
  });
});

// 4. access_token 만료 후 refreshing 테스트
test.describe("admin 페이지 접근 시 리프레싱 작동 테스트", () => {
  let adminContext: BrowserContext;
  let adminPage: Page;

  // 관리자 로그인 후 access_token만 삭제
  test.beforeEach(async ({ browser }) => {
    // 기존 컨텍스트가 있다면 종료
    if (adminContext) await adminContext.close();

    // 관리자 로그인
    const result = await loginAsAdminIsolated(browser);
    adminContext = result.context;
    adminPage = result.page;

    // access_token만 삭제
    const cookies = await adminContext.cookies();
    const filteredCookies = cookies.filter(
      (cookie) => cookie.name !== "access_token"
    );
    await adminContext.clearCookies();
    await adminContext.addCookies(filteredCookies);
  });

  test.afterAll(async () => {
    await adminContext.close();
  });

  adminPages.forEach((pageUrl) => {
    test(`access_token 없이 리프레시 토큰으로 접근 - ${pageUrl}`, async () => {
      await adminPage.goto(pageUrl);

      // 리프레시 성공 시 어드민 페이지에 접근 가능
      await expect(adminPage).toHaveURL(pageUrl);

      // 새로운 access_token이 발급되었는지 확인
      const cookies = await adminContext.cookies();
      expectCookiesToBeDefined(cookies, ["access_token"]);
    });
  });
});

test.describe("토큰 위조 후 정보 조회하는 admin 페이지 접근 시 로그아웃 후 로그인 리다이렉트", () => {
  let adminContext: BrowserContext;
  let adminPage: Page;

  // 관리자 로그인 후 access_token만 삭제
  test.beforeEach(async ({ browser }) => {
    // 기존 컨텍스트가 있다면 종료
    if (adminContext) await adminContext.close();

    // 관리자 로그인
    const result = await loginAsAdminIsolated(browser);
    adminContext = result.context;
    adminPage = result.page;

    // access_token과 refresh_token만 유효하지 않은 값으로 대체
    const cookies = await adminContext.cookies();
    const modifiedTokens = cookies
      .filter(
        (cookie) =>
          cookie.name === "access_token" || cookie.name === "refresh_token"
      )
      .map((cookie) => ({
        ...cookie,
        value: "invalid_token",
      }));

    // 기존 쿠키는 유지 + 토큰만 교체
    await adminContext.addCookies(modifiedTokens);
  });

  test.afterAll(async () => {
    await adminContext.close();
  });

  dataFetchingAdminPages.forEach((pageUrl) => {
    test(`토큰 위조 후 정보 조회하는 admin 페이지 접근 시 로그아웃 후 로그인 페이지 리다이렉트 - ${pageUrl}`, async () => {
      await adminPage.goto(pageUrl);

      await adminPage.waitForURL("/login?error=session_expired", {
        timeout: 5000,
      });

      const cookies = await adminContext.cookies();
      expectCookiesToNotExist(cookies, [
        "access_token",
        "refresh_token",
        "user",
      ]);
    });
  });
});
