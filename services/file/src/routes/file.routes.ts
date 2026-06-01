import { Router } from 'express';
import { uploadUrlHandler, downloadUrlHandler } from '../controllers/file.controller';

const router = Router();

router.post('/upload-url', uploadUrlHandler);
router.post('/download-url', downloadUrlHandler);

export default router;
