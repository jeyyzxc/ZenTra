'use server';

import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/authorization';
import { revalidatePath } from 'next/cache';
import { EventStatus, Prisma } from '@prisma/client';

export async function getEvents() {
  await requireSuperAdmin();
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
  await requireSuperAdmin();

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
  revalidatePath('/admin/calendar');
  return event;
}

export async function updateEvent(id: string, data: Prisma.EventUpdateInput) {
  await requireSuperAdmin();
  const event = await prisma.event.update({
    where: { id },
    data
  });
  revalidatePath('/admin/calendar');
  return event;
}

export async function deleteEvent(id: string) {
  await requireSuperAdmin();
  await prisma.event.delete({
    where: { id }
  });
  revalidatePath('/admin/calendar');
}
