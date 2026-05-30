import { Router } from 'express';
import {
  createExpenseHandler,
  updateExpenseHandler,
  submitExpenseHandler,
  approveExpenseHandler,
  rejectExpenseHandler,
  resubmitExpenseHandler,
  listExpensesHandler,
  getExpenseHandler,
} from '../controllers/expense.controller';

const router = Router();

router.post('/',                createExpenseHandler);
router.get('/',                 listExpensesHandler);
router.get('/:id',              getExpenseHandler);
router.patch('/:id',            updateExpenseHandler);
router.post('/:id/submit',      submitExpenseHandler);
router.post('/:id/approve',     approveExpenseHandler);
router.post('/:id/reject',      rejectExpenseHandler);
router.post('/:id/resubmit',    resubmitExpenseHandler);

export default router;
