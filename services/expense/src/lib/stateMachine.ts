import { ExpenseStatus } from '@app/types';

const VALID_TRANSITIONS: Record<ExpenseStatus, ExpenseStatus[]> = {
  [ExpenseStatus.DRAFT]:    [ExpenseStatus.PENDING],
  [ExpenseStatus.PENDING]:  [ExpenseStatus.APPROVED, ExpenseStatus.REJECTED],
  [ExpenseStatus.REJECTED]: [ExpenseStatus.DRAFT],
  [ExpenseStatus.APPROVED]: [],
};

export const canTransition = (from: ExpenseStatus, to: ExpenseStatus): boolean =>
  VALID_TRANSITIONS[from].includes(to);
