import { http, HttpResponse } from "msw";
import { mockBoards } from "../../mocks/admin/boardHandlers";
import { server } from "../../mocks/server";
import { BoardPurpose, UserRole } from "../definition";
import { serverAddress } from "../util";
import {
  createBoard,
  deleteBoard,
  fetchBoardById,
  fetchBoards,
  updateBoard,
} from "./adminBoardManagementApi";
import { BOARD_ERROR_MESSAGES } from "../constants/board/errorMessage";
import { clearAuth } from "../authState";
import { redirect, forbidden } from "next/navigation";
import {
  BoardFormData,
  BoardFormState,
} from "../definition/adminBoardManagementSchema";
import { revalidatePath } from "next/cache";

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

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

jest.mock("../authState", () => ({
  clearAuth: jest.fn(),
}));

// 테스트 파일 내부 상단
const consoleErrorSpy = jest.spyOn(console, "error");

beforeAll(() => {
  consoleErrorSpy.mockImplementation(() => {});
});

afterAll(() => {
  consoleErrorSpy.mockRestore();
});

describe("fetchBoards", () => {
  it("보드 목록을 성공적으로 가져와야 합니다", async () => {
    const result = await fetchBoards();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(mockBoards[0].id);
  });

  it("인증 실패 시 Unauthorized 페이지로 리다이렉트 해야 합니다", async () => {
    server.use(
      http.get(`${serverAddress}/admin/boards`, () => {
        return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
      })
    );

    await expect(fetchBoards()).rejects.toThrow();
    expect(clearAuth).toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith("/login?error=session_expired");
  });

  it("권한 부족 시 Forbidden 페이지로 리다이렉트 해야 합니다", async () => {
    server.use(
      http.get(`${serverAddress}/admin/boards`, () => {
        return HttpResponse.json({ message: "Forbidden" }, { status: 403 });
      })
    );

    await expect(fetchBoards()).rejects.toThrow();
    expect(forbidden).toHaveBeenCalled();
  });
});

describe("fetchBoardById", () => {
  it("특정 ID의 보드를 성공적으로 가져와야 합니다", async () => {
    const result = await fetchBoardById(1);
    expect(result.id).toBe(1);
  });

  it("존재하지 않는 보드 요청 시 에러를 던져야 합니다", async () => {
    await expect(fetchBoardById(999)).rejects.toThrow(
      BOARD_ERROR_MESSAGES.NOT_FOUND_BOARD
    );
  });

  it("인증 실패 시 Unauthorized 페이지로 리다이렉트 해야 합니다", async () => {
    server.use(
      http.get(`${serverAddress}/admin/boards/:id`, () => {
        return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
      })
    );

    await expect(fetchBoardById(1)).rejects.toThrow();
    expect(clearAuth).toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith("/login?error=session_expired");
  });

  it("권한 부족 시 Forbidden 페이지로 리다이렉트 해야 합니다", async () => {
    server.use(
      http.get(`${serverAddress}/admin/boards/:id`, () => {
        return HttpResponse.json({ message: "Forbidden" }, { status: 403 });
      })
    );

    await expect(fetchBoardById(1)).rejects.toThrow();
    expect(forbidden).toHaveBeenCalled();
  });
});

const boardFormDataMock = (data: BoardFormData) => {
  const formData = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      formData.append(key, "");
    } else if (Array.isArray(value)) {
      value.forEach((item) => formData.append(key, item));
    } else {
      formData.append(key, String(value));
    }
  });

  return formData;
};

describe("createBoard", () => {
  it("빈 필드에 대한 검증 오류를 반환해야 합니다", async () => {
    const emptyFormData = boardFormDataMock({
      slug: "",
      name: "",
      description: "",
      categoryId: 1,
      requiredRole: UserRole.USER,
      type: BoardPurpose.GENERAL,
    });
    const result = await createBoard({} as BoardFormState, emptyFormData);
    expect(result).toEqual({
      errors: {
        name: [BOARD_ERROR_MESSAGES.NAME_REQUIRED],
        slug: [
          BOARD_ERROR_MESSAGES.SLUG_REQUIRED,
          BOARD_ERROR_MESSAGES.INVALID_SLUG,
        ],
      },
      message: BOARD_ERROR_MESSAGES.INVALID_FORM_DATA,
    });
  });

  it("슬러그가 유효하지 않은 경우 오류를 반환해야 합니다", async () => {
    const invalidSlugFormData = boardFormDataMock({
      slug: "Invalid",
      name: "test",
      description: "",
      categoryId: 1,
      requiredRole: UserRole.USER,
      type: BoardPurpose.GENERAL,
    });

    const result = await createBoard({} as BoardFormState, invalidSlugFormData);
    expect(result).toEqual({
      errors: {
        slug: [BOARD_ERROR_MESSAGES.INVALID_SLUG],
      },
      message: BOARD_ERROR_MESSAGES.INVALID_FORM_DATA,
    });
  });

  const validData = {
    slug: "general",
    name: "test",
    description: "",
    categoryId: 1,
    requiredRole: UserRole.USER,
    type: BoardPurpose.GENERAL,
  };

  it("슬러그가 중복된 경우 오류를 반환해야 합니다", async () => {
    const duplicatedSlug = "used";
    const duplicatedSlugFormData = boardFormDataMock({
      ...validData,
      slug: duplicatedSlug,
    });

    const result = await createBoard(
      {} as BoardFormState,
      duplicatedSlugFormData
    );

    expect(result).toEqual({
      errors: {
        slug: [BOARD_ERROR_MESSAGES.DUPLICATE_SLUG(duplicatedSlug)],
      },
      message: BOARD_ERROR_MESSAGES.DUPLICATE_SLUG(duplicatedSlug),
    });
  });

  it("카테고리에서 허용하지 않는 슬러그를 입력하면 오류를 반환해야 합니다.", async () => {
    const notAllowedSlug = "free";
    const notAllowedSlugFormData = boardFormDataMock({
      ...validData,
      slug: notAllowedSlug,
    });

    const result = await createBoard(
      {} as BoardFormState,
      notAllowedSlugFormData
    );

    expect(result).toEqual({
      errors: {
        slug: [
          BOARD_ERROR_MESSAGES.SLUG_NOT_ALLOWED_IN_CATEGORY(notAllowedSlug),
        ],
      },
      message:
        BOARD_ERROR_MESSAGES.SLUG_NOT_ALLOWED_IN_CATEGORY(notAllowedSlug),
    });
  });

  it("허용 되지 않는 보드 권한을 사용하면 오류를 반환해야 합니다.", async () => {
    const notAllowedTypeFormData = boardFormDataMock({
      ...validData,
      type: BoardPurpose.AI_DIGEST,
      requiredRole: UserRole.USER,
    });

    const result = await createBoard(
      {} as BoardFormState,
      notAllowedTypeFormData
    );

    expect(result).toEqual({
      errors: {
        type: [BOARD_ERROR_MESSAGES.NOT_ALLOWED_BOARD_TYPE],
        requiredRole: [BOARD_ERROR_MESSAGES.NOT_ALLOWED_BOARD_TYPE],
      },
      message: BOARD_ERROR_MESSAGES.NOT_ALLOWED_BOARD_TYPE,
    });
  });

  it("유효한 데이터 입력시 성공적으로 호출이 이루어진 후 조회 페이지로 리다이렉트 됩니다.", async () => {
    const mockDataLength = mockBoards.length;
    await expect(
      createBoard({} as BoardFormState, boardFormDataMock(validData))
    ).rejects.toThrow();

    expect(revalidatePath).toHaveBeenCalledWith("/admin/boards");
    expect(redirect).toHaveBeenCalledWith("/admin/boards");
    expect(mockBoards.length).toBe(mockDataLength + 1);
  });

  it("인증 실패 시 Unauthorized 페이지로 리다이렉트 해야 합니다", async () => {
    server.use(
      http.post(`${serverAddress}/admin/boards`, () => {
        return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
      })
    );

    await expect(
      createBoard({} as BoardFormState, boardFormDataMock(validData))
    ).rejects.toThrow();
    expect(clearAuth).toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith("/login?error=session_expired");
  });

  it("권한 부족 시 Forbidden 페이지로 리다이렉트 해야 합니다", async () => {
    server.use(
      http.post(`${serverAddress}/admin/boards`, () => {
        return HttpResponse.json({ message: "Forbidden" }, { status: 403 });
      })
    );

    await expect(
      createBoard({} as BoardFormState, boardFormDataMock(validData))
    ).rejects.toThrow();
    expect(forbidden).toHaveBeenCalled();
  });
});

describe("updateBoard", () => {
  const boardId = 2;

  it("빈 필드에 대한 검증 오류를 반환해야 합니다", async () => {
    const emptyFormData = boardFormDataMock({
      slug: "",
      name: "",
      description: "",
      categoryId: 1,
      requiredRole: UserRole.USER,
      type: BoardPurpose.GENERAL,
    });
    const result = await updateBoard(
      boardId,
      {} as BoardFormState,
      emptyFormData
    );
    expect(result).toEqual({
      errors: {
        name: [BOARD_ERROR_MESSAGES.NAME_REQUIRED],
        slug: [
          BOARD_ERROR_MESSAGES.SLUG_REQUIRED,
          BOARD_ERROR_MESSAGES.INVALID_SLUG,
        ],
      },
      message: BOARD_ERROR_MESSAGES.INVALID_FORM_DATA,
    });
  });

  it("슬러그가 유효하지 않은 경우 오류를 반환해야 합니다", async () => {
    const invalidSlugFormData = boardFormDataMock({
      slug: "Invalid",
      name: "test",
      description: "",
      categoryId: 1,
      requiredRole: UserRole.USER,
      type: BoardPurpose.GENERAL,
    });

    const result = await updateBoard(
      boardId,
      {} as BoardFormState,
      invalidSlugFormData
    );
    expect(result).toEqual({
      errors: {
        slug: [BOARD_ERROR_MESSAGES.INVALID_SLUG],
      },
      message: BOARD_ERROR_MESSAGES.INVALID_FORM_DATA,
    });
  });

  const validData = {
    slug: "notice",
    name: "test2",
    description: "",
    categoryId: 2,
    requiredRole: UserRole.USER,
    type: BoardPurpose.GENERAL,
  };

  it("슬러그가 중복된 경우 오류를 반환해야 합니다", async () => {
    const duplicatedSlug = "used";
    const duplicatedSlugFormData = boardFormDataMock({
      ...validData,
      slug: duplicatedSlug,
    });

    const result = await updateBoard(
      boardId,
      {} as BoardFormState,
      duplicatedSlugFormData
    );

    expect(result).toEqual({
      errors: {
        slug: [BOARD_ERROR_MESSAGES.DUPLICATE_SLUG(duplicatedSlug)],
      },
      message: BOARD_ERROR_MESSAGES.DUPLICATE_SLUG(duplicatedSlug),
    });
  });

  it("카테고리에서 허용하지 않는 슬러그를 입력하면 오류를 반환해야 합니다.", async () => {
    const notAllowedSlug = "ai";
    const notAllowedSlugFormData = boardFormDataMock({
      ...validData,
      slug: notAllowedSlug,
    });

    const result = await updateBoard(
      boardId,
      {} as BoardFormState,
      notAllowedSlugFormData
    );

    expect(result).toEqual({
      errors: {
        slug: [
          BOARD_ERROR_MESSAGES.SLUG_NOT_ALLOWED_IN_CATEGORY(notAllowedSlug),
        ],
      },
      message:
        BOARD_ERROR_MESSAGES.SLUG_NOT_ALLOWED_IN_CATEGORY(notAllowedSlug),
    });
  });

  it("허용 되지 않는 보드 권한을 사용하면 오류를 반환해야 합니다.", async () => {
    const notAllowedTypeFormData = boardFormDataMock({
      ...validData,
      type: BoardPurpose.AI_DIGEST,
      requiredRole: UserRole.USER,
    });

    const result = await updateBoard(
      boardId,
      {} as BoardFormState,
      notAllowedTypeFormData
    );

    expect(result).toEqual({
      errors: {
        type: [BOARD_ERROR_MESSAGES.NOT_ALLOWED_BOARD_TYPE],
        requiredRole: [BOARD_ERROR_MESSAGES.NOT_ALLOWED_BOARD_TYPE],
      },
      message: BOARD_ERROR_MESSAGES.NOT_ALLOWED_BOARD_TYPE,
    });
  });

  it("존재하지 않는 보드 업데이트 시 not_found 오류를 반환합니다.", async () => {
    const result = await updateBoard(
      9999,
      {} as BoardFormState,
      boardFormDataMock(validData)
    );

    expect(result).toEqual({
      message: BOARD_ERROR_MESSAGES.NOT_FOUND_BOARD,
    });
  });

  it("유효한 데이터 입력시 성공적으로 호출이 이루어진 후 조회 페이지로 리다이렉트 됩니다.", async () => {
    const mockDataLength = mockBoards.length;
    await expect(
      updateBoard(boardId, {} as BoardFormState, boardFormDataMock(validData))
    ).rejects.toThrow();

    expect(revalidatePath).toHaveBeenCalledWith("/admin/boards");
    expect(redirect).toHaveBeenCalledWith("/admin/boards");
    expect(mockBoards.length).toBe(mockDataLength);
  });

  it("인증 실패 시 Unauthorized 페이지로 리다이렉트 해야 합니다", async () => {
    server.use(
      http.put(`${serverAddress}/admin/boards/:id`, () => {
        return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
      })
    );

    await expect(
      updateBoard(boardId, {} as BoardFormState, boardFormDataMock(validData))
    ).rejects.toThrow();
    expect(clearAuth).toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith("/login?error=session_expired");
  });

  it("권한 부족 시 Forbidden 페이지로 리다이렉트 해야 합니다", async () => {
    server.use(
      http.put(`${serverAddress}/admin/boards/:id`, () => {
        return HttpResponse.json({ message: "Forbidden" }, { status: 403 });
      })
    );

    await expect(
      updateBoard(boardId, {} as BoardFormState, boardFormDataMock(validData))
    ).rejects.toThrow();
    expect(forbidden).toHaveBeenCalled();
  });
});

describe("deleteBoard", () => {
  it("존재하지 않은 보드 삭제 시도시 not_found 오류를 반환합니다.", async () => {
    await expect(deleteBoard(9999)).rejects.toThrow(
      new Error(BOARD_ERROR_MESSAGES.NOT_FOUND_BOARD)
    );
  });

  it("올바른 보드 삭제 후 현 조회 페이지가 갱신됩니다.", async () => {
    const mockBoardLength = mockBoards.length;
    await deleteBoard(2);
    expect(mockBoards.length).toBe(mockBoardLength - 1);
    expect(revalidatePath).toHaveBeenCalledWith("/admin/boards");
  });

  it("인증 실패 시 Unauthorized 페이지로 리다이렉트 해야 합니다", async () => {
    server.use(
      http.delete(`${serverAddress}/admin/boards/:id`, () => {
        return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
      })
    );

    await expect(deleteBoard(1)).rejects.toThrow();
    expect(clearAuth).toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith("/login?error=session_expired");
  });

  it("권한 부족 시 Forbidden 페이지로 리다이렉트 해야 합니다", async () => {
    server.use(
      http.delete(`${serverAddress}/admin/boards/:id`, () => {
        return HttpResponse.json({ message: "Forbidden" }, { status: 403 });
      })
    );

    await expect(deleteBoard(1)).rejects.toThrow();
    expect(forbidden).toHaveBeenCalled();
  });
});
