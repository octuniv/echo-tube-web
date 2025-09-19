import {
  test,
  expect,
  Page,
  BrowserContext,
  Browser,
  Locator,
} from "@playwright/test";
import { createTestUser } from "./util/test-utils";
import {
  loginAsAdminIsolated,
  loginAsAnother,
  signUpAndLogin,
} from "./util/auth-utils";
import { MessageResponses } from "@/lib/constants/message/constants";
import {
  createMessagesForUser,
  extractMessageNumbersFromPreview,
  getTestSessionMessageItems,
} from "./util/message-utils";

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
    let senderPage: Page;
    let senderContext: BrowserContext;
    const sender = createTestUser({
      name: "Pagination Test Sender",
    });

    // ✅ 현재 테스트 세션을 식별하기 위한 고유 키
    let testSessionTag: string;

    // beforeEach에서 로그인 + 테스트 데이터 생성
    test.beforeEach(async ({ page, browser }) => {
      // 고유한 세션 태그 생성 (타임스탬프 기반)
      const shortTimestamp = Date.now().toString().slice(-4);
      testSessionTag = `TS_${shortTimestamp}`;

      // 새로운 발신자 컨텍스트 생성 및 로그인
      senderContext = await browser.newContext();
      senderPage = await senderContext.newPage();
      await signUpAndLogin({
        account: sender,
        page: senderPage,
        context: senderContext,
      });

      // tester2에게 15개의 메시지 전송 (고유 태그 포함)
      for (let i = 1; i <= 15; i++) {
        // ✅ 고유 태그를 내용에 포함
        const messageContent = `${testSessionTag} #${i}/15: Test message for pagination order check.`;

        await senderPage.goto("/messages/new");
        await senderPage.fill(
          '[data-testid="message-content-input"]',
          messageContent
        );
        await senderPage.fill(
          '[data-testid="receiver-nickname-input"]',
          receivedMessagesUser.nickname
        );
        await senderPage.click('[data-testid="send-message-button"]');

        // 전송 성공 확인
        await expect(senderPage.getByTestId("form-global-message")).toHaveText(
          MessageResponses.SENT
        );
      }

      // 테스터2 페이지로 돌아가서 메시지 목록 페이지로 이동
      await page.goto("/");
      await page.getByRole("button", { name: "Sidebar Activation" }).click();
      await expect(page.getByRole("link", { name: "messages" })).toBeVisible();
      await page.getByRole("link", { name: "messages" }).click();
      await page.waitForURL("/messages");
    });

    test.afterEach(async () => {
      // 발신자 컨텍스트 정리
      if (senderPage) await senderPage.close();
      if (senderContext) await senderContext.close();
    });

    test("should display first page with latest 10 messages (ordered by #15 to #6)", async ({
      page,
    }) => {
      // ✅ 현재 테스트 세션의 메시지만 필터링
      const messageItems = getTestSessionMessageItems(page, testSessionTag);
      await expect(messageItems).toHaveCount(10);

      const messageNumbers = await extractMessageNumbersFromPreview(
        messageItems
      );
      const expectedOrder = [15, 14, 13, 12, 11, 10, 9, 8, 7, 6];
      expect(messageNumbers).toEqual(expectedOrder);
    });

    test("should navigate to page 2 and display remaining 5 messages (#5 to #1)", async ({
      page,
    }) => {
      // 페이지 하단으로 스크롤
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

      // 2페이지 버튼 클릭
      const page2Button = page.getByTestId("pagination-메시지-목록-page-2");
      await expect(page2Button).toBeVisible();
      await expect(page2Button).toBeEnabled();
      await page2Button.click();

      // URL 확인
      await expect(page).toHaveURL(/.*page=2/);

      // ✅ 현재 테스트 세션의 메시지만 필터링
      const messageItems = getTestSessionMessageItems(page, testSessionTag);
      await expect(messageItems).toHaveCount(5);

      const messageNumbers = await extractMessageNumbersFromPreview(
        messageItems
      );
      const expectedOrder = [5, 4, 3, 2, 1];
      expect(messageNumbers).toEqual(expectedOrder);
    });

    test("should maintain correct chronological order across pages (end-to-end)", async ({
      page,
    }) => {
      // 페이지 1의 메시지 추출
      const page1Items = getTestSessionMessageItems(page, testSessionTag);
      const page1Numbers = await extractMessageNumbersFromPreview(page1Items);

      // 페이지 2로 이동
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.getByTestId("pagination-메시지-목록-page-2").click();
      await expect(page).toHaveURL(/.*page=2/);

      // 페이지 2의 메시지 추출
      const page2Items = getTestSessionMessageItems(page, testSessionTag);
      const page2Numbers = await extractMessageNumbersFromPreview(page2Items);

      // 전체 순서 검증
      const allNumbers = [...page1Numbers, ...page2Numbers];
      const expectedFullOrder = Array.from({ length: 15 }, (_, i) => 15 - i);
      expect(allNumbers).toEqual(expectedFullOrder);
    });
  });

  test.describe("Message Detail Read Status Update Test", () => {
    let senderPage: Page;
    let senderContext: BrowserContext;
    const sender = createTestUser({
      name: "Read Status Test Sender",
    });

    // beforeEach: 테스트용 메시지 생성 + 메시지 목록 페이지로 이동
    test.beforeEach(async ({ page, browser }) => {
      // 1. 새로운 발신자 컨텍스트 생성 및 로그인
      senderContext = await browser.newContext();
      senderPage = await senderContext.newPage();
      await signUpAndLogin({
        account: sender,
        page: senderPage,
        context: senderContext,
      });

      // 2. tester2에게 테스트 메시지 전송
      const testMessageContent =
        "E2E Test: This message will be marked as read.";
      await senderPage.goto("/messages/new");
      await senderPage.fill(
        '[data-testid="message-content-input"]',
        testMessageContent
      );
      await senderPage.fill(
        '[data-testid="receiver-nickname-input"]',
        receivedMessagesUser.nickname
      );
      await senderPage.click('[data-testid="send-message-button"]');
      await expect(senderPage.getByTestId("form-global-message")).toHaveText(
        MessageResponses.SENT
      );

      // 3. tester2 페이지로 돌아가서 메시지 목록 페이지로 이동
      await page.goto("/");
      await page.getByRole("button", { name: "Sidebar Activation" }).click();
      await expect(page.getByRole("link", { name: "messages" })).toBeVisible();
      await page.getByRole("link", { name: "messages" }).click();
      await page.waitForURL("/messages");

      // ✅ 테스트 메시지가 목록에 나타날 때까지 대기
      // preview 텍스트를 기반으로 메시지가 도착했는지 확인
      const expectedPreview = testMessageContent.substring(0, 30) + "...";
      const sentMessageItem = page
        .locator(
          `p[data-testid^="message-preview-"]:has-text("${expectedPreview}")`
        )
        .locator("..");
      await expect(sentMessageItem).toBeVisible();
    });

    // afterEach: 발신자 컨텍스트 정리
    test.afterEach(async () => {
      if (senderPage) await senderPage.close();
      if (senderContext) await senderContext.close();
    });

    test("should mark message as read after viewing detail and refresh", async ({
      page,
    }) => {
      // ✅ 1. 방금 전송한 테스트 메시지 식별
      // 메시지 목록은 createdAt DESC (최신순)으로 정렬되므로, 첫 번째 아이템이 우리가 보낸 메시지입니다.
      const firstMessageItem = page
        .locator('[data-testid^="message-item-"]')
        .first();
      await expect(firstMessageItem).toBeVisible();

      const expectedPreview = "E2E Test: This message will be...";
      const previewText = await firstMessageItem
        .locator('[data-testid^="message-preview-"]')
        .textContent();
      expect(previewText).toContain(expectedPreview);

      // ✅ 2. 해당 메시지가 '읽지 않음' 상태인지 확인
      const unreadBadge = firstMessageItem.locator(
        '[data-testid^="unread-badge-"]'
      );
      await expect(unreadBadge).toBeVisible(); // 읽지 않음 배지가 있어야 함
      const messageClass = await firstMessageItem.getAttribute("class");
      expect(messageClass).toContain("bg-blue-50"); // 읽지 않음 스타일
      expect(messageClass).toContain("border-blue-200");

      // ✅ 3. 메시지 상세 페이지로 이동
      await firstMessageItem.click();
      await expect(page).toHaveURL(/\/messages\/\d+$/);

      // ✅ 4. 상세 페이지 내용 검증 (선택 사항, 기존 로직 유지)
      const detailTitle = page.getByTestId("message-detail-title");
      await expect(detailTitle).toHaveText("메시지");
      const senderName = page.getByTestId("message-sender-name");
      await expect(senderName).toHaveText(sender.nickname);
      const messageContent = page.getByTestId("message-content");
      await expect(messageContent).toHaveText(
        "E2E Test: This message will be marked as read."
      );

      // ✅ 5. 목록으로 돌아가기
      await page.getByTestId("back-to-list-button").click();
      await expect(page).toHaveURL("/messages");

      // ✅ 6. 페이지 새로고침 (서버 상태 동기화)
      await page.reload();

      // ✅ 7. 동일한 메시지 아이템이 읽음 상태로 업데이트되었는지 확인
      // 다시 첫 번째 아이템을 찾습니다. (정렬이 유지된다면 동일한 메시지입니다.)
      const updatedMessageItem = page
        .locator('[data-testid^="message-item-"]')
        .first();
      await expect(updatedMessageItem).toBeVisible();

      // preview 내용으로 동일한 메시지인지 재확인 (안정성 향상)
      const updatedPreviewText = await updatedMessageItem
        .locator('[data-testid^="message-preview-"]')
        .textContent();
      expect(updatedPreviewText).toContain(expectedPreview);

      // 읽음 상태 확인
      const unreadBadgeAfterRefresh = updatedMessageItem.locator(
        '[data-testid^="unread-badge-"]'
      );
      await expect(unreadBadgeAfterRefresh).not.toBeVisible(); // 읽음 상태: 배지 사라짐

      const updatedMessageClass = await updatedMessageItem.getAttribute(
        "class"
      );
      expect(updatedMessageClass).toContain("bg-white"); // 읽음 스타일
      expect(updatedMessageClass).toContain("border-gray-200");
      expect(updatedMessageClass).not.toContain("bg-blue-50");
      expect(updatedMessageClass).not.toContain("border-blue-200");
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
