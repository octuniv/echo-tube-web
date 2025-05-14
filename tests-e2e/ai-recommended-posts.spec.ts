import { test, expect } from "@playwright/test";

test.describe("ai-recommended posts e2e test", () => {
  test.beforeAll(async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Sidebar Activation" }).click();

    const aiDigestBoardHeading = page.locator("#ai-digest-heading");
    await expect(aiDigestBoardHeading).toBeVisible();
    await expect(aiDigestBoardHeading).toContainText("AI 추천 게시판");

    const aiDigestLinks = page.locator(
      "div.space-y-2:has(h3#ai-digest-heading) a"
    );

    console.log(aiDigestLinks);

    const linkCount = await aiDigestLinks.count();
    expect(linkCount).toBeGreaterThan(0);

    const aiDigestFirstBoardUrl = await aiDigestLinks
      .first()
      .getAttribute("href");

    expect(aiDigestFirstBoardUrl).toMatch(/^\/boards\/ai-digest\//);

    console.log("AI 추천 게시판 첫 번째 링크 주소:", aiDigestFirstBoardUrl);
  });

  test.describe("AI Digest Board Page Load Test", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/boards/ai-digest/nestjs"); // boardSlug for Test

      await page.waitForSelector(".space-y-6");
    });

    test("should display AI Digest badge and description", async ({ page }) => {
      const aiBadge = page.locator(".bg-blue-100.px-2.py-0\\.5.rounded", {
        hasText: "AI 큐레이션",
      });
      await expect(aiBadge).toBeVisible();

      const aiDescription = page
        .locator(".text-gray-500")
        .filter({ hasText: "봇이 자동으로 수집한 추천 영상" });
      await expect(aiDescription).toBeVisible();
    });

    test("should display video cards with required information", async ({
      page,
    }) => {
      // 비디오 카드가 반드시 존재해야 함
      await expect(page.locator(".grid.grid-cols-1")).toBeVisible();

      const videoCards = page.locator(".border.p-4.rounded-lg.shadow-md");
      const count = await videoCards.count();
      expect(count).toBeGreaterThan(0); // 최소 1개 이상의 게시글 존재

      for (let i = 0; i < count; i++) {
        const card = videoCards.nth(i);
        // 필수 정보 검증
        await expect(card.locator("h2.text-xl.font-semibold")).toBeVisible();
        await expect(card.locator("p.text-gray-600")).toBeVisible();
        await expect(card.locator("p.text-gray-500.text-sm")).toBeVisible();

        // AI 관련 정보 검증
        const channelInfo = card.locator("p").filter({ hasText: /^채널:/ });
        const durationInfo = card.locator("p").filter({ hasText: /^길이:/ });
        // const sourceInfo = card.locator("p").filter({ hasText: /^출처:/ });
        await expect(channelInfo).toBeVisible();
        await expect(durationInfo).toBeVisible();
        // await expect(sourceInfo).toBeVisible(); // 예시로 저장된 게시글의 경우 출처가 존재하지 않음.
      }
    });

    test("should have working links on video cards with non-editable state", async ({
      page,
    }) => {
      const firstVideoCard = page
        .locator(".border.p-4.rounded-lg.shadow-md")
        .first();
      const titleLocator = firstVideoCard.locator("h2.text-xl.font-semibold");
      const titleText = await titleLocator.textContent();

      await firstVideoCard.click();
      await page.waitForURL(/\/boards\/ai-digest\/.*\/\d+/);

      // 포스트 페이지 요소 검증
      await expect(page.getByLabel(`게시물 제목: ${titleText}`)).toBeVisible();

      // AI 관련 정보 검증
      await expect(page.locator("p:has-text('채널:')")).toBeVisible();
      await expect(page.locator("p:has-text('길이:')")).toBeVisible();
      //   await expect(page.locator("p:has-text('출처:')")).toBeVisible(); // 해당 게시물은 출처가 없음.

      // 수정/삭제 버튼 비활성화 검증
      const editButton = page.getByRole("link", { name: "수정" });
      const deleteButton = page.getByRole("button", { name: "삭제" });

      await expect(editButton).toBeDisabled();
      await expect(deleteButton).toBeDisabled();
    });
  });
});
