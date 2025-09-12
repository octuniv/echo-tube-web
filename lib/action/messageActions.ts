"use server";

import { authenticatedFetch } from "../auth/authenticatedFetch";
import { AuthenticatedFetchErrorType } from "../auth/types";
import {
  MessageErrors,
  MessageResponses,
} from "../constants/message/constants";

import { BASE_API_URL } from "../util";
import {
  CreateMessageFormState,
  CreateMessageSchema,
  MessageDetailDto,
  MessageDetailSchema,
  PaginatedMessageListDto,
  PaginatedMessageListSchema,
} from "../definition/messageSchema";

export async function FetchMessages(
  page: number
): Promise<PaginatedMessageListDto | { message: string }> {
  const queryParams = new URLSearchParams({
    page: page.toString(),
  });

  const { data, error } = await authenticatedFetch({
    url: `${BASE_API_URL}/messages?${queryParams.toString()}`,
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (error) {
    switch (error.type) {
      case AuthenticatedFetchErrorType.Unauthorized:
        return { message: MessageErrors.UNAUTHORIZED_ACCESS };
      default:
        console.error("Unexpected error during message loading:", error);
        return {
          data: [],
          currentPage: 1,
          totalItems: 0,
          totalPages: 0,
        };
    }
  }

  const result = PaginatedMessageListSchema.safeParse(data);

  if (!result.success) {
    console.error("Validation Failed: ", result.error);
    return {
      data: [],
      currentPage: 1,
      totalItems: 0,
      totalPages: 0,
    };
  }

  return result.data;
}

export async function FetchMessage(
  messageId: number
): Promise<MessageDetailDto | { message: string }> {
  const { data, error } = await authenticatedFetch({
    url: `${BASE_API_URL}/messages/${messageId}`,
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (error) {
    const message = error.message;
    switch (error.type) {
      case AuthenticatedFetchErrorType.Unauthorized:
        return { message: MessageErrors.UNAUTHORIZED_ACCESS };
      case AuthenticatedFetchErrorType.NotFound:
        if (message === MessageErrors.MESSAGE_NOT_FOUND) {
          return { message };
        } else {
          console.error("Unexpected error during message fetching:", error);
          return { message: "Something wrong when fetching message" };
        }
      default:
        console.error("Unexpected error during message fetching:", error);
        return { message: "Something wrong when fetching message" };
    }
  }

  const result = MessageDetailSchema.safeParse(data);
  if (!result.success) {
    console.error("Validation Failed: ", result.error);
    return { message: "Failed to fetch valid message" };
  }
  return result.data;
}

export async function SendMessage(
  prevState: CreateMessageFormState,
  formData: FormData
): Promise<CreateMessageFormState> {
  const getFormValue = (key: string) => {
    const value = formData.get(key);
    return value === null || value === "" ? undefined : value;
  };

  const validatedFields = CreateMessageSchema.safeParse({
    content: formData.get("content"),
    isNotice: getFormValue("isNotice") || false,
    receiverNickname: getFormValue("receiverNickname"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Invalid fields. Please check your input values.",
    };
  }

  const body = validatedFields.data;

  const { error } = await authenticatedFetch({
    url: `${BASE_API_URL}/messages`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (error) {
    const message = error.message;

    switch (error.type) {
      case AuthenticatedFetchErrorType.Unauthorized:
        return { message: MessageErrors.UNAUTHORIZED_ACCESS };
      case AuthenticatedFetchErrorType.Forbidden:
        switch (message) {
          case MessageErrors.FORBIDDEN_NOTICE:
            return { message };
          default:
            console.error("Unexpected error during message sending:", error);
            return { message: "Something wrong when sending message" };
        }
      case AuthenticatedFetchErrorType.NotFound:
        switch (message) {
          case MessageErrors.RECEIVER_NOT_FOUND:
            return { message };
          default:
            console.error("Unexpected error during message sending:", error);
            return { message: "Something wrong when sending message" };
        }
      default:
        console.error("Unexpected error during message sending:", error);
        return {
          message: "An unexpected error occurred. Please try again.",
        };
    }
  } else {
    return { message: MessageResponses.SENT };
  }
}

export async function DeleteMessage(messageId: number) {
  const { error } = await authenticatedFetch({
    url: `${BASE_API_URL}/messages/${messageId}`,
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (error) {
    const message = error.message;

    switch (error.type) {
      case AuthenticatedFetchErrorType.Unauthorized:
        return { message: MessageErrors.UNAUTHORIZED_ACCESS };
      case AuthenticatedFetchErrorType.NotFound:
        switch (message) {
          case MessageErrors.MESSAGE_NOT_FOUND:
            return { message };
          default:
            console.error("Unexpected error during message deletion:", error);
            return { message: "Something wrong when deleting message" };
        }
      default:
        console.error("Unexpected error during message deletion:", error);
        return {
          message: "An unexpected error occurred. Please try again.",
        };
    }
  } else {
    return { message: MessageResponses.DELETED };
  }
}
