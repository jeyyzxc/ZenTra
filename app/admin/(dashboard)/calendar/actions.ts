'use server';

import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/authorization';
import { revalidatePath } from 'next/cache';

// --- TASK LISTS ---

export async function getTaskLists() {
  await requireSuperAdmin();
  return await prisma.taskList.findMany({
    orderBy: { order: 'asc' },
    include: {
      _count: {
        select: { tasks: { where: { completed: false } } }
      }
    }
  });
}

export async function createTaskList(name: string) {
  await requireSuperAdmin();
  const normalizedName = name.trim();

  if (!normalizedName) {
    throw new Error('Task list name is required.');
  }

  const count = await prisma.taskList.count();
  const list = await prisma.taskList.create({
    data: {
      name: normalizedName,
      order: count,
    }
  });
  revalidatePath('/admin/calendar');
  return list;
}

// --- TASKS ---

export async function getTasks(listId?: string) {
  await requireSuperAdmin();
  return await prisma.task.findMany({
    where: listId ? { listId } : undefined,
    orderBy: { createdAt: 'desc' },
  });
}

export async function createTask(data: {
  title: string;
  details?: string;
  startDate?: Date;
  dueDate?: Date;
  dueTime?: string;
  hasAttachment?: boolean;
  listId?: string;
}) {
  await requireSuperAdmin();

  if (!data.title.trim()) {
    throw new Error('Task title is required.');
  }

  const task = await prisma.task.create({
    data: {
      ...data,
      title: data.title.trim(),
    }
  });
  revalidatePath('/admin/calendar');
  return task;
}

export async function toggleTask(id: string, completed: boolean) {
  await requireSuperAdmin();
  const task = await prisma.task.update({
    where: { id },
    data: { completed }
  });
  revalidatePath('/admin/calendar');
  return task;
}

export async function deleteTask(id: string) {
  await requireSuperAdmin();
  await prisma.task.delete({
    where: { id }
  });
  revalidatePath('/admin/calendar');
}

export async function deleteCompletedTasks() {
  await requireSuperAdmin();
  await prisma.task.deleteMany({
    where: { completed: true }
  });
  revalidatePath('/admin/calendar');
}
