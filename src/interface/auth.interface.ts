export interface SessionPayload {
  id?: string;
  user_id: string;
  userName: string;
  email: string;
  role: string;
  isAdmin?: boolean;
}
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}
