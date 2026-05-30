import { Request, Response } from "express";
import { Role, ExpenseStatus } from "@app/types";
import { getOrgRole, requireOrgRole } from "../lib/orgRole";
import { canTransition } from "../lib/stateMachine";
import {
  createExpense,
  findExpenseById,
  updateExpense,
  submitExpense,
  approveExpense,
  rejectExpense,
  resubmitExpense,
  listExpenses,
} from "../lib/expense.lib";

export const createExpenseHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const authUserId = req.headers["x-user-id"] as string;

  if (!authUserId) {
    res.status(401).json({ error: "Missing identity header" });
    return;
  }

  const { orgId, title, description, amount, currency, receiptS3Key } =
    req.body;

  if (!orgId || !title || !amount) {
    res.status(400).json({ error: "orgId, title and amount are required" });
    return;
  }

  try {
    const role = await getOrgRole(authUserId, orgId);
    if (!role) {
      res
        .status(403)
        .json({ error: "You are not a member of this organisation" });
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
    console.error("Create expense error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateExpenseHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const authUserId = req.headers["x-user-id"] as string;

  if (!authUserId) {
    res.status(401).json({ error: "Missing identity header" });
    return;
  }

  const { id } = req.params;

  try {
    const expense = await findExpenseById(id);
    if (!expense) {
      res.status(404).json({ error: "Expense not found" });
      return;
    }

    if (expense.submittedBy !== authUserId) {
      res
        .status(403)
        .json({ error: "Only the submitter can edit this expense" });
      return;
    }

    if (
      expense.status !== ExpenseStatus.DRAFT &&
      expense.status !== ExpenseStatus.REJECTED
    ) {
      res
        .status(400)
        .json({ error: "Only DRAFT or REJECTED expenses can be edited" });
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
    console.error("Update expense error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const submitExpenseHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const authUserId = req.headers["x-user-id"] as string;
  if (!authUserId) {
    res.status(401).json({ error: "Missing identity header" });
    return;
  }

  try {
    const expense = await findExpenseById(req.params.id);
    if (!expense) {
      res.status(404).json({ error: "Expense not found" });
      return;
    }
    if (expense.submittedBy !== authUserId) {
      res
        .status(403)
        .json({ error: "Only the submitter can submit this expense" });
      return;
    }
    if (
      !canTransition(expense.status as ExpenseStatus, ExpenseStatus.PENDING)
    ) {
      res.status(400).json({
        error: `Cannot submit an expense with status ${expense.status}`,
      });
      return;
    }
    res.status(200).json(await submitExpense(expense.id));
  } catch (err) {
    console.error("Submit expense error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const approveExpenseHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const authUserId = req.headers["x-user-id"] as string;
  if (!authUserId) {
    res.status(401).json({ error: "Missing identity header" });
    return;
  }

  try {
    const expense = await findExpenseById(req.params.id);
    if (!expense) {
      res.status(404).json({ error: "Expense not found" });
      return;
    }

    await requireOrgRole(authUserId, expense.orgId, [Role.OWNER, Role.MANAGER]);

    if (
      !canTransition(expense.status as ExpenseStatus, ExpenseStatus.APPROVED)
    ) {
      res.status(400).json({
        error: `Cannot approve an expense with status ${expense.status}`,
      });
      return;
    }
    if (expense.submittedBy === authUserId) {
      res.status(403).json({ error: "You cannot approve your own expense" });
      return;
    }

    res.status(200).json(await approveExpense(expense.id, authUserId));
  } catch (err: any) {
    if (err.message === "NOT_MEMBER") {
      res
        .status(403)
        .json({ error: "You are not a member of this organisation" });
      return;
    }
    if (err.message === "INSUFFICIENT_ROLE") {
      res
        .status(403)
        .json({ error: "Only MANAGER or OWNER can approve expenses" });
      return;
    }
    console.error("Approve expense error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const rejectExpenseHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const authUserId = req.headers["x-user-id"] as string;
  if (!authUserId) {
    res.status(401).json({ error: "Missing identity header" });
    return;
  }

  const { reason } = req.body;
  if (!reason?.trim()) {
    res.status(400).json({ error: "Rejection reason is required" });
    return;
  }

  try {
    const expense = await findExpenseById(req.params.id);
    if (!expense) {
      res.status(404).json({ error: "Expense not found" });
      return;
    }

    await requireOrgRole(authUserId, expense.orgId, [Role.OWNER, Role.MANAGER]);

    if (
      !canTransition(expense.status as ExpenseStatus, ExpenseStatus.REJECTED)
    ) {
      res.status(400).json({
        error: `Cannot reject an expense with status ${expense.status}`,
      });
      return;
    }

    res.status(200).json(await rejectExpense(expense.id, authUserId, reason));
  } catch (err: any) {
    if (err.message === "NOT_MEMBER") {
      res
        .status(403)
        .json({ error: "You are not a member of this organisation" });
      return;
    }
    if (err.message === "INSUFFICIENT_ROLE") {
      res
        .status(403)
        .json({ error: "Only MANAGER or OWNER can reject expenses" });
      return;
    }
    console.error("Reject expense error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const resubmitExpenseHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const authUserId = req.headers["x-user-id"] as string;
  if (!authUserId) {
    res.status(401).json({ error: "Missing identity header" });
    return;
  }

  try {
    const expense = await findExpenseById(req.params.id);
    if (!expense) {
      res.status(404).json({ error: "Expense not found" });
      return;
    }
    if (expense.submittedBy !== authUserId) {
      res
        .status(403)
        .json({ error: "Only the submitter can resubmit this expense" });
      return;
    }
    if (!canTransition(expense.status as ExpenseStatus, ExpenseStatus.DRAFT)) {
      res.status(400).json({
        error: `Cannot resubmit an expense with status ${expense.status}`,
      });
      return;
    }
    res.status(200).json(await resubmitExpense(expense.id));
  } catch (err) {
    console.error("Resubmit expense error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const listExpensesHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const authUserId = req.headers["x-user-id"] as string;
  if (!authUserId) {
    res.status(401).json({ error: "Missing identity header" });
    return;
  }

  const { orgId, status, submittedBy, cursor, limit } = req.query as Record<
    string,
    string
  >;
  if (!orgId) {
    res.status(400).json({ error: "orgId query parameter is required" });
    return;
  }

  try {
    const role = await getOrgRole(authUserId, orgId);
    if (!role) {
      res
        .status(403)
        .json({ error: "You are not a member of this organisation" });
      return;
    }

    const result = await listExpenses({
      orgId,
      status,
      submittedBy: role === Role.EMPLOYEE ? authUserId : submittedBy,
      cursor,
      limit: limit ? parseInt(limit, 10) : undefined,
    });

    res.status(200).json(result);
  } catch (err) {
    console.error("List expenses error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getExpenseHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const authUserId = req.headers["x-user-id"] as string;
  if (!authUserId) {
    res.status(401).json({ error: "Missing identity header" });
    return;
  }

  try {
    const expense = await findExpenseById(req.params.id);
    if (!expense) {
      res.status(404).json({ error: "Expense not found" });
      return;
    }

    const role = await getOrgRole(authUserId, expense.orgId);
    if (!role) {
      res
        .status(403)
        .json({ error: "You are not a member of this organisation" });
      return;
    }

    if (role === Role.EMPLOYEE && expense.submittedBy !== authUserId) {
      res
        .status(403)
        .json({ error: "Employees can only view their own expenses" });
      return;
    }

    res.status(200).json(expense);
  } catch (err) {
    console.error("Get expense error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
