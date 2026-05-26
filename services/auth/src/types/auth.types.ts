import { z } from 'zod';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
} from '../schemas/auth.schemas';

export type RegisterRequest = z.infer<typeof registerSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type RefreshRequest = z.infer<typeof refreshSchema>;
export type LogoutRequest = z.infer<typeof logoutSchema>;

export type TokenPayload = {
  sub: string;
  email: string;
};
