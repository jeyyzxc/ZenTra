'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { EventStatus } from '@prisma/client';

export async function getEvents() {
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
  const event = await prisma.event.create({
    data
  });
  revalidatePath('/admin/calendar');
  return event;
}

export async function updateEvent(id: string, data: any) {
  const event = await prisma.event.update({
    where: { id },
    data
  });
  revalidatePath('/admin/calendar');
  return event;
}

export async function deleteEvent(id: string) {
  await prisma.event.delete({
    where: { id }
  });
  revalidatePath('/admin/calendar');
}
