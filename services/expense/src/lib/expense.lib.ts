import { and, desc, eq, lt } from "drizzle-orm";
import { db, expenses } from "../db";

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
      currency: data.currency ?? "USD",
      receiptS3Key: data.receiptS3Key,
    })
    .returning();
  return expense;
};

export const findExpenseById = async (id: string) => {
  const [expense] = await db.select().from(expenses).where(eq(expenses.id, id));
  return expense ?? null;
};

export const submitExpense = async (id: string) => {
  const [expense] = await db
    .update(expenses)
    .set({ status: "PENDING", submittedAt: new Date(), updatedAt: new Date() })
    .where(eq(expenses.id, id))
    .returning();
  return expense;
};

export const approveExpense = async (id: string, reviewedBy: string) => {
  const [expense] = await db
    .update(expenses)
    .set({
      status: "APPROVED",
      reviewedBy,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(expenses.id, id))
    .returning();
  return expense;
};

export const rejectExpense = async (
  id: string,
  reviewedBy: string,
  reason: string,
) => {
  const [expense] = await db
    .update(expenses)
    .set({
      status: "REJECTED",
      reviewedBy,
      reviewedAt: new Date(),
      rejectionReason: reason,
      updatedAt: new Date(),
    })
    .where(eq(expenses.id, id))
    .returning();
  return expense;
};

export const resubmitExpense = async (id: string) => {
  const [expense] = await db
    .update(expenses)
    .set({
      status: "DRAFT",
      submittedAt: null,
      reviewedBy: null,
      reviewedAt: null,
      rejectionReason: null,
      updatedAt: new Date(),
    })
    .where(eq(expenses.id, id))
    .returning();
  return expense;
};

export const listExpenses = async (options: {
  orgId: string;
  submittedBy?: string;
  status?: string;
  cursor?: string;
  limit?: number;
}) => {
  const limit = options.limit ?? 20;
  const conditions = [eq(expenses.orgId, options.orgId)];

  if (options.submittedBy)
    conditions.push(eq(expenses.submittedBy, options.submittedBy));
  if (options.status) conditions.push(eq(expenses.status, options.status));
  if (options.cursor)
    conditions.push(lt(expenses.createdAt, new Date(options.cursor)));

  const rows = await db
    .select()
    .from(expenses)
    .where(and(...conditions))
    .orderBy(desc(expenses.createdAt))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore
    ? (items[items.length - 1].createdAt?.toISOString() ?? null)
    : null;

  return { items, nextCursor };
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
