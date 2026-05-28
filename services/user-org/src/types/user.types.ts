import { z } from 'zod';
import { createProfileSchema } from '../schemas/user.schemas';

export type CreateProfileRequest = z.infer<typeof createProfileSchema>;
