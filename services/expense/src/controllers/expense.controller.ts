import { Request, Response } from 'express';
import { getOrgRole } from '../lib/orgRole';
import { createExpense, findExpenseById, updateExpense } from '../lib/expense.lib';
import { ExpenseStatus } from '@app/types';

export const createExpenseHandler = async (req: Request, res: Response): Promise<void> => {
  const authUserId = req.headers['x-user-id'] as string;

  if (!authUserId) {
    res.status(401).json({ error: 'Missing identity header' });
    return;
  }

  const { orgId, title, description, amount, currency, receiptS3Key } = req.body;

  if (!orgId || !title || !amount) {
    res.status(400).json({ error: 'orgId, title and amount are required' });
    return;
  }

  try {
    const role = await getOrgRole(authUserId, orgId);
    if (!role) {
      res.status(403).json({ error: 'You are not a member of this organisation' });
      return;
    }

    const expense = await createExpense({
      orgId,
      submittedBy: authUserId,
      title,
      description,
      amount: String(amount),
      currency,
      receiptS3Key,
    });

    res.status(201).json(expense);
  } catch (err) {
    console.error('Create expense error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateExpenseHandler = async (req: Request, res: Response): Promise<void> => {
  const authUserId = req.headers['x-user-id'] as string;

  if (!authUserId) {
    res.status(401).json({ error: 'Missing identity header' });
    return;
  }

  const { id } = req.params;

  try {
    const expense = await findExpenseById(id);
    if (!expense) {
      res.status(404).json({ error: 'Expense not found' });
      return;
    }

    if (expense.submittedBy !== authUserId) {
      res.status(403).json({ error: 'Only the submitter can edit this expense' });
      return;
    }

    if (expense.status !== ExpenseStatus.DRAFT && expense.status !== ExpenseStatus.REJECTED) {
      res.status(400).json({ error: 'Only DRAFT or REJECTED expenses can be edited' });
      return;
    }

    const { title, description, amount, currency, receiptS3Key } = req.body;

    const updated = await updateExpense(id, {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(amount !== undefined && { amount: String(amount) }),
      ...(currency !== undefined && { currency }),
      ...(receiptS3Key !== undefined && { receiptS3Key }),
    });

    res.status(200).json(updated);
  } catch (err) {
    console.error('Update expense error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
