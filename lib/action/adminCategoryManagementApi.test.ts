// adminCategoryManagementApi.test.ts
import {
  fetchCategories,
  fetchCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  validateSlug,
  validateName,
  getAvailableCategories,
} from "./adminCategoryManagementApi";
import {
  CategoryFormData,
  CategoryFormState,
  ValidateDataType,
} from "../definition/adminCategoryManagementSchema";
import { server } from "../../mocks/server";
import { http, HttpResponse } from "msw";
import { serverAddress } from "../util";
import { clearAuth } from "../authState";
import { ERROR_MESSAGES } from "../constants/errorMessage";
import { forbidden, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  availableCategoriesMock,
  mockCategories,
} from "../../mocks/admin/categoryHandlers";
import { CATEGORY_ERROR_MESSAGES } from "../constants/category/errorMessage";

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

describe("Admin Category API Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    server.resetHandlers();
  });

  describe("fetchCategories", () => {
    const consoleErrorMock = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    beforeEach(() => jest.clearAllMocks());

    afterEach(() => consoleErrorMock.mockClear());

    it("should fetch categories successfully", async () => {
      server.use(
        http.get(`${serverAddress}/admin/categories`, () => {
          return HttpResponse.json(mockCategories, { status: 200 });
        })
      );

      const result = await fetchCategories();
      expect(result).toEqual(mockCategories);
    });

    it("should handle unauthorized access", async () => {
      server.use(
        http.get(`${serverAddress}/admin/categories`, () => {
          return HttpResponse.json(
            { message: "Unauthorized" },
            { status: 401 }
          );
        })
      );

      await expect(fetchCategories()).rejects.toThrow();
      expect(clearAuth).toHaveBeenCalled();
      expect(redirect).toHaveBeenCalledWith("/login?error=session_expired");
    });

    it("should handle permission denied", async () => {
      server.use(
        http.get(`${serverAddress}/admin/categories`, () => {
          return HttpResponse.json({ message: "Forbidden" }, { status: 403 });
        })
      );
      await expect(fetchCategories()).rejects.toThrow();
      expect(forbidden).toHaveBeenCalled();
    });

    it("should handle validation errors", async () => {
      const invalidData = { invalid: "data" };
      server.use(
        http.get(`${serverAddress}/admin/categories`, () => {
          return HttpResponse.json(invalidData, { status: 200 });
        })
      );

      await expect(fetchCategories()).rejects.toThrow(
        CATEGORY_ERROR_MESSAGES.INVALID_DATA_TYPE
      );
    });
  });

  describe("fetchCategoryById", () => {
    const categoryId = 1;

    it("should fetch category details successfully", async () => {
      const result = await fetchCategoryById(categoryId);

      expect(result).toEqual({
        id: expect.any(Number),
        name: expect.any(String),
        allowedSlugs: expect.any(Array),
        boards: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(Number),
            slug: expect.any(String),
            name: expect.any(String),
            type: expect.any(String),
            requiredRole: expect.any(String),
          }),
        ]),
        createdAt: expect.stringMatching(
          /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z/
        ),
        updatedAt: expect.stringMatching(
          /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z/
        ),
      });
    });

    it("should handle not found error", async () => {
      server.use(
        http.get(`${serverAddress}/admin/categories/999`, () => {
          return HttpResponse.json({ message: "Not Found" }, { status: 404 });
        })
      );

      await expect(fetchCategoryById(999)).rejects.toThrow(
        ERROR_MESSAGES.NOT_FOUND
      );
    });

    it("should handle unauthorized access", async () => {
      server.use(
        http.get(`${serverAddress}/admin/categories/${categoryId}`, () => {
          return HttpResponse.json(
            { message: "Unauthorized" },
            { status: 401 }
          );
        })
      );

      await expect(fetchCategoryById(categoryId)).rejects.toThrow();
      expect(clearAuth).toHaveBeenCalled();
      expect(redirect).toHaveBeenCalledWith("/login?error=session_expired");
    });

    it("should handle permission denied", async () => {
      const categoryId = 1;
      server.use(
        http.get(`${serverAddress}/admin/categories/${categoryId}`, () => {
          return HttpResponse.json({ message: "Forbidden" }, { status: 403 });
        })
      );
      await expect(fetchCategoryById(categoryId)).rejects.toThrow();
      expect(forbidden).toHaveBeenCalled();
    });
  });

  describe("createCategory", () => {
    const formDataMock = (data: CategoryFormData) => {
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

    it("should return validation errors for empty fields", async () => {
      const emptyFormData = new FormData();
      const result = await createCategory(
        {} as CategoryFormState,
        emptyFormData
      );
      expect(result).toEqual({
        errors: {
          name: [CATEGORY_ERROR_MESSAGES.NAME_SHOULD_BE_STRING],
          allowedSlugs: [CATEGORY_ERROR_MESSAGES.SLUGS_REQUIRED],
        },
        message: "Missing or invalid fields. Failed to create category.",
      });
    });

    it("should return error if both fields are empty", async () => {
      const formData = formDataMock({
        name: "",
        allowedSlugs: [],
      });
      const result = await createCategory({} as CategoryFormState, formData);
      expect(result).toEqual({
        errors: {
          name: [CATEGORY_ERROR_MESSAGES.NAME_REQUIRED],
          allowedSlugs: [CATEGORY_ERROR_MESSAGES.SLUGS_REQUIRED],
        },
        message: "Missing or invalid fields. Failed to create category.",
      });
    });

    it("should return error if allowedSlug is empty", async () => {
      const formData = formDataMock({
        name: "John",
        allowedSlugs: [""],
      });
      const result = await createCategory({} as CategoryFormState, formData);
      expect(result).toEqual({
        errors: {
          allowedSlugs: [CATEGORY_ERROR_MESSAGES.SLUG_REQUIRED],
        },
        message: "Missing or invalid fields. Failed to create category.",
      });
    });

    it("should return error if name contains numbers", async () => {
      const formData = formDataMock({
        name: "John123",
        allowedSlugs: ["existing"],
      });
      const result = await createCategory({} as CategoryFormState, formData);
      expect(result).toEqual({
        errors: {
          name: [CATEGORY_ERROR_MESSAGES.INVALID_NAME],
        },
        message: "Missing or invalid fields. Failed to create category.",
      });
    });

    it("should return error if name contains special characters", async () => {
      const formData = formDataMock({
        name: "John@Doe",
        allowedSlugs: ["existing"],
      });
      const result = await createCategory({} as CategoryFormState, formData);
      expect(result).toEqual({
        errors: {
          name: [CATEGORY_ERROR_MESSAGES.INVALID_NAME],
        },
        message: "Missing or invalid fields. Failed to create category.",
      });
    });

    it("should handle name conflict error", async () => {
      const categoryData = {
        name: "Existing Category",
        allowedSlugs: ["existing"],
      };
      server.use(
        http.post(`${serverAddress}/admin/categories`, () => {
          return HttpResponse.json(
            { message: CATEGORY_ERROR_MESSAGES.DUPLICATE_CATEGORY_NAME },
            { status: 409 }
          );
        })
      );

      const result = await createCategory(
        {} as CategoryFormState,
        formDataMock(categoryData)
      );
      expect(result).toEqual({
        message: CATEGORY_ERROR_MESSAGES.DUPLICATE_CATEGORY_NAME,
        errors: { name: [CATEGORY_ERROR_MESSAGES.DUPLICATE_CATEGORY_NAME] },
      });
    });

    it("should handle slug conflict error", async () => {
      const categoryData = {
        name: "New Category",
        allowedSlugs: ["existing"],
      };
      server.use(
        http.post(`${serverAddress}/admin/categories`, () => {
          return HttpResponse.json(
            {
              message: CATEGORY_ERROR_MESSAGES.DUPLICATE_SLUGS(
                categoryData.allowedSlugs
              ),
            },
            { status: 400 }
          );
        })
      );

      const result = await createCategory(
        {} as CategoryFormState,
        formDataMock(categoryData)
      );
      expect(result).toEqual({
        message: CATEGORY_ERROR_MESSAGES.DUPLICATE_SLUGS(
          categoryData.allowedSlugs
        ),
        errors: {
          allowedSlugs: [
            CATEGORY_ERROR_MESSAGES.DUPLICATE_SLUGS(categoryData.allowedSlugs),
          ],
        },
      });
    });

    it("should handle multiple slug conflict errors", async () => {
      const categoryData = {
        name: "New Category",
        allowedSlugs: ["existing1", "existing2"],
      };
      server.use(
        http.post(`${serverAddress}/admin/categories`, () => {
          return HttpResponse.json(
            {
              message: CATEGORY_ERROR_MESSAGES.DUPLICATE_SLUGS(
                categoryData.allowedSlugs
              ),
            },
            { status: 400 }
          );
        })
      );
      const result = await createCategory(
        {} as CategoryFormState,
        formDataMock(categoryData)
      );

      expect(result).toEqual({
        message: CATEGORY_ERROR_MESSAGES.DUPLICATE_SLUGS(
          categoryData.allowedSlugs
        ),
        errors: {
          allowedSlugs: [
            CATEGORY_ERROR_MESSAGES.DUPLICATE_SLUGS(categoryData.allowedSlugs),
          ],
        },
      });
    });

    it("should successfully create category", async () => {
      const categoryData = {
        name: "New Category",
        allowedSlugs: ["new-category"],
      };
      const mockResponse = { ...categoryData, id: 3, boardIds: [] };

      server.use(
        http.post(`${serverAddress}/admin/categories`, () => {
          return HttpResponse.json(mockResponse, { status: 201 });
        })
      );

      await expect(
        createCategory({} as CategoryFormState, formDataMock(categoryData))
      ).rejects.toThrow();
      expect(revalidatePath).toHaveBeenCalledWith("/admin/categories");
      expect(redirect).toHaveBeenCalledWith("/admin/categories");
    });

    it("should return error if slug has invalid format", async () => {
      const formData = formDataMock({
        name: "Valid Name",
        allowedSlugs: ["InvalidSlug!"], // 대문자 및 특수문자 포함
      });

      const result = await createCategory({} as CategoryFormState, formData);
      expect(result).toEqual({
        errors: {
          allowedSlugs: [CATEGORY_ERROR_MESSAGES.INVALID_SLUGS],
        },
        message: "Missing or invalid fields. Failed to create category.",
      });
    });

    it("should handle to throw server by conflicted slug ", async () => {
      const formData = formDataMock({
        name: "Valid Name",
        allowedSlugs: ["whatever"], // 폼에서 검증 못했다는 가정
      });

      server.use(
        http.post(`${serverAddress}/admin/categories`, () => {
          return HttpResponse.json(
            { message: CATEGORY_ERROR_MESSAGES.INVALID_SLUGS },
            { status: 400 }
          );
        })
      );

      const result = await createCategory({} as CategoryFormState, formData);
      expect(result).toEqual({
        errors: {
          allowedSlugs: [CATEGORY_ERROR_MESSAGES.INVALID_SLUGS],
        },
        message: CATEGORY_ERROR_MESSAGES.INVALID_SLUGS,
      });
    });

    it("should handle unauthorized access", async () => {
      const categoryData = {
        name: "New Category",
        allowedSlugs: ["new-category"],
      };
      server.use(
        http.post(`${serverAddress}/admin/categories`, () => {
          return HttpResponse.json(
            { message: "Unauthorized" },
            { status: 401 }
          );
        })
      );
      const formData = formDataMock(categoryData);
      await expect(
        createCategory({} as CategoryFormState, formData)
      ).rejects.toThrow();
      expect(clearAuth).toHaveBeenCalled();
      expect(redirect).toHaveBeenCalledWith("/login?error=session_expired");
    });

    it("should handle permission denied", async () => {
      const categoryData = {
        name: "New Category",
        allowedSlugs: ["new-category"],
      };
      server.use(
        http.post(`${serverAddress}/admin/categories`, () => {
          return HttpResponse.json({ message: "Forbidden" }, { status: 403 });
        })
      );
      const formData = formDataMock(categoryData);
      await expect(
        createCategory({} as CategoryFormState, formData)
      ).rejects.toThrow();
      expect(forbidden).toHaveBeenCalled();
    });
  });

  describe("updateCategory", () => {
    const categoryId = 1;
    const formDataMock = (data: CategoryFormData) => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach((item) => formData.append(key, item));
          } else {
            formData.append(key, value);
          }
        }
      });
      return formData;
    };

    it("should return validation errors if both fields are missing", async () => {
      const emptyFormData = formDataMock({
        name: "",
        allowedSlugs: [""],
      });
      const result = await updateCategory(
        categoryId,
        {} as CategoryFormState,
        emptyFormData
      );
      expect(result).toEqual({
        errors: {
          name: [CATEGORY_ERROR_MESSAGES.NAME_REQUIRED],
          allowedSlugs: [CATEGORY_ERROR_MESSAGES.SLUG_REQUIRED],
        },
        message: "Missing or invalid fields. Failed to update category.",
      });
    });

    it("should return error if name contains special characters", async () => {
      const formData = formDataMock({
        name: "John@Doe",
        allowedSlugs: ["notice"],
      });
      const result = await updateCategory(
        categoryId,
        {} as CategoryFormState,
        formData
      );
      expect(result).toEqual({
        errors: {
          name: [CATEGORY_ERROR_MESSAGES.INVALID_NAME],
        },
        message: "Missing or invalid fields. Failed to update category.",
      });
    });

    it("should handle name conflict error", async () => {
      const updateData = {
        name: "Existing Category",
        allowedSlugs: ["new-slug"],
      };
      server.use(
        http.put(`${serverAddress}/admin/categories/${categoryId}`, () => {
          return HttpResponse.json(
            { message: CATEGORY_ERROR_MESSAGES.DUPLICATE_CATEGORY_NAME },
            { status: 409 }
          );
        })
      );
      const result = await updateCategory(
        categoryId,
        {} as CategoryFormState,
        formDataMock(updateData)
      );
      expect(result).toEqual({
        message: CATEGORY_ERROR_MESSAGES.DUPLICATE_CATEGORY_NAME,
        errors: { name: [CATEGORY_ERROR_MESSAGES.DUPLICATE_CATEGORY_NAME] },
      });
    });

    it("should handle multiple slug conflict errors", async () => {
      const categoryData = {
        name: "New Category",
        allowedSlugs: ["existing1", "existing2"],
      };
      server.use(
        http.put(`${serverAddress}/admin/categories/${categoryId}`, () => {
          return HttpResponse.json(
            {
              message: CATEGORY_ERROR_MESSAGES.DUPLICATE_SLUGS(
                categoryData.allowedSlugs
              ),
            },
            { status: 400 }
          );
        })
      );
      const result = await updateCategory(
        categoryId,
        {} as CategoryFormState,
        formDataMock(categoryData)
      );

      expect(result).toEqual({
        message: CATEGORY_ERROR_MESSAGES.DUPLICATE_SLUGS(
          categoryData.allowedSlugs
        ),
        errors: {
          allowedSlugs: [
            CATEGORY_ERROR_MESSAGES.DUPLICATE_SLUGS(categoryData.allowedSlugs),
          ],
        },
      });
    });

    it("should successfully update category", async () => {
      const updateData = {
        name: "Updated Name",
        allowedSlugs: ["updated-slug"],
      };
      const mockResponse = { ...mockCategories[0], ...updateData };
      server.use(
        http.put(`${serverAddress}/admin/categories/${categoryId}`, () => {
          return HttpResponse.json(mockResponse, { status: 200 });
        })
      );
      await expect(
        updateCategory(
          categoryId,
          {} as CategoryFormState,
          formDataMock(updateData)
        )
      ).rejects.toThrow();
      expect(revalidatePath).toHaveBeenCalledWith("/admin/categories");
      expect(redirect).toHaveBeenCalledWith("/admin/categories");
    });

    it("should handle category not found error", async () => {
      const nonExistentId = 999;

      server.use(
        http.put(`${serverAddress}/admin/categories/${nonExistentId}`, () => {
          return HttpResponse.json(
            { message: CATEGORY_ERROR_MESSAGES.CATEGORY_NOT_FOUND },
            { status: 404 }
          );
        })
      );

      const result = await updateCategory(
        nonExistentId,
        {} as CategoryFormState,
        formDataMock({
          name: "Test",
          allowedSlugs: ["test"],
        })
      );

      expect(result).toEqual({
        message: CATEGORY_ERROR_MESSAGES.CATEGORY_NOT_FOUND,
      });
    });

    it("should handle to throw server by conflicted slug ", async () => {
      const formData = formDataMock({
        name: "Valid Name",
        allowedSlugs: ["whatever"], // 폼에서 검증 못했다는 가정
      });

      server.use(
        http.put(`${serverAddress}/admin/categories/${categoryId}`, () => {
          return HttpResponse.json(
            { message: CATEGORY_ERROR_MESSAGES.INVALID_SLUGS },
            { status: 400 }
          );
        })
      );

      const result = await updateCategory(
        categoryId,
        {} as CategoryFormState,
        formData
      );
      expect(result).toEqual({
        errors: {
          allowedSlugs: [CATEGORY_ERROR_MESSAGES.INVALID_SLUGS],
        },
        message: CATEGORY_ERROR_MESSAGES.INVALID_SLUGS,
      });
    });

    it("should handle unauthorized access", async () => {
      const categoryId = 1;
      const updateData = {
        name: "Updated Name",
        allowedSlugs: ["updated-slug"],
      };
      server.use(
        http.put(`${serverAddress}/admin/categories/${categoryId}`, () => {
          return HttpResponse.json(
            { message: "Unauthorized" },
            { status: 401 }
          );
        })
      );
      const formData = formDataMock(updateData);
      await expect(
        updateCategory(categoryId, {} as CategoryFormState, formData)
      ).rejects.toThrow();
      expect(clearAuth).toHaveBeenCalled();
      expect(redirect).toHaveBeenCalledWith("/login?error=session_expired");
    });

    it("should handle permission denied", async () => {
      const categoryId = 1;
      const updateData = {
        name: "Updated Name",
        allowedSlugs: ["updated-slug"],
      };
      server.use(
        http.put(`${serverAddress}/admin/categories/${categoryId}`, () => {
          return HttpResponse.json({ message: "Forbidden" }, { status: 403 });
        })
      );
      const formData = formDataMock(updateData);
      await expect(
        updateCategory(categoryId, {} as CategoryFormState, formData)
      ).rejects.toThrow();
      expect(forbidden).toHaveBeenCalled();
    });
  });

  describe("deleteCategory", () => {
    const categoryId = 1;

    it("should delete category successfully", async () => {
      server.use(
        http.delete(`${serverAddress}/admin/categories/${categoryId}`, () => {
          return HttpResponse.json({ message: "삭제 성공" }, { status: 200 });
        })
      );

      await deleteCategory(categoryId);
      expect(revalidatePath).toHaveBeenCalledWith("/admin/categories");
    });

    it("should handle unauthorized error", async () => {
      server.use(
        http.delete(`${serverAddress}/admin/categories/${categoryId}`, () => {
          return HttpResponse.json(
            { message: "Unauthorized" },
            { status: 401 }
          );
        })
      );

      await expect(deleteCategory(categoryId)).rejects.toThrow();
      expect(clearAuth).toHaveBeenCalled();
      expect(redirect).toHaveBeenCalledWith("/login?error=session_expired");
    });

    it("should handle not found error", async () => {
      server.use(
        http.delete(`${serverAddress}/admin/categories/999`, () => {
          return HttpResponse.json(
            { message: CATEGORY_ERROR_MESSAGES.CATEGORY_NOT_FOUND },
            { status: 404 }
          );
        })
      );

      await expect(deleteCategory(999)).rejects.toThrow(
        ERROR_MESSAGES.NOT_FOUND
      );
    });

    it("should handle permission denied", async () => {
      const categoryId = 1;
      server.use(
        http.delete(`${serverAddress}/admin/categories/${categoryId}`, () => {
          return HttpResponse.json({ message: "Forbidden" }, { status: 403 });
        })
      );
      await expect(deleteCategory(categoryId)).rejects.toThrow();
      expect(forbidden).toHaveBeenCalled();
    });
  });

  describe("validateSlug", () => {
    const slug = "test-slug";

    it("should validate slug successfully with categoryId", async () => {
      const categoryId = 1;
      const mockResponse: ValidateDataType = { isUsed: false };

      server.use(
        http.get(
          `${serverAddress}/admin/categories/validate-slug`,
          ({ request }) => {
            const url = new URL(request.url);
            const slugParam = url.searchParams.get("slug");
            const categoryIdParam = url.searchParams.get("categoryId");

            expect(slugParam).toBe(slug);
            expect(categoryIdParam).toBe(String(categoryId));

            return HttpResponse.json(mockResponse, { status: 200 });
          }
        )
      );

      const result = await validateSlug(slug, categoryId);
      expect(result).toEqual(mockResponse);
    });

    it("should validate slug successfully without categoryId", async () => {
      const mockResponse: ValidateDataType = { isUsed: false };

      server.use(
        http.get(
          `${serverAddress}/admin/categories/validate-slug`,
          ({ request }) => {
            const url = new URL(request.url);
            const slugParam = url.searchParams.get("slug");
            const categoryIdParam = url.searchParams.get("categoryId");

            expect(slugParam).toBe(slug);
            expect(categoryIdParam).toBeNull();

            return HttpResponse.json(mockResponse, { status: 200 });
          }
        )
      );

      const result = await validateSlug(slug);
      expect(result).toEqual(mockResponse);
    });

    it("should handle missing slug parameter", async () => {
      server.use(
        http.get(`${serverAddress}/admin/categories/validate-slug`, () => {
          return HttpResponse.json({ isUsed: false }, { status: 200 });
        })
      );

      await expect(validateSlug("")).resolves.toEqual({
        isUsed: false,
        error: CATEGORY_ERROR_MESSAGES.SLUG_REQUIRED,
      });
    });

    it("should handle unauthorized access", async () => {
      server.use(
        http.get(`${serverAddress}/admin/categories/validate-slug`, () => {
          return HttpResponse.json(
            { message: "Unauthorized" },
            { status: 401 }
          );
        })
      );

      await expect(validateSlug(slug)).rejects.toThrow();
      expect(clearAuth).toHaveBeenCalled();
      expect(redirect).toHaveBeenCalledWith("/login?error=session_expired");
    });

    it("should validate slug format correctly", async () => {
      server.use(
        http.get(`${serverAddress}/admin/categories/validate-slug`, () => {
          return HttpResponse.json({ isUsed: false }, { status: 200 });
        })
      );

      // 유효한 슬러그
      await expect(validateSlug("valid-slug")).resolves.toEqual({
        isUsed: false,
      });

      // 대문자 포함
      await expect(validateSlug("InvalidSlug")).resolves.toEqual({
        isUsed: false,
        error: CATEGORY_ERROR_MESSAGES.INVALID_SLUGS,
      });

      // 특수문자 포함
      await expect(validateSlug("slug!123")).resolves.toEqual({
        isUsed: false,
        error: CATEGORY_ERROR_MESSAGES.INVALID_SLUGS,
      });
    });

    it("should handle permission denied", async () => {
      server.use(
        http.get(`${serverAddress}/admin/categories/validate-slug`, () => {
          return HttpResponse.json({ message: "Forbidden" }, { status: 403 });
        })
      );
      await expect(validateSlug("test-slug")).rejects.toThrow();
      expect(forbidden).toHaveBeenCalled();
    });
  });

  describe("validateName", () => {
    const name = "test-name";
    const categoryId = 1;

    it("should validate name successfully with categoryId", async () => {
      server.use(
        http.get(
          `${serverAddress}/admin/categories/validate-name`,
          ({ request }) => {
            const url = new URL(request.url);
            const nameParam = url.searchParams.get("name");
            const categoryIdParam = url.searchParams.get("categoryId");
            expect(nameParam).toBe(name);
            expect(categoryIdParam).toBe(String(categoryId));
            return HttpResponse.json({ isUsed: false }, { status: 200 });
          }
        )
      );

      const result = await validateName(name, categoryId);
      expect(result).toEqual({ isUsed: false });
    });

    it("should validate name successfully without categoryId", async () => {
      server.use(
        http.get(
          `${serverAddress}/admin/categories/validate-name`,
          ({ request }) => {
            const url = new URL(request.url);
            const nameParam = url.searchParams.get("name");
            const categoryIdParam = url.searchParams.get("categoryId");
            expect(nameParam).toBe(name);
            expect(categoryIdParam).toBeNull();
            return HttpResponse.json({ isUsed: false }, { status: 200 });
          }
        )
      );

      const result = await validateName(name);
      expect(result).toEqual({ isUsed: false });
    });

    it("should handle missing name parameter", async () => {
      server.use(
        http.get(`${serverAddress}/admin/categories/validate-name`, () => {
          return HttpResponse.json({ isUsed: false }, { status: 200 });
        })
      );

      const res = await validateName("");
      expect(res).toEqual({
        isUsed: false,
        error: CATEGORY_ERROR_MESSAGES.NAME_REQUIRED,
      } satisfies ValidateDataType);
    });

    it("should handle unauthorized access", async () => {
      server.use(
        http.get(`${serverAddress}/admin/categories/validate-name`, () => {
          return HttpResponse.json(
            { message: "Unauthorized" },
            { status: 401 }
          );
        })
      );

      await expect(validateName(name)).rejects.toThrow();
      expect(clearAuth).toHaveBeenCalled();
      expect(redirect).toHaveBeenCalledWith("/login?error=session_expired");
    });

    it("should handle server error", async () => {
      server.use(
        http.get(`${serverAddress}/admin/categories/validate-name`, () => {
          return HttpResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
          );
        })
      );

      await expect(validateName(name)).rejects.toThrow(
        ERROR_MESSAGES.SERVER_ERROR
      );
    });

    it("should handle conflicted name", async () => {
      server.use(
        http.get(`${serverAddress}/admin/categories/validate-name`, () => {
          return HttpResponse.json({ isUsed: true }, { status: 200 });
        })
      );

      const result = await validateName(name);
      expect(result).toEqual({ isUsed: true });
    });

    it("should handle invalid name", async () => {
      server.use(
        http.get(`${serverAddress}/admin/categories/validate-name`, () => {
          return HttpResponse.json({ isUsed: false }, { status: 200 });
        })
      );

      const res = await validateName("IN!@Valid");
      expect(res).toEqual({
        isUsed: false,
        error: CATEGORY_ERROR_MESSAGES.INVALID_NAME,
      } satisfies ValidateDataType);
    });

    it("should handle permission denied", async () => {
      server.use(
        http.get(`${serverAddress}/admin/categories/validate-name`, () => {
          return HttpResponse.json({ message: "Forbidden" }, { status: 403 });
        })
      );
      await expect(validateName("test-name")).rejects.toThrow();
      expect(forbidden).toHaveBeenCalled();
    });
  });

  describe("getAvailableCategories", () => {
    it("should fetch categories successfully", async () => {
      const result = await getAvailableCategories(1);
      expect(result).toEqual(availableCategoriesMock);
    });

    it("should fetch categories successfully without boardId", async () => {
      const result = await getAvailableCategories();
      expect(result).toEqual(availableCategoriesMock);
    });

    it("should handle unauthorized access", async () => {
      server.use(
        http.get(`${serverAddress}/admin/categories/available`, () => {
          return HttpResponse.json(
            { message: "Unauthorized" },
            { status: 401 }
          );
        })
      );

      await expect(getAvailableCategories()).rejects.toThrow();
      expect(clearAuth).toHaveBeenCalled();
      expect(redirect).toHaveBeenCalledWith("/login?error=session_expired");
    });

    it("should handle permission denied", async () => {
      server.use(
        http.get(`${serverAddress}/admin/categories/available`, () => {
          return HttpResponse.json({ message: "Forbidden" }, { status: 403 });
        })
      );
      await expect(getAvailableCategories()).rejects.toThrow();
      expect(forbidden).toHaveBeenCalled();
    });

    it("should handle validation errors", async () => {
      const invalidData = { invalid: "data" };
      server.use(
        http.get(`${serverAddress}/admin/categories/available`, () => {
          return HttpResponse.json(invalidData, { status: 200 });
        })
      );

      await expect(getAvailableCategories()).rejects.toThrow(
        CATEGORY_ERROR_MESSAGES.INVALID_DATA_TYPE
      );
    });
  });
});
