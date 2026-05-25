export enum Role {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
}

export enum ExpenseStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export type ExpenseApprovedEvent = {
  eventId: string;
  type: 'EXPENSE_APPROVED';
  expenseId: string;
  submittedBy: string;
  orgId: string;
  amount: string;
  currency: string;
  occurredAt: string;
};

export type ExpenseRejectedEvent = {
  eventId: string;
  type: 'EXPENSE_REJECTED';
  expenseId: string;
  submittedBy: string;
  orgId: string;
  reason: string;
  occurredAt: string;
};

export type UserInvitedEvent = {
  eventId: string;
  type: 'USER_INVITED';
  email: string;
  orgId: string;
  orgName: string;
  role: Role;
  inviteToken: string;
  occurredAt: string;
};

export type AppEvent = ExpenseApprovedEvent | ExpenseRejectedEvent | UserInvitedEvent;
