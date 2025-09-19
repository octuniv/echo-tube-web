// lib/definition/messageSchema.ts
import { z } from "zod";
import { FormState, genericPaginatedResponseDtoSchema } from "./commonSchemas";

/**
 * 메시지 생성 요청 스키마
 */
export const CreateMessageSchema = z.object({
  receiverNickname: z.string().optional(), // 공지일 경우 생략 가능
  content: z.string().min(1, { message: "메시지 내용은 필수입니다." }),
  isNotice: z.boolean().optional().default(false),
});

export type CreateMessageDto = z.infer<typeof CreateMessageSchema>;
export type CreateMessageFormState = FormState<CreateMessageDto>;

/**
 * 메시지 목록 아이템 스키마
 */
export const MessageListItemSchema = z.object({
  id: z.number().nonnegative(),
  senderNickname: z.string().min(1),
  preview: z.string().min(1),
  isRead: z.boolean(),
  createdAt: z.string().datetime(),
});

export type MessageListItemDto = z.infer<typeof MessageListItemSchema>;

/**
 * 페이징된 메시지 목록 응답 스키마
 * 서버의 PaginatedResponseDto<MessageListItemDto>에 대응
 */
export const PaginatedMessageListSchema = genericPaginatedResponseDtoSchema(
  MessageListItemSchema
);
export type PaginatedMessageListDto = z.infer<
  typeof PaginatedMessageListSchema
>;

/**
 * 메시지 상세 조회 스키마
 */
export const MessageDetailSchema = z.object({
  id: z.number().nonnegative(),
  senderNickname: z.string().min(1),
  content: z.string().min(1),
  isRead: z.boolean(),
  createdAt: z.string().datetime(),
  isNotice: z.boolean(),
});

export type MessageDetailDto = z.infer<typeof MessageDetailSchema>;

/**
 * 공지 메시지 생성 응답 스키마
 */
export const CreateNoticeResponseSchema = z.object({
  noticeId: z.string().min(1),
  content: z.string().min(1),
  sentTo: z.number().nonnegative(), // 또는 recipientCount
  createdAt: z.string().datetime(),
});

export type CreateNoticeResponseDto = z.infer<
  typeof CreateNoticeResponseSchema
>;

/**
 * 일반 API 응답 스키마 (삭제 등)
 */
export const MessageApiResponseSchema = z.object({
  message: z.string().min(1),
});

export type MessageApiResponseType = z.infer<typeof MessageApiResponseSchema>;
