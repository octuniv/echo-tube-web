import * as dotenv from "dotenv";
import {
  BoardListItemDto,
  PostResponse,
  UserAuthInfo,
  UserRole,
} from "./definition";

dotenv.config();

export const serverAddress = `${process.env.SERVER_ADDRESS}`;

export const baseCookieOptions = {
  httpOnly: true,
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  domain: "localhost",
};

const roleHierarchy: UserRole[] = [UserRole.USER, UserRole.BOT, UserRole.ADMIN];

export function isRoleHigherThan(
  userRole: UserRole,
  requiredRole: UserRole
): boolean {
  return roleHierarchy.indexOf(userRole) > roleHierarchy.indexOf(requiredRole);
}

export function isRoleSufficient(
  userRole: UserRole,
  requiredRole: UserRole
): boolean {
  return roleHierarchy.indexOf(userRole) >= roleHierarchy.indexOf(requiredRole);
}

export function isValidUser(
  user: UserAuthInfo
): user is UserAuthInfo & { role: UserRole } {
  return (
    user.nickname.trim() !== "" &&
    user.role !== null &&
    Object.values(UserRole).includes(user.role)
  );
}

export const canModifyPost = ({
  user,
  post,
}: {
  user: UserAuthInfo;
  post: PostResponse;
}): boolean => {
  if (!isValidUser(user)) return false;

  return (
    user.nickname === post.nickname ||
    isRoleHigherThan(user.role, post.board.requiredRole)
  );
};

export const canCreatePost = ({
  user,
  board,
}: {
  user: UserAuthInfo;
  board: BoardListItemDto;
}): boolean => {
  if (!isValidUser(user)) return false;

  return isRoleSufficient(user.role, board.requiredRole);
};
