import { z } from "zod";
import { FormState } from "../commonSchemas";
import { BoardPurpose, UserRole } from "../enums";
import { BOARD_ERROR_MESSAGES } from "../../constants/board/errorMessage";

const SLUG_REGEX = /^[a-z0-9-]+$/;

export const AdminBoardResponseSchema = z.object({
  id: z.number().int(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  requiredRole: z.nativeEnum(UserRole),
  type: z.nativeEnum(BoardPurpose),
  categoryId: z.number().int(),
  categoryName: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable(),
});

export type AdminBoardResponse = z.infer<typeof AdminBoardResponseSchema>;

export const BoardFormSchema = z.object({
  slug: z
    .string()
    .min(1, BOARD_ERROR_MESSAGES.SLUG_REQUIRED)
    .regex(SLUG_REGEX, BOARD_ERROR_MESSAGES.INVALID_SLUG),
  name: z.string().nonempty(BOARD_ERROR_MESSAGES.NAME_REQUIRED),
  description: z.string().nullable(),
  requiredRole: z.nativeEnum(UserRole),
  type: z.nativeEnum(BoardPurpose),
  categoryId: z.number().int().positive(BOARD_ERROR_MESSAGES.INVALID_ID_TYPE),
});

export type BoardFormData = z.infer<typeof BoardFormSchema>;

export type BoardFormState = FormState<BoardFormData>;
