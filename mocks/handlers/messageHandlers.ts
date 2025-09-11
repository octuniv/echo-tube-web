// mocks/handlers/messageHandlers.ts
import { http, HttpResponse } from "msw";
import { BASE_API_URL } from "../../lib/util";
import {
  CreateMessageSchema,
  MessageDetailSchema,
  CreateNoticeResponseSchema,
  MessageApiResponseSchema,
  PaginatedMessageListSchema,
} from "../../lib/definition/messageSchema";

// Mock 메시지 데이터
let mockMessages = [
  {
    id: 1,
    senderId: 999,
    senderNickname: "관리자",
    receiverId: 1, // 현재 사용자 ID (1로 가정)
    content:
      "[공지] 시스템 점검 안내 드립니다. 04/05 새벽 2시~4시까지 서비스가 중단됩니다.",
    isRead: false,
    createdAt: "2025-04-05T10:00:00Z",
    isNotice: true,
  },
  {
    id: 2,
    senderId: 2,
    senderNickname: "john_doe",
    receiverId: 1,
    content: "안녕하세요! 내일 회의 시간 확인 부탁드립니다.",
    isRead: true,
    createdAt: "2025-04-04T15:30:00Z",
    isNotice: false,
  },
  {
    id: 3,
    senderId: 3,
    senderNickname: "jane_smith",
    receiverId: 1,
    content: "프로젝트 마감일이 다가왔습니다. 화이팅!",
    isRead: false,
    createdAt: "2025-04-03T09:15:00Z",
    isNotice: false,
  },
  // 더 많은 더미 데이터를 추가하여 페이징 테스트
  ...Array.from({ length: 20 }, (_, i) => ({
    id: 4 + i,
    senderId: (i % 3) + 2,
    senderNickname: [`john_doe`, `jane_smith`, `alex_wang`][i % 3],
    receiverId: 1,
    content: `테스트 메시지 ${i + 1}. 이것은 테스트를 위한 가짜 메시지입니다.`,
    isRead: i % 2 === 0,
    createdAt: new Date(Date.now() - (20 - i) * 60 * 60 * 1000).toISOString(), // 최근 20시간 내 생성
    isNotice: false,
  })),
];

// 메시지 ID 카운터
let messageIdCounter = 25;

/**
 * 페이지네이션 응답 생성 유틸리티
 * @param items 전체 아이템 배열
 * @param page 요청 페이지 번호
 * @param limit 한 페이지당 아이템 수
 * @returns 페이징된 응답 객체
 */
const createPaginatedResponse = (
  items: any[],
  page: number = 1,
  limit: number = 10
) => {
  const validPage = Math.max(1, page);
  const startIndex = (validPage - 1) * limit;
  const endIndex = startIndex + limit;
  const data = items.slice(startIndex, endIndex);
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / limit);

  return {
    data,
    currentPage: validPage,
    totalItems,
    totalPages,
  };
};

// 메시지 핸들러 정의
export const messageHandlers = [
  // POST /messages - 메시지 생성 (개인 메시지 또는 공지)
  http.post(`${BASE_API_URL}/messages`, async ({ request }) => {
    try {
      const body = await request.json();
      const parsedBody = CreateMessageSchema.safeParse(body);

      if (!parsedBody.success) {
        return HttpResponse.json(
          {
            error: "Validation failed",
            details: parsedBody.error.errors,
          },
          { status: 400 }
        );
      }

      const { receiverId, content, isNotice = false } = parsedBody.data;

      // 공지 메시지인 경우 receiverId 체크 생략
      if (!isNotice && !receiverId) {
        return HttpResponse.json(
          { error: "개인 메시지 전송 시 receiverId는 필수입니다." },
          { status: 400 }
        );
      }

      // 공지 메시지 생성 로직 (관리자 권한 체크 생략)
      if (isNotice) {
        const response = CreateNoticeResponseSchema.parse({
          noticeId: `notice-${messageIdCounter}`,
          content,
          sentTo: 15000, // 임의의 수신자 수
          createdAt: new Date().toISOString(),
        });

        return HttpResponse.json(response, { status: 201 });
      }

      // 개인 메시지 생성
      const newMessage = {
        id: messageIdCounter++,
        senderId: 1, // 현재 로그인한 사용자 (임의로 1로 설정)
        senderNickname: "CurrentUser",
        receiverId: receiverId!,
        content,
        isRead: false,
        createdAt: new Date().toISOString(),
        isNotice: false,
      };

      mockMessages.push(newMessage);

      // 응답은 MessageDetailDto 형태로 반환
      const response = MessageDetailSchema.parse(newMessage);
      return HttpResponse.json(response, { status: 201 });
    } catch (error) {
      return HttpResponse.json(
        { error: "Invalid JSON format" },
        { status: 400 }
      );
    }
  }),

  // GET /messages - 받은 메시지 목록 조회 (페이징 적용)
  http.get(`${BASE_API_URL}/messages`, ({ request }) => {
    const url = new URL(request.url);
    // 쿼리 파라미터 파싱
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);

    // 현재 사용자 (receiverId = 1)에게 온 메시지만 필터링
    const userMessages = mockMessages.filter((msg) => msg.receiverId === 1);

    // 최신순 정렬 (서버 로직과 동일)
    const sortedMessages = [...userMessages].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // 페이지네이션 적용
    const paginatedResponse = createPaginatedResponse(
      sortedMessages,
      page,
      limit
    );

    try {
      // Zod 스키마로 응답 검증
      const validatedResponse =
        PaginatedMessageListSchema.parse(paginatedResponse);
      return HttpResponse.json(validatedResponse, { status: 200 });
    } catch (error) {
      return HttpResponse.json(
        { error: "Invalid response format", details: error },
        { status: 500 }
      );
    }
  }),

  // GET /messages/:id - 메시지 상세 조회 (조회 시 isRead = true)
  http.get(`${BASE_API_URL}/messages/:id`, ({ params }) => {
    const id = Number(params.id);
    const message = mockMessages.find(
      (msg) => msg.id === id && msg.receiverId === 1
    );

    if (!message) {
      return HttpResponse.json(
        { error: "메시지를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 조회 시 읽음 처리
    message.isRead = true;

    try {
      const validatedResponse = MessageDetailSchema.parse(message);
      return HttpResponse.json(validatedResponse, { status: 200 });
    } catch (error) {
      return HttpResponse.json(
        { error: "Invalid response format", details: error },
        { status: 500 }
      );
    }
  }),

  // DELETE /messages/:id - 메시지 삭제 (소프트 삭제)
  http.delete(`${BASE_API_URL}/messages/:id`, ({ params }) => {
    const id = Number(params.id);
    const messageIndex = mockMessages.findIndex(
      (msg) => msg.id === id && msg.receiverId === 1
    );

    if (messageIndex === -1) {
      return HttpResponse.json(
        { error: "메시지를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 소프트 삭제: 배열에서 제거
    mockMessages.splice(messageIndex, 1);

    const response = MessageApiResponseSchema.parse({
      message: "메시지가 삭제되었습니다.",
    });

    return HttpResponse.json(response, { status: 200 });
  }),
];
