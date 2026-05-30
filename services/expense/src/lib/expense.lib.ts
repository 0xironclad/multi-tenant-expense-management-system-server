import { eq } from 'drizzle-orm';
import { db, expenses } from '../db';

export const createExpense = async (data: {
  orgId: string;
  submittedBy: string;
  title: string;
  description?: string;
  amount: string;
  currency?: string;
  receiptS3Key?: string;
}) => {
  const [expense] = await db
    .insert(expenses)
    .values({
      orgId: data.orgId,
      submittedBy: data.submittedBy,
      title: data.title,
      description: data.description,
      amount: data.amount,
      currency: data.currency ?? 'USD',
      receiptS3Key: data.receiptS3Key,
    })
    .returning();
  return expense;
};

export const findExpenseById = async (id: string) => {
  const [expense] = await db.select().from(expenses).where(eq(expenses.id, id));
  return expense ?? null;
};

export const updateExpense = async (
  id: string,
  data: {
    title?: string;
    description?: string;
    amount?: string;
    currency?: string;
    receiptS3Key?: string;
  },
) => {
  const [expense] = await db
    .update(expenses)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(expenses.id, id))
    .returning();
  return expense;
};
