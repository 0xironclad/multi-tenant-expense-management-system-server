import { z } from 'zod';

export const createProfileSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});
