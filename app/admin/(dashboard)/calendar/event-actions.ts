'use server';

import { AuditAction, AuditStatus, EventStatus, Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { auditActor, createAuditLog, errorMetadata } from '@/lib/audit';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/authorization';

async function logEventFailure(
  actor: Awaited<ReturnType<typeof requireAdmin>>,
  action: AuditAction,
  description: string,
  error: unknown,
  metadata?: Record<string, unknown>,
) {
  await createAuditLog({
    ...auditActor(actor),
    action,
    module: 'Bookings',
    description,
    status: AuditStatus.FAILED,
    metadata: {
      ...metadata,
      ...errorMetadata(error),
    },
  });
}

export async function getEvents() {
  await requireAdmin();
  return await prisma.event.findMany({
    orderBy: { date: 'asc' },
  });
}

export async function createEvent(data: {
  title: string;
  clientName: string;
  date: Date;
  startTime?: string;
  endTime?: string;
  status?: EventStatus;
  eventType: string;
  venue: string;
  pax: number;
  notes?: string;
}) {
  const actor = await requireAdmin();

  try {
    if (!data.title.trim() || !data.clientName.trim() || !data.eventType.trim() || !data.venue.trim()) {
      throw new Error('Title, client, event type, and venue are required.');
    }

    if (!Number.isInteger(data.pax) || data.pax < 1) {
      throw new Error('Guest count must be a positive whole number.');
    }

    const event = await prisma.event.create({
      data: {
        ...data,
        title: data.title.trim(),
        clientName: data.clientName.trim(),
        eventType: data.eventType.trim(),
        venue: data.venue.trim(),
      }
    });

    await createAuditLog({
      ...auditActor(actor),
      action: AuditAction.CREATE,
      module: 'Bookings',
      description: `Created booking/event "${event.title}" for ${event.clientName}.`,
      status: AuditStatus.SUCCESS,
      newValues: event,
      metadata: {
        eventId: event.id,
      },
    });

    revalidatePath('/admin/calendar');
    return event;
  } catch (error) {
    await logEventFailure(
      actor,
      AuditAction.CREATE,
      'Failed to create a booking/event.',
      error,
      {
        title: data.title,
        clientName: data.clientName,
        eventType: data.eventType,
      },
    );
    throw error;
  }
}

export async function updateEvent(id: string, data: Prisma.EventUpdateInput) {
  const actor = await requireAdmin();

  try {
    const previous = await prisma.event.findUnique({
      where: { id },
    });

    if (!previous) {
      throw new Error('The selected booking/event no longer exists.');
    }

    const event = await prisma.event.update({
      where: { id },
      data
    });

    await createAuditLog({
      ...auditActor(actor),
      action: AuditAction.UPDATE,
      module: 'Bookings',
      description: `Updated booking/event "${event.title}".`,
      status: AuditStatus.SUCCESS,
      previousValues: previous,
      newValues: event,
      metadata: {
        eventId: event.id,
      },
    });

    revalidatePath('/admin/calendar');
    return event;
  } catch (error) {
    await logEventFailure(
      actor,
      AuditAction.UPDATE,
      'Failed to update a booking/event.',
      error,
      {
        eventId: id,
      },
    );
    throw error;
  }
}

export async function deleteEvent(id: string) {
  const actor = await requireAdmin();

  try {
    const previous = await prisma.event.findUnique({
      where: { id },
    });

    if (!previous) {
      throw new Error('The selected booking/event no longer exists.');
    }

    await prisma.event.delete({
      where: { id }
    });

    await createAuditLog({
      ...auditActor(actor),
      action: AuditAction.DELETE,
      module: 'Bookings',
      description: `Deleted booking/event "${previous.title}".`,
      status: AuditStatus.SUCCESS,
      previousValues: previous,
      metadata: {
        eventId: id,
      },
    });

    revalidatePath('/admin/calendar');
  } catch (error) {
    await logEventFailure(
      actor,
      AuditAction.DELETE,
      'Failed to delete a booking/event.',
      error,
      {
        eventId: id,
      },
    );
    throw error;
  }
}
