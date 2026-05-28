import { Router } from 'express';
import { createUserProfile } from '../controllers/user.controller';

const router = Router();

router.post('/profile', createUserProfile);

export default router;
