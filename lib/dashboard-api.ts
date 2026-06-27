import { NextResponse } from 'next/server';
import { DashboardServiceError } from '@/lib/dashboard-service';

export function dashboardSuccess<T>(data: T, message = 'Dashboard data loaded successfully.') {
  return NextResponse.json({
    success: true,
    data,
    generated_at: new Date().toISOString(),
    message,
  });
}

export function dashboardCreated<T>(data: T, message: string) {
  return NextResponse.json({
    success: true,
    data,
    generated_at: new Date().toISOString(),
    message,
  }, { status: 201 });
}

export function dashboardError(error: unknown, fallback = 'Unable to load dashboard data.') {
  if (error instanceof DashboardServiceError) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: error.status });
  }

  if (
    error instanceof Error &&
    'status' in error &&
    typeof (error as Error & { status?: unknown }).status === 'number'
  ) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: (error as Error & { status: number }).status });
  }

  if (error instanceof Error && error.message.startsWith('Unauthorized')) {
    return NextResponse.json({
      success: false,
      error: 'Forbidden',
    }, { status: 403 });
  }

  return NextResponse.json({
    success: false,
    error: fallback,
    details: error instanceof Error ? error.message : undefined,
  }, { status: 500 });
}
