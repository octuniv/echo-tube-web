// util/test-utils.ts (또는 새로운 util/message-utils.ts)
import { MessageResponses } from "@/lib/constants/message/constants";
import { expect, Locator, Page } from "@playwright/test";

/**
 * 특정 수신자에게 여러 개의 테스트 메시지를 생성합니다.
 * @param {Page} senderPage 메시지를 보낼 발신자(예: tester)가 로그인된 페이지
 * @param {string} receiverNickname 메시지를 받을 수신자의 닉네임
 * @param {number} count 생성할 메시지 수
 * @returns {Promise<number[]>} 생성된 메시지들의 ID 배열 (최신순)
 */
export async function createMessagesForUser(
  senderPage: Page,
  receiverNickname: string,
  count: number
): Promise<void> {
  for (let i = 0; i < count; i++) {
    const messageContent = `Test message #${i + 1} for pagination`;

    // 메시지 작성 페이지로 이동
    await senderPage.goto("/messages/new");
    // 내용과 수신자 입력
    await senderPage.fill(
      '[data-testid="message-content-input"]',
      messageContent
    );
    await senderPage.fill(
      '[data-testid="receiver-nickname-input"]',
      receiverNickname
    );
    // 전송
    await senderPage.click('[data-testid="send-message-button"]');

    // 전송 성공 확인
    await expect(senderPage.getByTestId("form-global-message")).toHaveText(
      MessageResponses.SENT
    );
  }

  return;
}

/**
 * preview 텍스트에서 '#숫자' 패턴을 찾아 숫자 배열로 반환하는 헬퍼 함수
 * @param {Locator} messageItems 메시지 아이템 로케이터
 * @returns {Promise<number[]>} 추출된 메시지 번호 배열 (문자열 파싱)
 */
export async function extractMessageNumbersFromPreview(
  messageItems: Locator
): Promise<number[]> {
  const previewElements = await messageItems
    .locator('[data-testid^="message-preview-"]')
    .allTextContents();

  // "Test message #15 for pagination" -> 15, "Test message #14 for pagination" -> 14
  return previewElements.map((previewText) => {
    const match = previewText.match(/#(\d+)\/15/);
    if (!match) {
      throw new Error(`Could not extract message number from: ${previewText}`);
    }
    return parseInt(match[1], 10); // # 뒤의 숫자를 추출
  });
}

/**
 * 현재 테스트 세션에서 생성된 메시지 아이템만 필터링하는 헬퍼 함수
 * @param {Page} page Playwright 페이지 객체
 * @param {string} tag 현재 테스트 세션의 고유 태그
 * @returns {Locator} 필터링된 메시지 아이템 로케이터
 */
export function getTestSessionMessageItems(page: Page, tag: string): Locator {
  // preview 텍스트에 고유 태그가 포함된 p 요소를 찾고, 그 부모인 Link 요소 (message-item)를 선택
  return page
    .locator(`p[data-testid^="message-preview-"]:has-text("${tag}")`)
    .locator("..");
}
