import { http, HttpResponse } from "msw";
import { server } from "../../mocks/server";
import {
  CreateMessageFormState,
  MessageDetailDto,
  PaginatedMessageListDto,
} from "../definition/messageSchema";
import { BASE_API_URL } from "../util";
import {
  FetchMessages,
  FetchMessage,
  SendMessage,
  DeleteMessage,
} from "./messageActions";
import {
  MessageErrors,
  MessageResponses,
} from "../constants/message/constants";
import { ERROR_MESSAGES } from "../constants/errorMessage";
import { clearAuth } from "../authState";
import { forbidden, redirect } from "next/navigation";

jest.mock("next/headers", () => ({
  cookies: jest.fn(() =>
    Promise.resolve({
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    })
  ),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn().mockImplementation((url) => {
    const error = new Error(`Redirect to ${url}`);
    Object.defineProperty(error, "digest", {
      value: `NEXT_REDIRECT: ${url}`,
      configurable: false,
      writable: false,
    });
    throw error;
  }),
  forbidden: jest.fn().mockImplementation(() => {
    const error = new Error("Forbidden access");
    Object.defineProperty(error, "digest", {
      value: "NEXT_FORBIDDEN",
      configurable: false,
      writable: false,
    });
    throw error;
  }),
}));

jest.mock("../authState", () => ({
  clearAuth: jest.fn(),
}));

describe("Message API Test", () => {
  const consoleErrorMock = jest
    .spyOn(console, "error")
    .mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();
    server.resetHandlers();
  });

  afterEach(() => {
    consoleErrorMock.mockClear();
  });

  describe("FetchMessages", () => {
    it("메시지 목록을 성공적으로 가져옵니다.", async () => {
      const page = 1;

      server.use(
        http.get(`${BASE_API_URL}/messages`, () => {
          const mockResponse = {
            data: [
              {
                id: 100,
                senderNickname: "테스트_관리자",
                preview: "[공지] 테스트 공지 메시지입니다.",
                isRead: false,
                createdAt: "2025-04-05T10:00:00Z",
              },
              {
                id: 101,
                senderNickname: "테스트_유저",
                preview: "테스트 개인 메시지입니다.",
                isRead: true,
                createdAt: "2025-04-04T15:30:00Z",
              },
            ],
            currentPage: 1,
            totalItems: 2,
            totalPages: 1,
          };

          return HttpResponse.json(mockResponse, { status: 200 });
        })
      );

      const result = await FetchMessages(page);

      expect((result as PaginatedMessageListDto).data).toBeDefined();
      expect((result as PaginatedMessageListDto).data.length).toBeGreaterThan(
        0
      );
      expect((result as PaginatedMessageListDto).currentPage).toBe(1);
    });

    it("유효하지 않은 데이터를 받았을 경우 기본값을 반환합니다.", async () => {
      const page = 1;
      server.use(
        http.get(`${BASE_API_URL}/messages`, () =>
          HttpResponse.json(
            {
              data: "invalid_data",
              currentPage: "invalid",
              totalItems: "invalid",
              totalPages: "invalid",
            },
            { status: 200 }
          )
        )
      );

      const result = await FetchMessages(page);
      expect(consoleErrorMock).toHaveBeenCalledWith(
        "Validation Failed: ",
        expect.any(Object)
      );
      expect(result).toEqual({
        data: [],
        currentPage: 1,
        totalItems: 0,
        totalPages: 0,
      });
    });

    it("인증되지 않은 사용자는 접근할 수 없습니다. (401)", async () => {
      const page = 1;
      server.use(
        http.get(`${BASE_API_URL}/messages`, () =>
          HttpResponse.json(
            { message: ERROR_MESSAGES.UNAUTHORIZED },
            { status: 401 }
          )
        )
      );

      await expect(FetchMessages(page)).rejects.toThrow(
        "Redirect to /login?error=session_expired"
      );

      expect(clearAuth).toHaveBeenCalled();
      expect(redirect).toHaveBeenCalledWith("/login?error=session_expired");
    });

    it("서버 내부 오류 시 기본값을 반환합니다.", async () => {
      const page = 1;
      server.use(
        http.get(`${BASE_API_URL}/messages`, () =>
          HttpResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
          )
        )
      );

      const result = await FetchMessages(page);
      expect(consoleErrorMock).toHaveBeenCalledWith(
        "Unexpected error during message loading:",
        expect.any(Object)
      );
      expect(result).toEqual({
        data: [],
        currentPage: 1,
        totalItems: 0,
        totalPages: 0,
      });
    });
  });

  describe("FetchMessage", () => {
    it("특정 메시지를 성공적으로 가져옵니다.", async () => {
      const messageId = 1;
      const result = await FetchMessage(messageId);

      expect((result as MessageDetailDto).id).toBe(messageId);
      expect((result as MessageDetailDto).content).toBeDefined();
    });

    it("존재하지 않는 메시지를 조회할 경우 에러 메시지를 반환합니다.", async () => {
      const invalidMessageId = 9999;
      server.use(
        http.get(`${BASE_API_URL}/messages/${invalidMessageId}`, () =>
          HttpResponse.json(
            { message: MessageErrors.MESSAGE_NOT_FOUND },
            { status: 404 }
          )
        )
      );

      const result = await FetchMessage(invalidMessageId);
      expect(result).toEqual({ message: MessageErrors.MESSAGE_NOT_FOUND });
    });

    it("인증되지 않은 사용자는 접근할 수 없습니다. (401)", async () => {
      const messageId = 1;
      server.use(
        http.get(`${BASE_API_URL}/messages/${messageId}`, () =>
          HttpResponse.json(
            { message: ERROR_MESSAGES.UNAUTHORIZED },
            { status: 401 }
          )
        )
      );

      await expect(FetchMessage(messageId)).rejects.toThrow(
        "Redirect to /login?error=session_expired"
      );

      expect(clearAuth).toHaveBeenCalled();
      expect(redirect).toHaveBeenCalledWith("/login?error=session_expired");
    });

    it("예상치 못한 에러 발생 시 일반적인 에러 메시지를 반환합니다.", async () => {
      const messageId = 1;
      server.use(
        http.get(`${BASE_API_URL}/messages/${messageId}`, () =>
          HttpResponse.json({ message: "Bad Request" }, { status: 400 })
        )
      );

      const result = await FetchMessage(messageId);
      expect(consoleErrorMock).toHaveBeenCalledWith(
        "Unexpected error during message fetching:",
        expect.any(Object)
      );
      expect(result).toEqual({
        message: "Something wrong when fetching message",
      });
    });

    it("유효하지 않은 데이터를 받았을 경우 에러 메시지를 반환합니다.", async () => {
      const messageId = 1;
      server.use(
        http.get(`${BASE_API_URL}/messages/${messageId}`, () =>
          HttpResponse.json(
            {
              id: "invalid",
              content: 123,
              isRead: "not-boolean",
              createdAt: "invalid-date",
              isNotice: "not-boolean",
            },
            { status: 200 }
          )
        )
      );

      const result = await FetchMessage(messageId);
      expect(consoleErrorMock).toHaveBeenCalledWith(
        "Validation Failed: ",
        expect.any(Object)
      );
      expect(result).toEqual({ message: "Failed to fetch valid message" });
    });
  });

  describe("SendMessage", () => {
    it("개인 메시지 전송에 성공합니다.", async () => {
      const prevState: CreateMessageFormState = {};
      const formData = new FormData();
      formData.append("content", "안녕하세요. 개인 메시지입니다.");
      formData.append("receiverNickname", "receiver");

      const result = await SendMessage(prevState, formData);
      expect(result).toEqual({ message: MessageResponses.SENT });
    });

    it("공지 메시지 전송에 성공합니다.", async () => {
      const prevState: CreateMessageFormState = {};
      const formData = new FormData();
      formData.append("content", "[공지] 점검 안내입니다.");
      formData.append("isNotice", "true");
      formData.append("receiverNickname", "");

      const result = await SendMessage(prevState, formData);
      expect(result).toEqual({ message: MessageResponses.SENT });
    });

    it("빈 내용으로 메시지를 전송할 때 폼 에러를 반환합니다.", async () => {
      const prevState: CreateMessageFormState = {};
      const formData = new FormData();
      formData.append("content", "");

      const result = await SendMessage(prevState, formData);
      expect(result.errors).toBeDefined();
      expect(result.errors?.content).toContain("메시지 내용은 필수입니다.");
    });

    it("존재하지 않는 수신자에게 메시지를 보낼 경우 에러를 반환합니다.", async () => {
      const prevState: CreateMessageFormState = {};
      const formData = new FormData();
      formData.append("content", "테스트 메시지");
      formData.append("receiverNickname", "nonexist");

      server.use(
        http.post(`${BASE_API_URL}/messages`, () =>
          HttpResponse.json(
            { message: MessageErrors.RECEIVER_NOT_FOUND },
            { status: 404 }
          )
        )
      );

      const result = await SendMessage(prevState, formData);
      expect(result).toEqual({ message: MessageErrors.RECEIVER_NOT_FOUND });
    });

    it("일반 사용자가 공지 메시지를 전송하려 할 경우 권한 에러를 반환합니다.", async () => {
      const prevState: CreateMessageFormState = {};
      const formData = new FormData();
      formData.append("content", "[공지] 점검 안내입니다.");
      formData.append("isNotice", "true");
      formData.append("receiverNickname", "");

      server.use(
        http.post(`${BASE_API_URL}/messages`, () =>
          HttpResponse.json(
            { message: MessageErrors.FORBIDDEN_NOTICE },
            { status: 403 }
          )
        )
      );

      await expect(SendMessage(prevState, formData)).rejects.toThrow();

      expect(forbidden).toHaveBeenCalled();
    });

    it("인증되지 않은 사용자는 메시지를 보낼 수 없습니다. (401)", async () => {
      const prevState: CreateMessageFormState = {};
      const formData = new FormData();
      formData.append("content", "테스트 메시지");
      formData.append("receiverNickname", "receiver");

      server.use(
        http.post(`${BASE_API_URL}/messages`, () =>
          HttpResponse.json(
            { message: ERROR_MESSAGES.UNAUTHORIZED },
            { status: 401 }
          )
        )
      );

      await expect(SendMessage(prevState, formData)).rejects.toThrow(
        "Redirect to /login?error=session_expired"
      );

      expect(clearAuth).toHaveBeenCalled();
      expect(redirect).toHaveBeenCalledWith("/login?error=session_expired");
    });

    it("예상치 못한 서버 에러 발생 시 일반적인 에러 메시지를 반환합니다.", async () => {
      const prevState: CreateMessageFormState = {};
      const formData = new FormData();
      formData.append("content", "테스트 메시지");
      formData.append("receiverNickname", "receiver");

      server.use(
        http.post(`${BASE_API_URL}/messages`, () =>
          HttpResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
          )
        )
      );

      const result = await SendMessage(prevState, formData);
      expect(consoleErrorMock).toHaveBeenCalledWith(
        "Unexpected error during message sending:",
        expect.any(Object)
      );
      expect(result).toEqual({
        message: "An unexpected error occurred. Please try again.",
      });
    });
  });

  describe("DeleteMessage", () => {
    it("메시지 삭제에 성공합니다.", async () => {
      const messageId = 1;

      const result = await DeleteMessage(messageId);
      expect(result).toEqual({ message: MessageResponses.DELETED });
    });

    it("존재하지 않는 메시지를 삭제하려 할 경우 에러를 반환합니다.", async () => {
      const invalidMessageId = 9999;

      server.use(
        http.delete(`${BASE_API_URL}/messages/${invalidMessageId}`, () =>
          HttpResponse.json(
            { message: MessageErrors.MESSAGE_NOT_FOUND },
            { status: 404 }
          )
        )
      );

      const result = await DeleteMessage(invalidMessageId);
      expect(result).toEqual({ message: MessageErrors.MESSAGE_NOT_FOUND });
    });

    it("인증되지 않은 사용자는 메시지를 삭제할 수 없습니다. (401)", async () => {
      const messageId = 1;

      server.use(
        http.delete(`${BASE_API_URL}/messages/${messageId}`, () =>
          HttpResponse.json(
            { message: ERROR_MESSAGES.UNAUTHORIZED },
            { status: 401 }
          )
        )
      );

      await expect(DeleteMessage(messageId)).rejects.toThrow(
        "Redirect to /login?error=session_expired"
      );

      expect(clearAuth).toHaveBeenCalled();
      expect(redirect).toHaveBeenCalledWith("/login?error=session_expired");
    });

    it("예상치 못한 서버 에러 발생 시 일반적인 에러 메시지를 반환합니다.", async () => {
      const messageId = 1;

      server.use(
        http.delete(`${BASE_API_URL}/messages/${messageId}`, () =>
          HttpResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
          )
        )
      );

      const result = await DeleteMessage(messageId);
      expect(consoleErrorMock).toHaveBeenCalledWith(
        "Unexpected error during message deletion:",
        expect.any(Object)
      );
      expect(result).toEqual({
        message: "An unexpected error occurred. Please try again.",
      });
    });
  });
});
