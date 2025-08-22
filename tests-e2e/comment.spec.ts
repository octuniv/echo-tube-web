import { test, expect, Page } from "@playwright/test";
import { withTemporaryLogout } from "./util/helper";

test.describe("댓글 및 대댓글 조회 테스트", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/boards/commenttest");
    await page.waitForURL("/boards/commenttest", { timeout: 5000 });
    await page.reload();
  });

  test("페이징 된 댓글들과 대댓글들이 올바르게 불러졌는지 확인합니다.", async ({
    page,
  }) => {
    // 1. 게시물 클릭
    const post = page.getByRole("link", { name: "Comment Test Post" }).first();
    await post.click();
    await page.waitForURL(/\/boards\/commenttest\/\d+/, { timeout: 5000 });

    // 2. 댓글 폼이 보이는지 확인
    await expect(
      page.locator('textarea[placeholder="댓글을 작성해주세요..."]')
    ).toBeVisible();
    await expect(page.getByText("0/500")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "댓글 등록 버튼" })
    ).toBeVisible();

    // 3. 부모 댓글 15부터 6까지가 내림차순으로 정확히 10개 있는지 확인
    const parentComments = page.locator(
      "div.bg-white.rounded-lg.p-4.border.border-gray-200"
    );
    await expect(parentComments).toHaveCount(10);

    // 4. 부모 댓글 내용이 정확한지 순서대로 확인
    const expectedParentComments = [
      "부모 댓글 15",
      "부모 댓글 14",
      "부모 댓글 13",
      "부모 댓글 12",
      "부모 댓글 11",
      "부모 댓글 10",
      "부모 댓글 9",
      "부모 댓글 8",
      "부모 댓글 7",
      "부모 댓글 6",
    ];

    for (let i = 0; i < expectedParentComments.length; i++) {
      const commentText = await parentComments
        .nth(i)
        .locator('p[aria-label="parent-comment"]')
        .textContent();
      expect(commentText?.trim()).toBe(expectedParentComments[i]);
    }

    // 5. 각 부모 댓글의 "답글 보기" 버튼 클릭 및 대댓글 확인
    for (let i = 0; i < 10; i++) {
      const commentContainer = parentComments.nth(i);

      // "답글 보기" 버튼 찾기
      const replyButton = commentContainer.getByText(/^답글 보기/);

      // 이미 답글이 열려있는 경우가 있을 수 있으므로, "답글 보기" 텍스트가 포함된 경우만 클릭
      const buttonText = await replyButton.textContent();
      if (buttonText && buttonText.includes("답글 보기")) {
        await replyButton.scrollIntoViewIfNeeded();
        await replyButton.click();
        await page.waitForTimeout(200); // UI 반응 대기
      }

      // 부모 댓글 번호 추출 (예: "부모 댓글 15"에서 15 추출)
      const parentCommentText = await commentContainer
        .locator('p[aria-label="parent-comment"]')
        .textContent();
      const parentCommentNumber = parseInt(
        parentCommentText?.replace("부모 댓글 ", "") || "0"
      );

      // 대댓글 컨테이너 확인
      const replyContainer = commentContainer.locator(
        "div.mt-5 > div.pt-3.pb-4.pl-4.pr-2"
      );
      const replyCount = await replyContainer.count();

      // 부모 댓글 번호가 짝수면 대댓글 2개, 홀수면 대댓글 1개가 있어야 함
      if (parentCommentNumber % 2 === 0) {
        // 짝수 번호 부모 댓글: 대댓글 2개 확인
        await expect(replyContainer).toHaveCount(2);
      } else {
        // 홀수 번호 부모 댓글: 대댓글 1개 확인
        await expect(replyContainer).toHaveCount(1);
      }

      // 각 대댓글 확인
      for (let j = 0; j < replyCount; j++) {
        const reply = replyContainer.nth(j);

        // 대댓글 작성자 확인 (tester2 여야 함)
        const author = await reply
          .locator("span.font-medium.text-gray-800")
          .textContent();
        expect(author?.trim()).toBe("tester2");

        // 대댓글 내용 확인 (대댓글 X-Y 형식)
        const replyContent = await reply
          .locator('p[aria-label="reply-comment"]')
          .textContent();
        const expectedReplyContent = `대댓글 ${parentCommentNumber}-${j + 1}`;
        expect(replyContent?.trim()).toBe(expectedReplyContent);
      }
    }

    // 6. 페이지네이션 컨트롤 확인
    const pagination = page.locator("div.flex.justify-center.mt-4.space-x-2");
    await expect(pagination).toBeVisible();

    // 6.1. 페이지네이션 내부의 페이지 링크 확인
    const pageLinks = pagination.locator("a");
    await expect(pageLinks).toHaveCount(2);

    // 6.2. 1페이지가 현재 활성화 상태인지 확인 (bg-blue-500 클래스 확인)
    const currentPage = pageLinks.nth(0);
    await expect(currentPage).toHaveClass(/bg-blue-500/);
    await expect(currentPage).toHaveText("1");

    // 6.3. 2페이지가 비활성화 상태인지 확인 (bg-gray-200 클래스 확인)
    const nextPage = pageLinks.nth(1);
    await expect(nextPage).toHaveClass(/bg-gray-200/);
    await expect(nextPage).toHaveText("2");

    // 7. 2페이지 클릭
    await nextPage.click();

    // 8. 2페이지로 이동 완료 확인
    await page.waitForURL(/page=2/, { timeout: 5000 });

    // 9. 2페이지의 부모 댓글 확인 (5개의 댓글이 표시되어야 함)
    const secondPageComments = page.locator(
      "div.bg-white.rounded-lg.p-4.border.border-gray-200"
    );

    // 9.1. 2페이지에는 5개의 부모 댓글이 표시되어야 함
    await expect(secondPageComments).toHaveCount(5);

    // 9.2. 부모 댓글 5부터 1까지가 내림차순으로 표시되는지 확인
    const expectedSecondPageComments = [
      "부모 댓글 5",
      "부모 댓글 4",
      "부모 댓글 3",
      "부모 댓글 2",
      "부모 댓글 1",
    ];

    for (let i = 0; i < expectedSecondPageComments.length; i++) {
      const commentText = await secondPageComments
        .nth(i)
        .locator('p[aria-label="parent-comment"]')
        .textContent();
      expect(commentText?.trim()).toBe(expectedSecondPageComments[i]);
    }

    // 10. 2페이지에서도 대댓글 확인 (5부터 1까지)
    for (let i = 0; i < 5; i++) {
      const commentContainer = secondPageComments.nth(i);

      // "답글 보기" 버튼 찾기
      const replyButton = commentContainer.getByText(/^답글 보기/);

      // 답글이 이미 열려있을 수 있으므로, "답글 보기" 텍스트가 포함된 경우만 클릭
      const buttonText = await replyButton.textContent();
      if (buttonText && buttonText.includes("답글 보기")) {
        await replyButton.scrollIntoViewIfNeeded();
        await replyButton.click();
        await page.waitForTimeout(200); // UI 반응 대기
      }

      // 부모 댓글 번호 추출
      const parentCommentText = await commentContainer
        .locator('p[aria-label="parent-comment"]')
        .textContent();
      const parentCommentNumber = parseInt(
        parentCommentText?.replace("부모 댓글 ", "") || "0"
      );

      // 대댓글 컨테이너 확인
      const replyContainer = commentContainer.locator(
        "div.mt-5 > div.pt-3.pb-4.pl-4.pr-2"
      );
      const replyCount = await replyContainer.count();

      // 부모 댓글 번호가 짝수면 대댓글 2개, 홀수면 대댓글 1개가 있어야 함
      if (parentCommentNumber % 2 === 0) {
        // 짝수 번호 부모 댓글: 대댓글 2개 확인
        await expect(replyContainer).toHaveCount(2);
      } else {
        // 홀수 번호 부모 댓글: 대댓글 1개 확인
        await expect(replyContainer).toHaveCount(1);
      }

      // 각 대댓글 확인
      for (let j = 0; j < replyCount; j++) {
        const reply = replyContainer.nth(j);

        // 대댓글 작성자 확인 (tester2 여야 함)
        const author = await reply
          .locator("span.font-medium.text-gray-800")
          .textContent();
        expect(author?.trim()).toBe("tester2");

        // 대댓글 내용 확인 (대댓글 X-Y 형식)
        const replyContent = await reply
          .locator('p[aria-label="reply-comment"]')
          .textContent();
        const expectedReplyContent = `대댓글 ${parentCommentNumber}-${j + 1}`;
        expect(replyContent?.trim()).toBe(expectedReplyContent);
      }
    }
  });
});

test.describe("댓글 기능성 테스트", () => {
  const postName = "Comment Functionality Test";

  test.beforeEach(async ({ page }) => {
    await page.goto("/boards/commenttest/create");
    await page.waitForURL("/boards/commenttest/create", { timeout: 5000 });
    await page.reload();

    const titleInput = page.locator("input#title");
    const contentTextarea = page.locator("textarea#content");
    const submitButton = page.locator('button[type="submit"]');

    await titleInput.fill(postName);
    await contentTextarea.fill(postName);

    await submitButton.click();

    await expect(page).toHaveURL("/boards/commenttest");

    const post = page.getByRole("link", { name: postName }).first();
    await post.click();

    await page.waitForURL(/\/boards\/commenttest\/\d+/, { timeout: 5000 });
  });

  test.afterEach(async ({ page }) => {
    await page.goto("/boards/commenttest");
    await page.waitForURL("/boards/commenttest", { timeout: 5000 });
    await page.reload();

    const post = page.getByRole("link", { name: postName }).first();
    await post.click();

    await page.waitForURL(/\/boards\/commenttest\/\d+/, { timeout: 5000 });

    const deleteButton = page.getByRole("button", { name: "게시물 삭제" });
    const isButtonEnabled = await deleteButton.isEnabled();

    expect(isButtonEnabled).toBeTruthy();

    page.on("dialog", async (dialog) => {
      await dialog.accept();
    });

    await deleteButton.click();

    await page.waitForURL("/boards/commenttest");
  });

  test("로그인 되지 않은 유저는 댓글 생성창이 보이지 않아야 함.", async ({
    page,
  }) => {
    await withTemporaryLogout(page, async (page) => {
      await page.goto("/boards/commenttest");
      await page.waitForURL("/boards/commenttest", { timeout: 5000 });
      await page.reload();

      const post = page.getByRole("link", { name: postName }).first();
      await post.click();

      await page.waitForURL(/\/boards\/commenttest\/\d+/, { timeout: 5000 });

      // div 요소 내부의 전체 텍스트가 포함되었는지 확인
      const loginPrompt = page.locator(
        "div.bg-gray-50.rounded-lg.p-4.text-center"
      );
      await expect(loginPrompt).toContainText(
        "댓글을 작성하려면 로그인해주세요."
      );

      // 또는 더 구체적으로 p 태그 내부의 텍스트 확인
      await expect(page.locator('p:text("댓글을 작성하려면")')).toBeVisible();

      // "로그인" 링크가 포함되어 있는지도 확인
      const loginLink = page.locator('a:text("로그인")');
      await expect(loginLink).toHaveAttribute("href", "/login");
    });
  });

  test.describe("댓글 생성 테스트", () => {
    test("댓글과 대댓글의 생성을 확인합니다.", async ({ page }) => {
      // 1. 댓글 폼이 보이는지 확인
      await expect(
        page.locator('textarea[placeholder="댓글을 작성해주세요..."]')
      ).toBeVisible();
      await expect(page.getByText("0/500")).toBeVisible();
      await expect(
        page.getByRole("button", { name: "댓글 등록 버튼" })
      ).toBeVisible();

      // 2. 상단 댓글 생성
      const commentContent = "테스트 댓글 내용";
      const commentTextarea = page.locator(
        'textarea[placeholder="댓글을 작성해주세요..."]'
      );
      await commentTextarea.fill(commentContent);

      // 입력한 내용이 정확히 표시되는지 확인
      const enteredText = await commentTextarea.inputValue();
      expect(enteredText).toBe(commentContent);

      // 댓글 등록 버튼 클릭
      const submitButton = page.getByRole("button", { name: "댓글 등록 버튼" });
      await submitButton.click();

      // 댓글 등록 완료 대기 (로딩 상태나 네트워크 요청을 기다림)
      await page.waitForTimeout(1000);

      // 3. 댓글 폼이 초기화되었는지 확인
      const textareaAfterSubmit = await commentTextarea.inputValue();
      expect(textareaAfterSubmit).toBe("");

      // 4. 새로 생성된 댓글 확인
      const parentComments = page.locator(
        "div.bg-white.rounded-lg.p-4.border.border-gray-200"
      );
      await expect(parentComments).toHaveCount(1);

      // 가장 상단(첫 번째) 댓글이 방금 작성한 댓글인지 확인
      const newComment = parentComments.nth(0);
      const newCommentContent = await newComment
        .locator('p[aria-label="parent-comment"]')
        .textContent();
      expect(newCommentContent?.trim()).toBe(commentContent);

      // 작성자 이름 확인
      const newCommentAuthor = await newComment
        .locator("span.font-medium.text-gray-800")
        .textContent();
      expect(newCommentAuthor?.trim()).toBe("tester");

      // 5. 답글 달기 버튼 클릭
      const replyButton = newComment.getByText("답글 달기");
      await replyButton.scrollIntoViewIfNeeded();
      await replyButton.click();

      // 6. 대댓글 폼이 나타났는지 확인
      const replyForm = newComment.locator(
        "div.mt-4.pt-4.border-t.border-gray-100 form"
      );
      await expect(replyForm).toBeVisible();

      // 7. 대댓글 폼에 내용 입력
      const replyContent = "테스트 대댓글 내용";
      const replyTextarea = replyForm.locator("textarea");
      await replyTextarea.fill(replyContent);

      // 입력한 내용이 정확히 표시되는지 확인
      const enteredReplyText = await replyTextarea.inputValue();
      expect(enteredReplyText).toBe(replyContent);

      // 대댓글 등록 버튼 클릭
      const replySubmitButton = replyForm.getByRole("button", {
        name: "댓글 등록 버튼",
      });
      await replySubmitButton.click();

      // 대댓글 등록 완료 대기
      await page.waitForTimeout(1000);

      // 8. 대댓글 폼이 사라졌는지 확인
      await expect(replyForm).not.toBeVisible();

      // 9. "답글 보기" 버튼이 나타났는지 확인
      const viewRepliesButton = newComment.getByText(/^답글 보기/);
      await expect(viewRepliesButton).toBeVisible();

      // 10. "답글 보기" 버튼 클릭
      await viewRepliesButton.scrollIntoViewIfNeeded();
      await viewRepliesButton.click();

      // 11. 대댓글이 정상적으로 표시되는지 확인
      const replyContainer = newComment.locator(
        "div.mt-5 > div.pt-3.pb-4.pl-4.pr-2"
      );
      await expect(replyContainer).toHaveCount(1);

      const replyContentElement = replyContainer
        .locator('p[aria-label="reply-comment"]')
        .first();
      const actualReplyContent = await replyContentElement.textContent();
      expect(actualReplyContent?.trim()).toBe(replyContent);

      // 대댓글 작성자 확인
      const replyAuthor = replyContainer
        .locator("span.font-medium.text-gray-800")
        .first();
      const actualReplyAuthor = await replyAuthor.textContent();
      expect(actualReplyAuthor?.trim()).toBe("tester");
    });

    test("대댓글 생성의 취소 버튼 작동을 확인합니다.", async ({ page }) => {
      // 1. 댓글 폼이 보이는지 확인
      await expect(
        page.locator('textarea[placeholder="댓글을 작성해주세요..."]')
      ).toBeVisible();
      await expect(page.getByText("0/500")).toBeVisible();
      await expect(
        page.getByRole("button", { name: "댓글 등록 버튼" })
      ).toBeVisible();

      // 2. 상단 댓글 생성
      const commentContent = "테스트 댓글 내용";
      const commentTextarea = page.locator(
        'textarea[placeholder="댓글을 작성해주세요..."]'
      );
      await commentTextarea.fill(commentContent);

      // 입력한 내용이 정확히 표시되는지 확인
      const enteredText = await commentTextarea.inputValue();
      expect(enteredText).toBe(commentContent);

      // 댓글 등록 버튼 클릭
      const submitButton = page.getByRole("button", { name: "댓글 등록 버튼" });
      await submitButton.click();

      // 댓글 등록 완료 대기 (로딩 상태나 네트워크 요청을 기다림)
      await page.waitForTimeout(1000);

      // 3. 댓글 폼이 초기화되었는지 확인
      const textareaAfterSubmit = await commentTextarea.inputValue();
      expect(textareaAfterSubmit).toBe("");

      // 4. 새로 생성된 댓글 확인
      const parentComments = page.locator(
        "div.bg-white.rounded-lg.p-4.border.border-gray-200"
      );
      await expect(parentComments).toHaveCount(1);

      // 가장 상단(첫 번째) 댓글이 방금 작성한 댓글인지 확인
      const newComment = parentComments.nth(0);
      const newCommentContent = await newComment
        .locator('p[aria-label="parent-comment"]')
        .textContent();
      expect(newCommentContent?.trim()).toBe(commentContent);

      // 작성자 이름 확인
      const newCommentAuthor = await newComment
        .locator("span.font-medium.text-gray-800")
        .textContent();
      expect(newCommentAuthor?.trim()).toBe("tester");

      // 5. 답글 달기 버튼 클릭
      const replyButton = newComment.getByText("답글 달기");
      await replyButton.scrollIntoViewIfNeeded();
      await replyButton.click();

      // 6. 대댓글 폼이 나타났는지 확인
      const replyForm = newComment.locator(
        "div.mt-4.pt-4.border-t.border-gray-100 form"
      );
      await expect(replyForm).toBeVisible();

      // 7. 대댓글 폼 취소 버튼 클릭
      const replyCreateCancelButton = newComment.locator(
        'button[aria-label="댓글 취소 버튼"]'
      );

      await replyCreateCancelButton.click();

      await page.waitForTimeout(500);

      // 8. 답글 보기 버튼이 나타나지 않는지 확인
      const viewRepliesButton = newComment.getByText(/^답글 보기/);
      await expect(viewRepliesButton).not.toBeVisible();
    });
  });
});
