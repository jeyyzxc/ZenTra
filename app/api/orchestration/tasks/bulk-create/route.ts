import { NextResponse } from 'next/server';
import { AuditAction, AuditStatus } from '@prisma/client';
import {
  requireBookingOrchestrationKey,
  enforceOrchestrationRateLimit,
  requireN8nWorkflowHeaders,
} from '@/services/booking-orchestration';
import {
  DashboardService,
  type AdminTodoBulkCreateInput,
} from '@/lib/dashboard-service';
import { createAuditLog, errorMetadata, systemAuditActor } from '@/lib/audit';

export const dynamic = 'force-dynamic';

function jsonError(error: string, status: number) {
  return NextResponse.json({
    success: false,
    error,
  }, { status });
}

function methodNotAllowed() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed.',
  }, {
    status: 405,
    headers: { Allow: 'POST' },
  });
}

async function readJsonBody(request: Request): Promise<AdminTodoBulkCreateInput> {
  try {
    const body = await request.json() as unknown;

    if (typeof body === 'string' && body.trim()) {
      return JSON.parse(body) as AdminTodoBulkCreateInput;
    }

    if (body && typeof body === 'object' && !Array.isArray(body)) {
      return body as AdminTodoBulkCreateInput;
    }
  } catch {
    const error = new Error('Invalid JSON body.') as Error & { status: number };
    error.status = 400;
    throw error;
  }

  const error = new Error('Invalid JSON body.') as Error & { status: number };
  error.status = 400;
  throw error;
}

export async function POST(request: Request) {
  try {
    requireBookingOrchestrationKey(request);
    requireN8nWorkflowHeaders(request);

    const body = await readJsonBody(request);
    const bookingReferenceHeader = request.headers.get('x-zion-booking-reference')?.trim();

    if (!bookingReferenceHeader) {
      const error = new Error('Missing booking reference header.') as Error & { status: number };
      error.status = 400;
      throw error;
    }

    if (typeof body.bookingReference !== 'string' || body.bookingReference.trim() !== bookingReferenceHeader) {
      const error = new Error('Booking reference header does not match the request body.') as Error & { status: number };
      error.status = 403;
      throw error;
    }

    await enforceOrchestrationRateLimit({
      request,
      scope: 'booking-task-bulk-create',
    });

    const data = await DashboardService.bulkCreateAdminTodoList(body);

    return NextResponse.json({
      success: true,
      message: 'Admin To-Do List created successfully.',
      data: {
        createdCount: data.createdCount,
        existingCount: data.existingCount,
        duplicateCount: data.duplicateCount,
        bookingReference: data.bookingReference,
        taskIds: data.taskIds,
      },
    }, { status: data.createdCount > 0 ? 201 : 200 });
  } catch (error) {
    await createAuditLog({
      ...systemAuditActor(),
      action: AuditAction.ERROR,
      module: 'Dashboard',
      description: 'Booking task-list creation failed.',
      status: AuditStatus.FAILED,
      metadata: {
        event: 'BOOKING_TASK_LIST_CREATION_FAILED',
        bookingReference: request.headers.get('x-zion-booking-reference'),
        ...errorMetadata(error),
      },
    });

    if (
      error instanceof Error &&
      'status' in error &&
      typeof (error as Error & { status?: unknown }).status === 'number'
    ) {
      const status = (error as Error & { status: number }).status;

      console.error(
        `Bulk create admin To-Do list request failed. status=${status} error="${error.message}"`,
      );

      return jsonError(error.message, status);
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorName = error instanceof Error ? error.name : 'UnknownError';
    const errorCode = typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code)
      : 'unknown';

    console.error(
      `Failed to bulk create admin To-Do list. name=${errorName} code=${errorCode} error="${errorMessage}"`,
    );

    return jsonError('Failed to bulk create admin To-Do list.', 500);
  }
}

export const GET = methodNotAllowed;
export const PUT = methodNotAllowed;
export const PATCH = methodNotAllowed;
export const DELETE = methodNotAllowed;
