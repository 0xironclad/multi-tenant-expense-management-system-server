import { Router } from 'express';
import { createUserProfile, getMyProfile } from '../controllers/user.controller';

const router = Router();

router.post('/profile', createUserProfile);
router.get('/me', getMyProfile);

export default router;
