'use server';

import { AuditAction, AuditStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { auditActor, createAuditLog, errorMetadata } from '@/lib/audit';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/authorization';

// --- TASK LISTS ---

async function logCalendarFailure(
  actor: Awaited<ReturnType<typeof requireAdmin>>,
  action: AuditAction,
  description: string,
  error: unknown,
  metadata?: Record<string, unknown>,
) {
  await createAuditLog({
    ...auditActor(actor),
    action,
    module: 'Calendar',
    description,
    status: AuditStatus.FAILED,
    metadata: {
      ...metadata,
      ...errorMetadata(error),
    },
  });
}

export async function getTaskLists() {
  await requireAdmin();
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
  const actor = await requireAdmin();

  try {
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

    await createAuditLog({
      ...auditActor(actor),
      action: AuditAction.CREATE,
      module: 'Calendar',
      description: `Created calendar task list "${list.name}".`,
      status: AuditStatus.SUCCESS,
      newValues: list,
      metadata: {
        taskListId: list.id,
      },
    });

    revalidatePath('/admin/calendar');
    return list;
  } catch (error) {
    await logCalendarFailure(
      actor,
      AuditAction.CREATE,
      'Failed to create a calendar task list.',
      error,
      { name },
    );
    throw error;
  }
}

// --- TASKS ---

export async function getTasks(listId?: string) {
  await requireAdmin();
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
  const actor = await requireAdmin();

  try {
    if (!data.title.trim()) {
      throw new Error('Task title is required.');
    }

    const task = await prisma.task.create({
      data: {
        ...data,
        title: data.title.trim(),
      }
    });

    await createAuditLog({
      ...auditActor(actor),
      action: AuditAction.CREATE,
      module: 'Calendar',
      description: `Created calendar task "${task.title}".`,
      status: AuditStatus.SUCCESS,
      newValues: task,
      metadata: {
        taskId: task.id,
        taskListId: task.listId,
      },
    });

    revalidatePath('/admin/calendar');
    return task;
  } catch (error) {
    await logCalendarFailure(
      actor,
      AuditAction.CREATE,
      'Failed to create a calendar task.',
      error,
      {
        title: data.title,
        listId: data.listId,
      },
    );
    throw error;
  }
}

export async function toggleTask(id: string, completed: boolean) {
  const actor = await requireAdmin();

  try {
    const previous = await prisma.task.findUnique({
      where: { id },
    });

    if (!previous) {
      throw new Error('The selected task no longer exists.');
    }

    const task = await prisma.task.update({
      where: { id },
      data: { completed }
    });

    await createAuditLog({
      ...auditActor(actor),
      action: AuditAction.UPDATE,
      module: 'Calendar',
      description: `${completed ? 'Completed' : 'Reopened'} calendar task "${task.title}".`,
      status: AuditStatus.SUCCESS,
      previousValues: previous,
      newValues: task,
      metadata: {
        taskId: task.id,
      },
    });

    revalidatePath('/admin/calendar');
    return task;
  } catch (error) {
    await logCalendarFailure(
      actor,
      AuditAction.UPDATE,
      'Failed to update a calendar task completion state.',
      error,
      {
        taskId: id,
        completed,
      },
    );
    throw error;
  }
}

export async function deleteTask(id: string) {
  const actor = await requireAdmin();

  try {
    const previous = await prisma.task.findUnique({
      where: { id },
    });

    if (!previous) {
      throw new Error('The selected task no longer exists.');
    }

    await prisma.task.delete({
      where: { id }
    });

    await createAuditLog({
      ...auditActor(actor),
      action: AuditAction.DELETE,
      module: 'Calendar',
      description: `Deleted calendar task "${previous.title}".`,
      status: AuditStatus.SUCCESS,
      previousValues: previous,
      metadata: {
        taskId: id,
      },
    });

    revalidatePath('/admin/calendar');
  } catch (error) {
    await logCalendarFailure(
      actor,
      AuditAction.DELETE,
      'Failed to delete a calendar task.',
      error,
      {
        taskId: id,
      },
    );
    throw error;
  }
}

export async function deleteCompletedTasks() {
  const actor = await requireAdmin();

  try {
    const completedTasks = await prisma.task.findMany({
      where: { completed: true },
    });

    const result = await prisma.task.deleteMany({
      where: { completed: true }
    });

    await createAuditLog({
      ...auditActor(actor),
      action: AuditAction.DELETE,
      module: 'Calendar',
      description: `Deleted ${result.count} completed calendar task(s).`,
      status: AuditStatus.SUCCESS,
      previousValues: {
        tasks: completedTasks,
      },
      metadata: {
        deletedCount: result.count,
      },
    });

    revalidatePath('/admin/calendar');
  } catch (error) {
    await logCalendarFailure(
      actor,
      AuditAction.DELETE,
      'Failed to delete completed calendar tasks.',
      error,
    );
    throw error;
  }
}
