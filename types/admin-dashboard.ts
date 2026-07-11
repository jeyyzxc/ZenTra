export type AdminDashboardMetrics = {
  totalBookings: number;
  upcomingEvents: number;
  pendingPayments: number;
  openTasks: number;
};

export type BookingActivityPoint = {
  month: string;
  label: string;
  bookings: number;
  confirmed: number;
  pending: number;
};

export type UpcomingEvent = {
  id: string;
  title: string;
  eventType: string;
  clientName: string;
  date: string;
  time: string | null;
  venue: string;
  status: string;
  href: string;
};

export type AdminTaskItem = {
  id: string;
  title: string;
  relatedLabel: string;
  dueDate: string;
  dueTime: string | null;
  priority: string;
  status: string;
  category: string | null;
  href: string;
  orderIndex: number;
  taskTemplateKey: string | null;
  activationStatus: string | null;
  isActive: boolean;
  isEditable: boolean;
  canComplete: boolean;
};

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  isRead: boolean;
  createdAt: string;
  href: string;
};

export type PaymentActivityItem = {
  id: string;
  title: string;
  description: string;
  amount: number | null;
  createdAt: string;
  href: string;
};

export type PaymentSummary = {
  totalCollected: number;
  pendingPayments: number;
  overduePayments: number;
  recentActivity: PaymentActivityItem[];
};

export type WorkflowIssue = {
  id: string;
  title: string;
  message: string;
  type: 'workflow' | 'email';
  priority: 'high' | 'critical';
  createdAt: string;
  href: string;
};

export type WorkflowHealth = {
  status: 'healthy' | 'warning' | 'failed' | 'no_recent_activity';
  statusLabel: string;
  lastSuccessfulBookingWorkflow: string | null;
  failedWorkflows: number;
  emailDeliveryStatus: 'healthy' | 'warning' | 'failed' | 'no_recent_activity';
  emailDeliveryLabel: string;
  recentIssues: WorkflowIssue[];
};

export type OperationsSummary = {
  greeting: string;
  currentDate: string;
  summary: string;
  priorityAction: string;
};

export type AdminDashboardData = {
  generatedAt: string;
  operationsSummary: OperationsSummary;
  metrics: AdminDashboardMetrics;
  bookingActivity: BookingActivityPoint[];
  upcomingEvents: UpcomingEvent[];
  taskSummary: AdminTaskItem[];
  recentNotifications: NotificationItem[];
  paymentSummary: PaymentSummary;
  workflowHealth: WorkflowHealth;
};
