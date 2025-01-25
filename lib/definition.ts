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
