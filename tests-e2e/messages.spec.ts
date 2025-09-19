import { test, expect, Page, BrowserContext, Browser } from "@playwright/test";
import { createTestUser } from "./util/test-utils";
import {
  loginAsAdminIsolated,
  loginAsAnother,
  signUpAndLogin,
} from "./util/auth-utils";
import { MessageResponses } from "@/lib/constants/message/constants";

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

test.describe("Notice and Personal Message Sending & Delivery Test", () => {
  let browser: Browser;

  test.beforeAll(async ({ browser: b }) => {
    browser = b; // 브라우저 인스턴스를 저장
  });

  test.describe("Notice Message Test", () => {
    let adminPage: Page;
    let receiver1Page: Page;
    let receiver2Page: Page;

    let adminContext: BrowserContext;
    let receiver1Context: BrowserContext;
    let receiver2Context: BrowserContext;

    const receiver1 = createTestUser({
      name: "Receiver One",
    });
    const receiver2 = createTestUser({
      name: "Receiver Two",
    });

    test.beforeEach(async () => {
      const { context: newAdminContext, page: newAdminPage } =
        await loginAsAdminIsolated(browser);
      adminContext = newAdminContext;
      adminPage = newAdminPage;

      // Receiver 1 Context (새로운 유저 생성)
      receiver1Context = await browser.newContext();
      receiver1Page = await receiver1Context.newPage();

      await signUpAndLogin({
        account: receiver1,
        page: receiver1Page,
        context: receiver1Context,
      });

      // Receiver 2 Context (새로운 유저 생성)
      receiver2Context = await browser.newContext();
      receiver2Page = await receiver2Context.newPage();

      await signUpAndLogin({
        account: receiver2,
        page: receiver2Page,
        context: receiver2Context,
      });
    });

    test.afterEach(async () => {
      await adminPage.close();
      await receiver1Page.close();
      await receiver2Page.close();
      await adminContext.close();
      await receiver1Context.close();
      await receiver2Context.close();
    });

    test("Admin should send a notice and both receivers should receive it", async () => {
      // 1. 관리자: 공지 메시지 전송
      await adminPage.goto("/");
      await adminPage
        .getByRole("button", { name: "Sidebar Activation" })
        .click();
      await expect(
        adminPage.getByRole("link", { name: "admin-notices" })
      ).toBeVisible();
      await adminPage.getByRole("link", { name: "admin-notices" }).click();
      await adminPage.waitForURL("/admin/notices");

      // 메시지 내용 정의 (앞 30자를 preview로 사용)
      const noticeContent =
        "📢 [E2E TEST] 전체 사용자에게 전송되는 공지입니다.";
      const expectedPreview = `[공지] ${noticeContent.substring(0, 30)}...`;

      await adminPage.fill(
        '[data-testid="notice-content-input"]',
        noticeContent
      );
      await adminPage.click('[data-testid="notice-submit-button"]');

      // 전송 성공 메시지 대기
      await expect(
        adminPage.getByTestId("notice-form-global-message")
      ).toHaveText(MessageResponses.SENT);

      // 2. 수신자 1: 메시지 리스트에서 공지 메시지 확인 (preview 사용)
      await receiver1Page.goto("/messages");
      // preview 텍스트를 포함하는 p 태그를 찾고, 그 부모인 Link 요소를 선택
      const noticeItem1 = receiver1Page
        .locator(
          `p[data-testid^="message-preview-"]:has-text("${expectedPreview}")`
        )
        .locator("..");
      await expect(noticeItem1).toBeVisible();

      // 3. 수신자 2: 메시지 리스트에서 공지 메시지 확인 (preview 사용)
      await receiver2Page.goto("/messages");
      const noticeItem2 = receiver2Page
        .locator(
          `p[data-testid^="message-preview-"]:has-text("${expectedPreview}")`
        )
        .locator("..");
      await expect(noticeItem2).toBeVisible();

      // 4. 수신자 1: 메시지 상세 조회 후 읽음 상태 확인
      await noticeItem1.click();
      await expect(receiver1Page).toHaveURL(/\/messages\/\d+$/);
      await expect(
        receiver1Page.getByTestId("message-detail-title")
      ).toHaveText("📢 공지 메시지");
      await receiver1Page.getByTestId("back-to-list-button").click();
      await receiver1Page.reload();

      // 다시 리스트에서 해당 메시지 아이템 찾기 (preview로)
      const reloadedNoticeItem1 = receiver1Page
        .locator(
          `p[data-testid^="message-preview-"]:has-text("${expectedPreview}")`
        )
        .locator("..");
      const unreadBadgeAfterRefresh = reloadedNoticeItem1.locator(
        '[data-testid^="unread-badge-"]'
      );
      await expect(unreadBadgeAfterRefresh).not.toBeVisible(); // 읽음 상태여야 함
    });
  });

  test.describe("Personal Message Test", () => {
    let senderPage: Page;
    let receiverPage: Page;

    let senderContext: BrowserContext;
    let receiverContext: BrowserContext;

    const sender = createTestUser({
      name: "Message Sender",
    });
    const receiver = createTestUser({
      name: "Message Receiver",
    });

    test.beforeEach(async () => {
      // Sender Context (새로운 유저 생성)
      senderContext = await browser.newContext();
      senderPage = await senderContext.newPage();

      await signUpAndLogin({
        account: sender,
        page: senderPage,
        context: senderContext,
      });

      // Receiver Context (새로운 유저 생성)
      receiverContext = await browser.newContext();
      receiverPage = await receiverContext.newPage();

      await signUpAndLogin({
        account: receiver,
        page: receiverPage,
        context: receiverContext,
      });
    });

    test.afterEach(async () => {
      await senderPage.close();
      await receiverPage.close();
      await senderContext.close();
      await receiverContext.close();
    });

    test("User should send a personal message and the receiver should receive it", async () => {
      // 1. 발신자: 개인 메시지 작성
      await senderPage.goto("/");
      await senderPage
        .getByRole("button", { name: "Sidebar Activation" })
        .click();
      await expect(
        senderPage.getByRole("link", { name: "Sending message" })
      ).toBeVisible();
      await senderPage.getByRole("link", { name: "Sending message" }).click();
      await senderPage.waitForURL("/messages/new");

      const personalMessageContent =
        "안녕하세요, 이것은 E2E 테스트용 개인 메시지입니다.";
      const expectedPreview = personalMessageContent.substring(0, 30) + "...";

      await senderPage.fill(
        '[data-testid="message-content-input"]',
        personalMessageContent
      );
      await senderPage.fill(
        '[data-testid="receiver-nickname-input"]',
        receiver.nickname
      ); // receiver의 nickname
      await senderPage.click('[data-testid="send-message-button"]');

      // 전송 성공 메시지 대기
      await expect(senderPage.getByTestId("form-global-message")).toHaveText(
        MessageResponses.SENT
      );

      // 2. 수신자: 메시지 리스트에서 메시지 확인 (preview 사용)
      await receiverPage.goto("/messages");
      const personalMessageItem = receiverPage
        .locator(
          `p[data-testid^="message-preview-"]:has-text("${expectedPreview}")`
        )
        .locator("..");
      await expect(personalMessageItem).toBeVisible();

      // 3. 수신자: 메시지 상세 보기 및 내용 확인
      await personalMessageItem.click();
      await expect(receiverPage).toHaveURL(/\/messages\/\d+$/);
      await expect(receiverPage.getByTestId("message-detail-title")).toHaveText(
        "메시지"
      );
      await expect(receiverPage.getByTestId("message-sender-name")).toHaveText(
        sender.nickname
      );
      await expect(receiverPage.getByTestId("message-content")).toHaveText(
        personalMessageContent
      );

      // 4. 읽음 상태 확인 (리프레시 후)
      await receiverPage.getByTestId("back-to-list-button").click();
      await receiverPage.reload();

      // 다시 리스트에서 해당 메시지 아이템 찾기 (preview로)
      const reloadedPersonalMessageItem = receiverPage
        .locator(
          `p[data-testid^="message-preview-"]:has-text("${expectedPreview}")`
        )
        .locator("..");
      const unreadBadge = reloadedPersonalMessageItem.locator(
        '[data-testid^="unread-badge-"]'
      );
      await expect(unreadBadge).not.toBeVisible(); // 읽음 상태
    });
  });
});

test.describe("Message Deletion Functionality Test (Receiver Deletes)", () => {
  let browser: Browser;

  test.beforeAll(async ({ browser: b }) => {
    browser = b;
  });

  test.describe("Receiver should be able to delete received message", () => {
    let senderPage: any;
    let receiverPage: any;
    let senderContext: any;
    let receiverContext: any;

    const sender = createTestUser({
      name: "Deletion Test Sender",
    });
    const receiver = createTestUser({
      name: "Deletion Test Receiver",
    });

    test.beforeEach(async () => {
      // 발신자 컨텍스트 및 페이지 설정
      senderContext = await browser.newContext();
      senderPage = await senderContext.newPage();
      await signUpAndLogin({
        account: sender,
        page: senderPage,
        context: senderContext,
      });

      // 수신자 컨텍스트 및 페이지 설정
      receiverContext = await browser.newContext();
      receiverPage = await receiverContext.newPage();
      await signUpAndLogin({
        account: receiver,
        page: receiverPage,
        context: receiverContext,
      });
    });

    test.afterEach(async () => {
      await senderPage.close();
      await receiverPage.close();
      await senderContext.close();
      await receiverContext.close();
    });

    test("Receiver should be able to delete a received message, and it should disappear from their inbox", async () => {
      const testMessageContent =
        "This is a message for deletion testing by receiver.";

      // 1. 발신자가 메시지 전송
      await senderPage.goto("/messages/new");
      await senderPage.fill(
        '[data-testid="message-content-input"]',
        testMessageContent
      );
      await senderPage.fill(
        '[data-testid="receiver-nickname-input"]',
        receiver.nickname
      );
      await senderPage.click('[data-testid="send-message-button"]');
      await expect(senderPage.getByTestId("form-global-message")).toHaveText(
        MessageResponses.SENT
      );

      // 2. 수신자가 메시지 수신 확인
      await receiverPage.goto("/messages");
      const receivedMessageItem = receiverPage
        .locator(
          `p[data-testid^="message-preview-"]:has-text("${testMessageContent.substring(
            0,
            30
          )}")`
        )
        .locator("..");
      await expect(receivedMessageItem).toBeVisible();

      // 3. 수신자가 메시지 상세 페이지로 이동
      await receivedMessageItem.click();
      await expect(receiverPage).toHaveURL(/\/messages\/\d+$/);

      // 4. 수신자 페이지에서 삭제 버튼이 표시되는지 확인
      const deleteButtonOnReceiverPage = receiverPage.locator(
        `[data-testid^="delete-button-"]`
      );
      await expect(deleteButtonOnReceiverPage).toBeVisible(); // 수신자에게는 삭제 버튼이 보여야 함
      await deleteButtonOnReceiverPage.click();

      // 5. 삭제 확인 모달에서 '삭제' 버튼 클릭
      const messageId = await receiverPage.url().split("/").pop();
      if (!messageId) throw new Error("Could not extract message ID from URL");
      const confirmDeleteButton = receiverPage.locator(
        `[data-testid="confirm-delete-button-${messageId}"]`
      );
      await expect(confirmDeleteButton).toBeVisible();
      await confirmDeleteButton.click();

      // 6. 삭제 성공 메시지 확인
      const deleteResultMessage = receiverPage.locator(
        `[data-testid="delete-result-message"]`
      );
      await expect(deleteResultMessage).toBeVisible();
      await expect(deleteResultMessage).toHaveText(MessageResponses.DELETED);

      // 7. 자동으로 메시지 목록 페이지로 리다이렉트되는지 확인
      await receiverPage.waitForURL("/messages");

      // 8. 수신자의 메시지 목록에서 삭제된 메시지가 사라졌는지 확인
      await receiverPage.reload(); // 확실한 확인을 위해 새로고침
      const deletedMessageItem = receiverPage
        .locator(
          `p[data-testid^="message-preview-"]:has-text("${testMessageContent.substring(
            0,
            30
          )}")`
        )
        .locator("..");
      await expect(deletedMessageItem).not.toBeVisible(); // 메시지가 목록에서 사라져야 함

      // 9. [부정 테스트] 삭제된 메시지에 직접 접근 시도
      await receiverPage.goto(`/messages/${messageId}`);

      const notFoundMessage = receiverPage.locator(
        '[data-testid="message-not-found-container"]'
      );
      await expect(notFoundMessage).toBeVisible();

      await expect(notFoundMessage).toContainText("메시지를 찾을 수 없습니다.");
    });
  });
});
