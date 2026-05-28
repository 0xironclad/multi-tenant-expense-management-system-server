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

export enum EventType {
  EXPENSE_APPROVED = 'EXPENSE_APPROVED',
  EXPENSE_REJECTED = 'EXPENSE_REJECTED',
  USER_INVITED = 'USER_INVITED',
}

export type ExpenseApprovedEvent = {
  eventId: string;
  type: EventType.EXPENSE_APPROVED;
  expenseId: string;
  submittedBy: string;
  orgId: string;
  amount: string;
  currency: string;
  occurredAt: string;
};

export type ExpenseRejectedEvent = {
  eventId: string;
  type: EventType.EXPENSE_REJECTED;
  expenseId: string;
  submittedBy: string;
  orgId: string;
  reason: string;
  occurredAt: string;
};

export type UserInvitedEvent = {
  eventId: string;
  type: EventType.USER_INVITED;
  email: string;
  orgId: string;
  orgName: string;
  role: Role;
  inviteToken: string;
  occurredAt: string;
};

export type AppEvent = ExpenseApprovedEvent | ExpenseRejectedEvent | UserInvitedEvent;
