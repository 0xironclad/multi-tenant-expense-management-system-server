import { Router } from 'express';
import { register, login, refresh, logout, verify } from '../controllers/auth.controller';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/verify', verify);

export default router;
