import { test, expect, Page, BrowserContext } from "@playwright/test";
import { withTemporaryLogout } from "./util/helper";
import { loginAsAdminIsolated } from "./util/auth-utils";

test.describe("댓글 및 대댓글 조회 테스트", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/boards/commenttest");
    await page.waitForURL("/boards/commenttest", { timeout: 5000 });
    await page.reload();
  });

  test("페이징 된 댓글들과 대댓글들이 올바르게 불러졌는지 확인합니다.", async ({
    page,
  }) => {
    const post = page.getByRole("link", { name: "Comment Test Post" }).first();
    await post.click();
    await page.waitForURL(/\/boards\/commenttest\/\d+/, { timeout: 5000 });

    await expect(
      page.locator('textarea[placeholder="댓글을 작성해주세요..."]')
    ).toBeVisible();
    await expect(page.getByText("0/500")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "댓글 생성 등록 버튼" })
    ).toBeVisible();

    const parentComments = page.locator(
      "div.bg-white.rounded-lg.p-4.border.border-gray-200"
    );
    await expect(parentComments).toHaveCount(10);

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
        .locator('p[aria-label="parent-comment-content"]')
        .textContent();
      expect(commentText?.trim()).toBe(expectedParentComments[i]);
    }

    for (let i = 0; i < 10; i++) {
      const commentContainer = parentComments.nth(i);

      const replyButton = commentContainer.getByText(/^답글 보기/);

      const buttonText = await replyButton.textContent();
      if (buttonText && buttonText.includes("답글 보기")) {
        await replyButton.scrollIntoViewIfNeeded();
        await replyButton.click();
        await page.waitForTimeout(200);
      }

      const parentCommentText = await commentContainer
        .locator('p[aria-label="parent-comment-content"]')
        .textContent();
      const parentCommentNumber = parseInt(
        parentCommentText?.replace("부모 댓글 ", "") || "0"
      );

      const replyContainer = commentContainer.locator(
        "div.mt-5 > div.pt-3.pb-4.pl-4.pr-2"
      );
      const replyCount = await replyContainer.count();

      if (parentCommentNumber % 2 === 0) {
        await expect(replyContainer).toHaveCount(2);
      } else {
        await expect(replyContainer).toHaveCount(1);
      }

      for (let j = 0; j < replyCount; j++) {
        const reply = replyContainer.nth(j);

        const author = await reply
          .locator("span.font-medium.text-gray-800")
          .textContent();
        expect(author?.trim()).toBe("tester2");

        const replyContent = await reply
          .locator('p[aria-label="reply-comment-content"]')
          .textContent();
        const expectedReplyContent = `대댓글 ${parentCommentNumber}-${j + 1}`;
        expect(replyContent?.trim()).toBe(expectedReplyContent);
      }
    }

    const pagination = page.locator("div.flex.justify-center.mt-4.space-x-2");
    await expect(pagination).toBeVisible();

    const pageLinks = pagination.locator("a");
    await expect(pageLinks).toHaveCount(2);

    const currentPage = pageLinks.nth(0);
    await expect(currentPage).toHaveClass(/bg-blue-500/);
    await expect(currentPage).toHaveText("1");

    const nextPage = pageLinks.nth(1);
    await expect(nextPage).toHaveClass(/bg-gray-200/);
    await expect(nextPage).toHaveText("2");

    await nextPage.click();

    await page.waitForURL(/page=2/, { timeout: 5000 });

    const secondPageComments = page.locator(
      "div.bg-white.rounded-lg.p-4.border.border-gray-200"
    );

    await expect(secondPageComments).toHaveCount(5);

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
        .locator('p[aria-label="parent-comment-content"]')
        .textContent();
      expect(commentText?.trim()).toBe(expectedSecondPageComments[i]);
    }

    for (let i = 0; i < 5; i++) {
      const commentContainer = secondPageComments.nth(i);

      const replyButton = commentContainer.getByText(/^답글 보기/);

      const buttonText = await replyButton.textContent();
      if (buttonText && buttonText.includes("답글 보기")) {
        await replyButton.scrollIntoViewIfNeeded();
        await replyButton.click();
        await page.waitForTimeout(200);
      }

      const parentCommentText = await commentContainer
        .locator('p[aria-label="parent-comment-content"]')
        .textContent();
      const parentCommentNumber = parseInt(
        parentCommentText?.replace("부모 댓글 ", "") || "0"
      );

      const replyContainer = commentContainer.locator(
        "div.mt-5 > div.pt-3.pb-4.pl-4.pr-2"
      );
      const replyCount = await replyContainer.count();

      if (parentCommentNumber % 2 === 0) {
        await expect(replyContainer).toHaveCount(2);
      } else {
        await expect(replyContainer).toHaveCount(1);
      }

      for (let j = 0; j < replyCount; j++) {
        const reply = replyContainer.nth(j);

        const author = await reply
          .locator("span.font-medium.text-gray-800")
          .textContent();
        expect(author?.trim()).toBe("tester2");

        const replyContent = await reply
          .locator('p[aria-label="reply-comment-content"]')
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

      const loginPrompt = page.locator(
        "div.bg-gray-50.rounded-lg.p-4.text-center"
      );
      await expect(loginPrompt).toContainText(
        "댓글을 작성하려면 로그인해주세요."
      );

      await expect(page.locator('p:text("댓글을 작성하려면")')).toBeVisible();

      const loginLink = page.locator('a:text("로그인")');
      await expect(loginLink).toHaveAttribute("href", "/login");
    });
  });

  test.describe("댓글 생성 테스트", () => {
    test("댓글과 대댓글의 생성을 확인합니다.", async ({ page }) => {
      await expect(
        page.locator('textarea[placeholder="댓글을 작성해주세요..."]')
      ).toBeVisible();
      await expect(page.getByText("0/500")).toBeVisible();
      await expect(
        page.getByRole("button", { name: "댓글 생성 등록 버튼" })
      ).toBeVisible();

      const commentContent = "테스트 댓글 내용";
      const commentTextarea = page.locator(
        'textarea[placeholder="댓글을 작성해주세요..."]'
      );
      await commentTextarea.fill(commentContent);

      const enteredText = await commentTextarea.inputValue();
      expect(enteredText).toBe(commentContent);

      const submitButton = page.getByRole("button", {
        name: "댓글 생성 등록 버튼",
      });
      await submitButton.click();

      await page.waitForTimeout(1000);

      const textareaAfterSubmit = await commentTextarea.inputValue();
      expect(textareaAfterSubmit).toBe("");

      const parentComments = page.locator(
        "div.bg-white.rounded-lg.p-4.border.border-gray-200"
      );
      await expect(parentComments).toHaveCount(1);

      const newComment = parentComments.nth(0);
      const newCommentContent = await newComment
        .locator('p[aria-label="parent-comment-content"]')
        .textContent();
      expect(newCommentContent?.trim()).toBe(commentContent);

      const newCommentAuthor = await newComment
        .locator("span.font-medium.text-gray-800")
        .textContent();
      expect(newCommentAuthor?.trim()).toBe("tester");

      const replyButton = newComment.getByText("답글 달기");
      await replyButton.scrollIntoViewIfNeeded();
      await replyButton.click();

      const replyForm = newComment.locator(
        "div.mt-4.pt-4.border-t.border-gray-100 form"
      );
      await expect(replyForm).toBeVisible();

      const replyContent = "테스트 대댓글 내용";
      const replyTextarea = replyForm.locator("textarea");
      await replyTextarea.fill(replyContent);

      const enteredReplyText = await replyTextarea.inputValue();
      expect(enteredReplyText).toBe(replyContent);

      const replySubmitButton = replyForm.getByRole("button", {
        name: "댓글 생성 등록 버튼",
      });
      await replySubmitButton.click();

      await page.waitForTimeout(1000);

      await expect(replyForm).not.toBeVisible();

      const viewRepliesButton = newComment.getByText(/^답글 보기/);
      await expect(viewRepliesButton).toBeVisible();

      await viewRepliesButton.scrollIntoViewIfNeeded();
      await viewRepliesButton.click();

      const replyContainer = newComment.locator(
        "div.mt-5 > div.pt-3.pb-4.pl-4.pr-2"
      );
      await expect(replyContainer).toHaveCount(1);

      const replyContentElement = replyContainer
        .locator('p[aria-label="reply-comment-content"]')
        .first();
      const actualReplyContent = await replyContentElement.textContent();
      expect(actualReplyContent?.trim()).toBe(replyContent);

      const replyAuthor = replyContainer
        .locator("span.font-medium.text-gray-800")
        .first();
      const actualReplyAuthor = await replyAuthor.textContent();
      expect(actualReplyAuthor?.trim()).toBe("tester");
    });

    test("대댓글 생성의 취소 버튼 작동을 확인합니다.", async ({ page }) => {
      await expect(
        page.locator('textarea[placeholder="댓글을 작성해주세요..."]')
      ).toBeVisible();
      await expect(page.getByText("0/500")).toBeVisible();
      await expect(
        page.getByRole("button", { name: "댓글 생성 등록 버튼" })
      ).toBeVisible();

      const commentContent = "테스트 댓글 내용";
      const commentTextarea = page.locator(
        'textarea[placeholder="댓글을 작성해주세요..."]'
      );
      await commentTextarea.fill(commentContent);

      const enteredText = await commentTextarea.inputValue();
      expect(enteredText).toBe(commentContent);

      const submitButton = page.getByRole("button", {
        name: "댓글 생성 등록 버튼",
      });
      await submitButton.click();

      await page.waitForTimeout(1000);

      const textareaAfterSubmit = await commentTextarea.inputValue();
      expect(textareaAfterSubmit).toBe("");

      const parentComments = page.locator(
        "div.bg-white.rounded-lg.p-4.border.border-gray-200"
      );
      await expect(parentComments).toHaveCount(1);

      const newComment = parentComments.nth(0);
      const newCommentContent = await newComment
        .locator('p[aria-label="parent-comment-content"]')
        .textContent();
      expect(newCommentContent?.trim()).toBe(commentContent);

      const newCommentAuthor = await newComment
        .locator("span.font-medium.text-gray-800")
        .textContent();
      expect(newCommentAuthor?.trim()).toBe("tester");

      const replyButton = newComment.getByText("답글 달기");
      await replyButton.scrollIntoViewIfNeeded();
      await replyButton.click();

      const replyForm = newComment.locator(
        "div.mt-4.pt-4.border-t.border-gray-100 form"
      );
      await expect(replyForm).toBeVisible();

      const replyCreateCancelButton = newComment.locator(
        'button[aria-label="댓글 생성 취소 버튼"]'
      );

      await replyCreateCancelButton.click();

      await page.waitForTimeout(500);

      const viewRepliesButton = newComment.getByText(/^답글 보기/);
      await expect(viewRepliesButton).not.toBeVisible();
    });
  });

  test.describe("댓글 변경 테스트", () => {
    test.beforeEach(async ({ page }) => {
      await expect(
        page.locator('textarea[placeholder="댓글을 작성해주세요..."]')
      ).toBeVisible();
      await expect(page.getByText("0/500")).toBeVisible();
      await expect(
        page.getByRole("button", { name: "댓글 생성 등록 버튼" })
      ).toBeVisible();

      const commentContent = "테스트 댓글 내용";
      const commentTextarea = page.locator(
        'textarea[placeholder="댓글을 작성해주세요..."]'
      );
      await commentTextarea.fill(commentContent);

      const enteredText = await commentTextarea.inputValue();
      expect(enteredText).toBe(commentContent);

      const submitButton = page.getByRole("button", {
        name: "댓글 생성 등록 버튼",
      });
      await submitButton.click();

      await page.waitForTimeout(1000);

      const textareaAfterSubmit = await commentTextarea.inputValue();
      expect(textareaAfterSubmit).toBe("");

      const parentComments = page.locator(
        "div.bg-white.rounded-lg.p-4.border.border-gray-200"
      );
      await expect(parentComments).toHaveCount(1);

      const newComment = parentComments.nth(0);
      const newCommentContent = await newComment
        .locator('p[aria-label="parent-comment-content"]')
        .textContent();
      expect(newCommentContent?.trim()).toBe(commentContent);

      const newCommentAuthor = await newComment
        .locator("span.font-medium.text-gray-800")
        .textContent();
      expect(newCommentAuthor?.trim()).toBe("tester");

      const replyButton = newComment.getByText("답글 달기");
      await replyButton.scrollIntoViewIfNeeded();
      await replyButton.click();

      const replyForm = newComment.locator(
        "div.mt-4.pt-4.border-t.border-gray-100 form"
      );
      await expect(replyForm).toBeVisible();

      const replyContent = "테스트 대댓글 내용";
      const replyTextarea = replyForm.locator("textarea");
      await replyTextarea.fill(replyContent);

      const enteredReplyText = await replyTextarea.inputValue();
      expect(enteredReplyText).toBe(replyContent);

      const replySubmitButton = replyForm.getByRole("button", {
        name: "댓글 생성 등록 버튼",
      });
      await replySubmitButton.click();

      await page.waitForTimeout(1000);

      await expect(replyForm).not.toBeVisible();

      const viewRepliesButton = newComment.getByText(/^답글 보기/);
      await expect(viewRepliesButton).toBeVisible();

      await viewRepliesButton.scrollIntoViewIfNeeded();
      await viewRepliesButton.click();

      const replyContainer = newComment.locator(
        "div.mt-5 > div.pt-3.pb-4.pl-4.pr-2"
      );
      await expect(replyContainer).toHaveCount(1);

      const replyContentElement = replyContainer
        .locator('p[aria-label="reply-comment-content"]')
        .first();
      const actualReplyContent = await replyContentElement.textContent();
      expect(actualReplyContent?.trim()).toBe(replyContent);

      const replyAuthor = replyContainer
        .locator("span.font-medium.text-gray-800")
        .first();
      const actualReplyAuthor = await replyAuthor.textContent();
      expect(actualReplyAuthor?.trim()).toBe("tester");
    });

    test("댓글 / 대댓글 변경에 성공함", async ({ page }) => {
      const editButton = page
        .getByRole("button", { name: "parent-comment-edit-button" })
        .first();
      await editButton.scrollIntoViewIfNeeded();
      await editButton.click();

      const editForm = page.locator(
        'textarea[placeholder="댓글을 수정해주세요..."]'
      );
      await expect(editForm).toBeVisible({ timeout: 5000 });

      const newContent = "수정된 테스트 댓글 내용";
      await editForm.fill(newContent);

      const submitButton = page
        .getByRole("button", { name: "수정 완료" })
        .first();
      await submitButton.click();

      await page.waitForTimeout(1000);

      const updatedCommentContent = page
        .locator('p[aria-label="parent-comment-content"]')
        .first();
      await expect(updatedCommentContent).toHaveText(newContent, {
        timeout: 5000,
      });

      const replyButton = page
        .getByRole("button", { name: /답글 (보기|숨기기)/ })
        .first();
      const buttonText = await replyButton.textContent();

      if (buttonText && buttonText.includes("답글 보기")) {
        await replyButton.scrollIntoViewIfNeeded();
        await replyButton.click();
        await page.waitForTimeout(500);
      }

      const replyComment = page
        .locator('p[aria-label="reply-comment-content"]')
        .first();
      await expect(replyComment).toBeVisible({ timeout: 5000 });

      const replyEditButton = page
        .getByRole("button", { name: "reply-comment-edit-button" })
        .first();
      await replyEditButton.scrollIntoViewIfNeeded();
      await replyEditButton.click();

      const replyEditForm = page.locator(
        'textarea[placeholder="댓글을 수정해주세요..."]'
      );

      await expect(replyEditForm).toBeVisible({ timeout: 5000 });

      const newReplyContent = "수정된 테스트 대댓글 내용";
      await replyEditForm.fill(newReplyContent);

      const replySubmitButton = page.getByRole("button", { name: "수정 완료" });

      await replySubmitButton.click();

      await page.waitForTimeout(1000);

      await expect(replyComment).toHaveText(newReplyContent, { timeout: 5000 });
    });

    test("댓글 변경 시 취소 버튼 눌렀을 때 원복 되어야 함.", async ({
      page,
    }) => {
      const originalContent = await page
        .locator('p[aria-label="parent-comment-content"]')
        .first()
        .textContent();

      const editButton = page
        .getByRole("button", { name: "parent-comment-edit-button" })
        .first();
      await editButton.scrollIntoViewIfNeeded();
      await editButton.click();

      const editForm = page.locator(
        'textarea[placeholder="댓글을 수정해주세요..."]'
      );
      await expect(editForm).toBeVisible({ timeout: 5000 });

      const newContent = "수정 취소 테스트 댓글 내용";
      await editForm.fill(newContent);

      const cancelButton = page.getByRole("button", { name: "취소" }).first();
      await cancelButton.click();

      await expect(editForm).not.toBeVisible({ timeout: 5000 });

      const currentContent = await page
        .locator('p[aria-label="parent-comment-content"]')
        .first()
        .textContent();
      expect(currentContent?.trim()).toBe(originalContent?.trim());
    });

    test("대댓글 변경 시 취소 버튼 눌렀을 때 원복 되어야 함.", async ({
      page,
    }) => {
      const replyButton = page
        .getByRole("button", { name: /답글 (보기|숨기기)/ })
        .first();
      const buttonText = await replyButton.textContent();

      if (buttonText && buttonText.includes("답글 보기")) {
        await replyButton.scrollIntoViewIfNeeded();
        await replyButton.click();
        await page.waitForTimeout(500);
      }

      const replyComment = page
        .locator('p[aria-label="reply-comment-content"]')
        .first();
      await expect(replyComment).toBeVisible({ timeout: 5000 });

      const originalReplyContent = await replyComment.textContent();

      const replyEditButton = page
        .getByRole("button", { name: "reply-comment-edit-button" })
        .first();
      await replyEditButton.scrollIntoViewIfNeeded();
      await replyEditButton.click();

      const replyEditForm = page.locator(
        'textarea[placeholder="댓글을 수정해주세요..."]'
      );

      await expect(replyEditForm).toBeVisible({ timeout: 5000 });

      const newReplyContent = "수정 취소 테스트 대댓글 내용";
      await replyEditForm.fill(newReplyContent);

      const replyCancelButton = page.getByRole("button", { name: "취소" });

      await replyCancelButton.click();

      await expect(replyEditForm).not.toBeVisible({ timeout: 5000 });

      const currentReplyContent = await replyComment.textContent();
      expect(currentReplyContent?.trim()).toBe(originalReplyContent?.trim());
    });
  });

  test.describe("댓글 삭제 테스트", () => {
    test.beforeEach(async ({ page }) => {
      await expect(
        page.locator('textarea[placeholder="댓글을 작성해주세요..."]')
      ).toBeVisible();
      await expect(page.getByText("0/500")).toBeVisible();
      await expect(
        page.getByRole("button", { name: "댓글 생성 등록 버튼" })
      ).toBeVisible();

      const commentContent = "테스트 댓글 내용";
      const commentTextarea = page.locator(
        'textarea[placeholder="댓글을 작성해주세요..."]'
      );
      await commentTextarea.fill(commentContent);

      const enteredText = await commentTextarea.inputValue();
      expect(enteredText).toBe(commentContent);

      const submitButton = page.getByRole("button", {
        name: "댓글 생성 등록 버튼",
      });
      await submitButton.click();

      await page.waitForTimeout(1000);

      const textareaAfterSubmit = await commentTextarea.inputValue();
      expect(textareaAfterSubmit).toBe("");

      const parentComments = page.locator(
        "div.bg-white.rounded-lg.p-4.border.border-gray-200"
      );
      await expect(parentComments).toHaveCount(1);

      const newComment = parentComments.nth(0);
      const newCommentContent = await newComment
        .locator('p[aria-label="parent-comment-content"]')
        .textContent();
      expect(newCommentContent?.trim()).toBe(commentContent);

      const newCommentAuthor = await newComment
        .locator("span.font-medium.text-gray-800")
        .textContent();
      expect(newCommentAuthor?.trim()).toBe("tester");

      const replyButton = newComment.getByText("답글 달기");
      await replyButton.scrollIntoViewIfNeeded();
      await replyButton.click();

      const replyForm = newComment.locator(
        "div.mt-4.pt-4.border-t.border-gray-100 form"
      );
      await expect(replyForm).toBeVisible();

      const replyContent = "테스트 대댓글 내용";
      const replyTextarea = replyForm.locator("textarea");
      await replyTextarea.fill(replyContent);

      const enteredReplyText = await replyTextarea.inputValue();
      expect(enteredReplyText).toBe(replyContent);

      const replySubmitButton = replyForm.getByRole("button", {
        name: "댓글 생성 등록 버튼",
      });
      await replySubmitButton.click();

      await page.waitForTimeout(1000);

      await expect(replyForm).not.toBeVisible();

      const viewRepliesButton = newComment.getByText(/^답글 보기/);
      await expect(viewRepliesButton).toBeVisible();

      await viewRepliesButton.scrollIntoViewIfNeeded();
      await viewRepliesButton.click();

      const replyContainer = newComment.locator(
        "div.mt-5 > div.pt-3.pb-4.pl-4.pr-2"
      );
      await expect(replyContainer).toHaveCount(1);

      const replyContentElement = replyContainer
        .locator('p[aria-label="reply-comment-content"]')
        .first();
      const actualReplyContent = await replyContentElement.textContent();
      expect(actualReplyContent?.trim()).toBe(replyContent);

      const replyAuthor = replyContainer
        .locator("span.font-medium.text-gray-800")
        .first();
      const actualReplyAuthor = await replyAuthor.textContent();
      expect(actualReplyAuthor?.trim()).toBe("tester");
    });

    test("대댓글 / 댓글 순으로 삭제 성공함.", async ({ page }) => {
      const replyButton = page
        .getByRole("button", { name: /답글 (보기|숨기기)/ })
        .first();
      const buttonText = await replyButton.textContent();

      if (buttonText && buttonText.includes("답글 보기")) {
        await replyButton.scrollIntoViewIfNeeded();
        await replyButton.click();
        await page.waitForTimeout(500);
      }

      const replyComment = page
        .locator('p[aria-label="reply-comment-content"]')
        .first();
      await expect(replyComment).toBeVisible({ timeout: 5000 });

      const replyDeleteButton = page
        .getByRole("button", { name: "reply-comment-delete-button" })
        .first();
      await replyDeleteButton.scrollIntoViewIfNeeded();

      await replyDeleteButton.click();
      await page.waitForTimeout(1000);

      await expect(replyComment).not.toBeVisible({ timeout: 5000 });

      const updatedReplyButton = page
        .getByRole("button", { name: /답글 (보기|숨기기)/ })
        .first();
      await expect(updatedReplyButton).not.toBeVisible();

      const parentDeleteButton = page
        .getByRole("button", { name: "parent-comment-delete-button" })
        .first();
      await parentDeleteButton.scrollIntoViewIfNeeded();

      page.once("dialog", async (dialog) => {
        await dialog.accept();
      });

      await parentDeleteButton.click();
      await page.waitForTimeout(1000);

      const parentComment = page
        .locator('p[aria-label="parent-comment-content"]')
        .first();
      await expect(parentComment).not.toBeVisible({ timeout: 5000 });

      const noCommentsMessage = page.locator(
        "div.text-center.py-8.text-gray-500"
      );
      await expect(noCommentsMessage).toHaveText(
        "아직 작성된 댓글이 없습니다."
      );
    });

    test("대댓글이 있는 댓글에 댓글만 삭제 할 경우 댓글은 삭제된 댓글로서 남고 대댓글은 보존됨.", async ({
      page,
    }) => {
      const parentCommentContainer = page
        .locator('[aria-label="parent-comment-container"]')
        .first();

      const replyButton = parentCommentContainer.getByRole("button", {
        name: /답글 (보기|숨기기)/,
      });
      const buttonText = await replyButton.textContent();

      if (buttonText && buttonText.includes("답글 보기")) {
        await replyButton.scrollIntoViewIfNeeded();
        await replyButton.click();
        await page.waitForTimeout(500);
      }

      const replyContainer = parentCommentContainer
        .locator('[aria-label="reply-comment-container"]')
        .first();
      const originalReplyContent = await replyContainer
        .locator('[aria-label="reply-comment-content"]')
        .textContent();
      const originalReplyAuthor = await replyContainer
        .locator('[aria-label="reply-comment-author"]')
        .textContent();

      const parentDeleteButton = parentCommentContainer.locator(
        '[aria-label="parent-comment-delete-button"]'
      );
      await parentDeleteButton.scrollIntoViewIfNeeded();

      page.once("dialog", async (dialog) => {
        await dialog.accept();
      });

      await parentDeleteButton.click();
      await page.waitForTimeout(1000);

      const parentComment = parentCommentContainer.locator(
        '[aria-label="parent-comment-content"]'
      );
      await expect(parentComment).toHaveText("[삭제된 댓글]");

      const authorName = parentCommentContainer.locator(
        '[aria-label="parent-comment-author"]'
      );
      await expect(authorName).toHaveText("알 수 없음");

      const editButton = parentCommentContainer.locator(
        '[aria-label="parent-comment-edit-button"]'
      );
      const deleteButton = parentCommentContainer.locator(
        '[aria-label="parent-comment-delete-button"]'
      );
      await expect(editButton).not.toBeVisible();
      await expect(deleteButton).not.toBeVisible();

      const updatedReplyButton = parentCommentContainer.getByRole("button", {
        name: /답글 (보기|숨기기)/,
      });
      await expect(updatedReplyButton).toBeVisible();

      if ((await updatedReplyButton.textContent()) === "답글 보기") {
        await updatedReplyButton.scrollIntoViewIfNeeded();
        await updatedReplyButton.click();
        await page.waitForTimeout(500);
      }

      const preservedReplyContainer = parentCommentContainer
        .locator('[aria-label="reply-comment-container"]')
        .first();

      const preservedReplyComment = preservedReplyContainer.locator(
        '[aria-label="reply-comment-content"]'
      );
      await expect(preservedReplyComment).toBeVisible({ timeout: 5000 });
      const preservedReplyContent = await preservedReplyComment.textContent();
      expect(preservedReplyContent?.trim()).toBe(originalReplyContent?.trim());

      const preservedReplyAuthor = await preservedReplyContainer
        .locator('[aria-label="reply-comment-author"]')
        .textContent();
      expect(preservedReplyAuthor?.trim()).toBe(originalReplyAuthor?.trim());

      const noCommentsMessage = page.locator(
        "div.text-center.py-8.text-gray-500"
      );
      await expect(noCommentsMessage).not.toBeVisible();
    });

    test("admin은 모든 사람의 댓글을 삭제 가능합니다.", async ({ browser }) => {
      let context: BrowserContext | undefined;
      let page: Page | undefined;

      try {
        const result = await loginAsAdminIsolated(browser);
        context = result.context;
        page = result.page;

        expect(context).toBeDefined();
        expect(page).toBeDefined();

        await page.goto("/boards/commenttest");
        const post = page.getByRole("link", { name: postName }).first();
        await post.click();

        await page.waitForURL(/\/boards\/commenttest\/\d+/, { timeout: 5000 });

        const replyButton = page
          .getByRole("button", { name: /답글 (보기|숨기기)/ })
          .first();
        const buttonText = await replyButton.textContent();

        if (buttonText && buttonText.includes("답글 보기")) {
          await replyButton.scrollIntoViewIfNeeded();
          await replyButton.click();
          await page.waitForTimeout(500);
        }

        const replyComment = page
          .locator('p[aria-label="reply-comment-content"]')
          .first();
        await expect(replyComment).toBeVisible({ timeout: 5000 });

        const replyDeleteButton = page
          .getByRole("button", { name: "reply-comment-delete-button" })
          .first();
        await replyDeleteButton.scrollIntoViewIfNeeded();

        await replyDeleteButton.click();
        await page.waitForTimeout(1000);

        await expect(replyComment).not.toBeVisible({ timeout: 5000 });

        const updatedReplyButton = page
          .getByRole("button", { name: /답글 (보기|숨기기)/ })
          .first();
        await expect(updatedReplyButton).not.toBeVisible();

        const parentDeleteButton = page
          .getByRole("button", { name: "parent-comment-delete-button" })
          .first();
        await parentDeleteButton.scrollIntoViewIfNeeded();

        page.once("dialog", async (dialog) => {
          await dialog.accept();
        });

        await parentDeleteButton.click();
        await page.waitForTimeout(1000);

        const parentComment = page
          .locator('p[aria-label="parent-comment-content"]')
          .first();
        await expect(parentComment).not.toBeVisible({ timeout: 5000 });

        const noCommentsMessage = page.locator(
          "div.text-center.py-8.text-gray-500"
        );
        await expect(noCommentsMessage).toHaveText(
          "아직 작성된 댓글이 없습니다."
        );
      } catch (error) {
        test.fail();
      } finally {
        if (context) {
          await context.close();
        }
      }
    });
  });

  test.describe("댓글 좋아요 테스트", () => {
    test.beforeEach(async ({ page }) => {
      await expect(
        page.locator('textarea[placeholder="댓글을 작성해주세요..."]')
      ).toBeVisible();
      await expect(page.getByText("0/500")).toBeVisible();
      await expect(
        page.getByRole("button", { name: "댓글 생성 등록 버튼" })
      ).toBeVisible();

      const commentContent = "테스트 댓글 내용";
      const commentTextarea = page.locator(
        'textarea[placeholder="댓글을 작성해주세요..."]'
      );
      await commentTextarea.fill(commentContent);

      const enteredText = await commentTextarea.inputValue();
      expect(enteredText).toBe(commentContent);

      const submitButton = page.getByRole("button", {
        name: "댓글 생성 등록 버튼",
      });
      await submitButton.click();

      await page.waitForTimeout(1000);

      const textareaAfterSubmit = await commentTextarea.inputValue();
      expect(textareaAfterSubmit).toBe("");

      const parentComments = page.locator(
        "div.bg-white.rounded-lg.p-4.border.border-gray-200"
      );
      await expect(parentComments).toHaveCount(1);

      const newComment = parentComments.nth(0);
      const newCommentContent = await newComment
        .locator('p[aria-label="parent-comment-content"]')
        .textContent();
      expect(newCommentContent?.trim()).toBe(commentContent);

      const newCommentAuthor = await newComment
        .locator("span.font-medium.text-gray-800")
        .textContent();
      expect(newCommentAuthor?.trim()).toBe("tester");

      const replyButton = newComment.getByText("답글 달기");
      await replyButton.scrollIntoViewIfNeeded();
      await replyButton.click();

      const replyForm = newComment.locator(
        "div.mt-4.pt-4.border-t.border-gray-100 form"
      );
      await expect(replyForm).toBeVisible();

      const replyContent = "테스트 대댓글 내용";
      const replyTextarea = replyForm.locator("textarea");
      await replyTextarea.fill(replyContent);

      const enteredReplyText = await replyTextarea.inputValue();
      expect(enteredReplyText).toBe(replyContent);

      const replySubmitButton = replyForm.getByRole("button", {
        name: "댓글 생성 등록 버튼",
      });
      await replySubmitButton.click();

      await page.waitForTimeout(1000);

      await expect(replyForm).not.toBeVisible();

      const viewRepliesButton = newComment.getByText(/^답글 보기/);
      await expect(viewRepliesButton).toBeVisible();

      await viewRepliesButton.scrollIntoViewIfNeeded();
      await viewRepliesButton.click();

      const replyContainer = newComment.locator(
        "div.mt-5 > div.pt-3.pb-4.pl-4.pr-2"
      );
      await expect(replyContainer).toHaveCount(1);

      const replyContentElement = replyContainer
        .locator('p[aria-label="reply-comment-content"]')
        .first();
      const actualReplyContent = await replyContentElement.textContent();
      expect(actualReplyContent?.trim()).toBe(replyContent);

      const replyAuthor = replyContainer
        .locator("span.font-medium.text-gray-800")
        .first();
      const actualReplyAuthor = await replyAuthor.textContent();
      expect(actualReplyAuthor?.trim()).toBe("tester");
    });

    test("댓글 좋아요 성공, 한 번 이상 누를 경우 무시", async ({ page }) => {
      const parentCommentContainer = page
        .locator('[aria-label="parent-comment-container"]')
        .first();

      const replyButton = parentCommentContainer.getByRole("button", {
        name: /답글 (보기|숨기기)/,
      });
      const buttonText = await replyButton.textContent();

      if (buttonText && buttonText.includes("답글 보기")) {
        await replyButton.scrollIntoViewIfNeeded();
        await replyButton.click();
        await page.waitForTimeout(500);
      }

      const parentLikeButton = parentCommentContainer.locator(
        '[aria-label="parent-comment-like-button"]'
      );
      const parentLikeCountSpan = parentLikeButton.locator("span");

      const initialParentLikeCount = parseInt(
        (await parentLikeCountSpan.textContent()) || "0"
      );
      expect(initialParentLikeCount).toBe(0);

      await parentLikeButton.click();
      await page.waitForTimeout(500);

      const updatedParentLikeCount = parseInt(
        (await parentLikeCountSpan.textContent()) || "0"
      );
      expect(updatedParentLikeCount).toBe(1);

      const replyContainer = parentCommentContainer
        .locator('[aria-label="reply-comment-container"]')
        .first();
      const replyLikeButton = replyContainer.locator(
        '[aria-label="reply-comment-like-button"]'
      );
      const replyLikeCountSpan = replyLikeButton.locator("span");

      const initialReplyLikeCount = parseInt(
        (await replyLikeCountSpan.textContent()) || "0"
      );
      expect(initialReplyLikeCount).toBe(0);

      await replyLikeButton.click();
      await page.waitForTimeout(500);

      const updatedReplyLikeCount = parseInt(
        (await replyLikeCountSpan.textContent()) || "0"
      );
      expect(updatedReplyLikeCount).toBe(1);

      await parentLikeButton.click();
      await page.waitForTimeout(500);

      await replyLikeButton.click();
      await page.waitForTimeout(500);

      const finalParentLikeCount = parseInt(
        (await parentLikeCountSpan.textContent()) || "0"
      );
      const finalReplyLikeCount = parseInt(
        (await replyLikeCountSpan.textContent()) || "0"
      );

      expect(finalParentLikeCount).toBe(1);
      expect(finalReplyLikeCount).toBe(1);

      await expect(parentLikeButton).toHaveClass(/text-blue-500/);
      await expect(replyLikeButton).toHaveClass(/text-blue-500/);
    });

    test("삭제된 상태의 댓글은 좋아요 버튼이 눌리지 않습니다.", async ({
      page,
    }) => {
      const parentCommentContainer = page
        .locator('[aria-label="parent-comment-container"]')
        .first();

      const replyButton = parentCommentContainer.getByRole("button", {
        name: /답글 (보기|숨기기)/,
      });
      const buttonText = await replyButton.textContent();

      if (buttonText && buttonText.includes("답글 보기")) {
        await replyButton.scrollIntoViewIfNeeded();
        await replyButton.click();
        await page.waitForTimeout(500);
      }

      const parentDeleteButton = parentCommentContainer.locator(
        '[aria-label="parent-comment-delete-button"]'
      );
      await parentDeleteButton.scrollIntoViewIfNeeded();

      page.once("dialog", async (dialog) => {
        await dialog.accept();
      });

      await parentDeleteButton.click();
      await page.waitForTimeout(1000);

      const parentCommentContent = parentCommentContainer.locator(
        '[aria-label="parent-comment-content"]'
      );
      await expect(parentCommentContent).toHaveText("[삭제된 댓글]");

      const authorName = parentCommentContainer.locator(
        '[aria-label="parent-comment-author"]'
      );
      await expect(authorName).toHaveText("알 수 없음");

      const editButton = parentCommentContainer.locator(
        '[aria-label="parent-comment-edit-button"]'
      );
      const deleteButton = parentCommentContainer.locator(
        '[aria-label="parent-comment-delete-button"]'
      );
      await expect(editButton).not.toBeVisible();
      await expect(deleteButton).not.toBeVisible();

      const likeButton = parentCommentContainer.locator(
        '[aria-label="parent-comment-like-button"]'
      );
      await expect(likeButton).toBeVisible();

      const likeCountSpan = likeButton.locator("span");
      const initialLikeCount = parseInt(
        (await likeCountSpan.textContent()) || "0"
      );
      expect(initialLikeCount).toBe(0);

      await likeButton.click();
      await page.waitForTimeout(500);

      const updatedLikeCount = parseInt(
        (await likeCountSpan.textContent()) || "0"
      );
      expect(updatedLikeCount).toBe(0);

      await expect(likeButton).toHaveClass(/text-gray-500/);

      for (let i = 0; i < 3; i++) {
        await likeButton.click();
        await page.waitForTimeout(300);
      }

      const finalLikeCount = parseInt(
        (await likeCountSpan.textContent()) || "0"
      );
      expect(finalLikeCount).toBe(0);
    });
  });
});
