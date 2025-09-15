import { test, expect, Page } from "@playwright/test";
import { createTestUser } from "./util/test-utils";
import { loginAsAnother } from "./util/auth-utils";

test.describe("Test to read Message", () => {
  const receivedMessagesUser = createTestUser({
    name: process.env.tester2_name as string,
    nickname: process.env.tester2_nickname as string,
    email: process.env.tester2_email as string,
    password: process.env.tester2_password as string,
  });

  test.beforeEach(async ({ page, context }) => {
    await loginAsAnother({ account: receivedMessagesUser, page, context });
  });

  test.describe("Message List Pagination & Order Test", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/");
      await page.getByRole("button", { name: "Sidebar Activation" }).click();
      await expect(page.getByRole("link", { name: "messages" })).toBeVisible();
      await page.getByRole("link", { name: "messages" }).click();
      await page.waitForURL("/messages");
    });

    test("should display first page with latest 10 messages (#15 to #6)", async ({
      page,
    }) => {
      const messageItems = page.locator('[data-testid^="message-item-"]');
      await expect(messageItems).toHaveCount(10);

      const extractedIds = await Promise.all(
        (
          await messageItems.all()
        ).map(async (item) => {
          const dataTestId = await item.getAttribute("data-testid");
          if (!dataTestId) throw new Error("data-testid not found");
          return parseInt(dataTestId.split("-")[2], 10);
        })
      );

      const expectedIds = [15, 14, 13, 12, 11, 10, 9, 8, 7, 6];
      for (let i = 0; i < 10; i++) {
        expect(extractedIds[i]).toBe(expectedIds[i]);
      }
    });

    test("should navigate to page 2 and display remaining 5 messages (#5 to #1)", async ({
      page,
    }) => {
      await page.getByTestId("pagination-메시지-목록-page-2").click();
      await expect(page).toHaveURL(/.*page=2/);

      const messageItems = page.locator('[data-testid^="message-item-"]');
      await expect(messageItems).toHaveCount(5);

      const extractedIds = await Promise.all(
        (
          await messageItems.all()
        ).map(async (item) => {
          const dataTestId = await item.getAttribute("data-testid");
          if (!dataTestId) throw new Error("data-testid not found");
          return parseInt(dataTestId.split("-")[2], 10);
        })
      );

      const expectedIds = [5, 4, 3, 2, 1];
      for (let i = 0; i < 5; i++) {
        expect(extractedIds[i]).toBe(expectedIds[i]);
      }
    });

    test("should maintain correct chronological order across pages (end-to-end)", async ({
      page,
    }) => {
      await page.reload();

      const page1Items = page.locator('[data-testid^="message-item-"]');
      await expect(page1Items).toHaveCount(10);

      const page1Ids = await Promise.all(
        (
          await page1Items.all()
        ).map(async (item) => {
          const dataTestId = await item.getAttribute("data-testid");
          if (!dataTestId)
            throw new Error("Missing data-testid on message item");
          const parts = dataTestId.split("-");
          if (parts.length < 3)
            throw new Error(`Invalid data-testid format: ${dataTestId}`);
          const id = parseInt(parts[2], 10);
          if (isNaN(id))
            throw new Error(`Invalid message ID in: ${dataTestId}`);
          return id;
        })
      );

      await page.getByTestId("pagination-메시지-목록-page-2").click();
      await expect(page).toHaveURL(/.*page=2/);

      const page2Items = page.locator('[data-testid^="message-item-"]');
      await expect(page2Items).toHaveCount(5);

      const page2Ids = await Promise.all(
        (
          await page2Items.all()
        ).map(async (item) => {
          const dataTestId = await item.getAttribute("data-testid");
          if (!dataTestId)
            throw new Error("Missing data-testid on message item");
          const parts = dataTestId.split("-");
          if (parts.length < 3)
            throw new Error(`Invalid data-testid format: ${dataTestId}`);
          const id = parseInt(parts[2], 10);
          if (isNaN(id))
            throw new Error(`Invalid message ID in: ${dataTestId}`);
          return id;
        })
      );

      const allIds = [...page1Ids, ...page2Ids];
      const expectedOrder = Array.from({ length: 15 }, (_, i) => 15 - i);

      expect(allIds).toEqual(expectedOrder);
    });
  });

  test.describe("Message Detail Read Status Update Test", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/");
      await page.getByRole("button", { name: "Sidebar Activation" }).click();
      await expect(page.getByRole("link", { name: "messages" })).toBeVisible();
      await page.getByRole("link", { name: "messages" }).click();
      await page.waitForURL("/messages");
    });

    test("should mark message as read after viewing detail and refresh", async ({
      page,
    }) => {
      await page.waitForSelector('[data-testid^="message-item-"]');
      const unreadBadges = page.locator('[data-testid^="unread-badge-"]');

      const count = await unreadBadges.count();

      if (count === 0) {
        throw new Error(
          "No unread messages found. This test requires at least one unread message to proceed. Seed data may be inconsistent or already read."
        );
      }

      const firstUnreadItem = page
        .locator(
          `a[data-testid^="message-item-"]:has([data-testid^="unread-badge-"])`
        )
        .first();
      console.log(firstUnreadItem);
      const messageId = await firstUnreadItem.getAttribute("data-testid");
      if (!messageId) {
        throw new Error(
          "Failed to extract message item ID from unread badge parent."
        );
      }
      const id = messageId.split("-")[2];

      const message = {
        id: parseInt(id, 10),
        senderNickname: "tester",
        content: `This is test message #${id} from tester to tester2`,
        isRead: false,
        isNotice: false,
      };

      await firstUnreadItem.click();

      await expect(page).toHaveURL(/\/messages\/\d+$/);

      const detailTitle = page.getByTestId("message-detail-title");
      await expect(detailTitle).toHaveText(
        message.isNotice ? "📢 공지 메시지" : "메시지"
      );

      const senderName = page.getByTestId("message-sender-name");
      await expect(senderName).toHaveText(message.senderNickname);
      await expect(senderName).toHaveAttribute(
        "aria-label",
        `발신자: ${message.senderNickname}`
      );

      const messageContent = page.getByTestId("message-content");
      await expect(messageContent).toHaveText(message.content);
      await expect(messageContent).toHaveAttribute(
        "aria-label",
        `메시지 내용: ${message.content}`
      );

      const messageTypeBadge = page.locator(
        '[class*="bg-red-100"]:has-text("공지"), [class*="bg-blue-100"]:has-text("개인")'
      );
      await expect(messageTypeBadge).toBeVisible();
      await expect(messageTypeBadge).toHaveAttribute(
        "aria-label",
        message.isNotice ? "공지 메시지" : "개인 메시지"
      );

      await page.getByTestId("back-to-list-button").click();

      await expect(page).toHaveURL("/messages");

      await page.reload();

      const updatedMessageItem = page.locator(
        `[data-testid="message-item-${id}"]`
      );
      await expect(updatedMessageItem).toBeVisible();

      const unreadBadgeAfterRefresh = updatedMessageItem.locator(
        '[data-testid^="unread-badge-"]'
      );
      await expect(unreadBadgeAfterRefresh).not.toBeVisible();

      const messageClass = await updatedMessageItem.getAttribute("class");
      expect(messageClass).toContain("bg-white");
      expect(messageClass).toContain("border-gray-200");
      expect(messageClass).not.toContain("bg-blue-50");
      expect(messageClass).not.toContain("border-blue-200");
    });
  });
});
