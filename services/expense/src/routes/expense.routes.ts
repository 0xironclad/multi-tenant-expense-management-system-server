import { Router } from 'express';
import { createExpenseHandler, updateExpenseHandler } from '../controllers/expense.controller';

const router = Router();

router.post('/', createExpenseHandler);
router.patch('/:id', updateExpenseHandler);

export default router;
