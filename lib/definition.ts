export interface User {
  name: string;
  email: string;
  password: string;
}

export interface UserState {
  errors?: {
    [key in keyof User]?: string[];
  };
  message?: string | null;
}

export type LoginInfo = Omit<User, "name">;

export interface LoginInfoState {
  errors?: {
    [key in keyof LoginInfo]?: string[];
  };
  message?: string | null;
}
