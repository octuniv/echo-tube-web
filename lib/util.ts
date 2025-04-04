import * as dotenv from "dotenv";
import { PostDto, UserAuthInfo, UserRole } from "./definition";

dotenv.config();

export const serverAddress = `${process.env.SERVER_ADDRESS}`;

export const baseCookieOptions = {
  httpOnly: true,
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  domain: "localhost",
};

export function isRoleHigherThan(
  userRole: UserRole,
  requiredRole: UserRole
): boolean {
  const roleHierarchy: UserRole[] = [
    UserRole.USER,
    UserRole.BOT,
    UserRole.ADMIN,
  ];
  return roleHierarchy.indexOf(userRole) > roleHierarchy.indexOf(requiredRole);
}

function isValidUser(
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
  post: PostDto;
}): boolean => {
  if (!isValidUser(user)) return false;

  return (
    user.nickname === post.nickname ||
    isRoleHigherThan(user.role, post.board.requireRole)
  );
};
