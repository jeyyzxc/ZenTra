'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// --- TASK LISTS ---

export async function getTaskLists() {
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
  const count = await prisma.taskList.count();
  const list = await prisma.taskList.create({
    data: {
      name,
      order: count,
    }
  });
  revalidatePath('/admin/calendar');
  return list;
}

// --- TASKS ---

export async function getTasks(listId?: string) {
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
  const task = await prisma.task.create({
    data
  });
  revalidatePath('/admin/calendar');
  return task;
}

export async function toggleTask(id: string, completed: boolean) {
  const task = await prisma.task.update({
    where: { id },
    data: { completed }
  });
  revalidatePath('/admin/calendar');
  return task;
}

export async function deleteTask(id: string) {
  await prisma.task.delete({
    where: { id }
  });
  revalidatePath('/admin/calendar');
}

export async function deleteCompletedTasks() {
  await prisma.task.deleteMany({
    where: { completed: true }
  });
  revalidatePath('/admin/calendar');
}
