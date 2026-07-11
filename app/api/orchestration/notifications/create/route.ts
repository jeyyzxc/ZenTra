import {
  requireBookingOrchestrationKey,
  requireN8nWorkflowHeaders,
} from '@/services/booking-orchestration';
import { dashboardCreated, dashboardError } from '@/lib/dashboard-api';
import { DashboardService, type NotificationInput } from '@/lib/dashboard-service';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    requireBookingOrchestrationKey(request);
    requireN8nWorkflowHeaders(request);
    const body = await request.json() as NotificationInput;
    const notification = await DashboardService.createNotification(body);

    return dashboardCreated({ id: notification.id }, 'Dashboard notification created successfully.');
  } catch (error) {
    return dashboardError(error, 'Unable to create dashboard notification.');
  }
}
