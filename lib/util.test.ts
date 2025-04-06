import { PostDto, UserAuthInfo, UserRole } from "./definition";
import { canModifyPost } from "./util";

describe("canModifyPost", () => {
  it("should return false if user are not the owner and you are not authorized to do so ", () => {
    const user: UserAuthInfo = {
      nickname: "test",
      role: UserRole.USER,
      name: "Test User",
      email: "test@example.com",
    };
    const post = {
      nickname: "other",
      board: { requiredRole: UserRole.USER },
    } as PostDto;

    expect(canModifyPost({ user, post })).toBe(false);
  });

  it("should return true if user has higher role", () => {
    const user: UserAuthInfo = {
      nickname: "admin",
      role: UserRole.ADMIN,
      name: "Admin",
      email: "admin@example.com",
    };
    const post = {
      nickname: "user",
      board: { requiredRole: UserRole.USER },
    } as PostDto;

    expect(canModifyPost({ user, post })).toBe(true);
  });
});
