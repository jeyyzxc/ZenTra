import { NextResponse } from 'next/server';
import { requireBookingOrchestrationKey } from '@/services/booking-orchestration';
import {
  DashboardService,
  type AdminTodoBulkCreateInput,
} from '@/lib/dashboard-service';

export const dynamic = 'force-dynamic';

const WORKFLOW_NAME = 'Zion - New Booking Orchestration';

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

function requireN8nHeaders(request: Request) {
  const source = request.headers.get('x-zion-source')?.trim().toLowerCase();
  const workflow = request.headers.get('x-zion-workflow')?.trim();

  if (source !== 'n8n') {
    const error = new Error('Invalid orchestration source.') as Error & { status: number };
    error.status = 401;
    throw error;
  }

  if (workflow !== WORKFLOW_NAME) {
    const error = new Error('Invalid orchestration workflow.') as Error & { status: number };
    error.status = 401;
    throw error;
  }
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
    requireN8nHeaders(request);

    const body = await readJsonBody(request);
    const data = await DashboardService.bulkCreateAdminTodoList(body);

    return NextResponse.json({
      success: true,
      message: 'Admin To-Do List created successfully.',
      data: {
        createdCount: data.createdCount,
        bookingReference: data.bookingReference,
      },
    }, { status: data.createdCount > 0 ? 201 : 200 });
  } catch (error) {
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
