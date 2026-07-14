const DAY_MS = 24 * 60 * 60 * 1000;

export type BookingTaskDueDateInput = {
  eventDate?: Date | string | null;
  requestedDueDate?: Date | string | null;
  dueOffsetDays?: number | null;
  orderIndex: number;
  taskCount: number;
  now?: Date;
};

function validDate(value: Date | string | null | undefined) {
  if (!value) return null;
  const parsed = value instanceof Date ? new Date(value) : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function manilaEventDeadline(value: Date | string) {
  const date = validDate(value);

  if (!date) return null;

  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    15,
    59,
    59,
    999,
  ));
}

export function calculateBookingTaskDueDate(input: BookingTaskDueDateInput) {
  const now = validDate(input.now) ?? new Date();
  const earliestOperationalDate = new Date(now.getTime() + DAY_MS);
  const eventDeadline = input.eventDate ? manilaEventDeadline(input.eventDate) : null;
  const requestedDueDate = validDate(input.requestedDueDate);
  let dueDate: Date;

  if (eventDeadline && Number.isInteger(input.dueOffsetDays) && Number(input.dueOffsetDays) >= 0) {
    dueDate = new Date(eventDeadline.getTime() - Number(input.dueOffsetDays) * DAY_MS);
  } else if (eventDeadline) {
    const availableMs = Math.max(eventDeadline.getTime() - earliestOperationalDate.getTime(), 0);
    const position = Math.min(Math.max(input.orderIndex, 1), Math.max(input.taskCount, 1));
    dueDate = new Date(
      earliestOperationalDate.getTime() + availableMs * (position / Math.max(input.taskCount, 1)),
    );
  } else if (requestedDueDate) {
    dueDate = requestedDueDate;
  } else {
    dueDate = new Date(earliestOperationalDate.getTime() + Math.max(input.orderIndex - 1, 0) * DAY_MS);
  }

  if (eventDeadline && dueDate > eventDeadline) {
    dueDate = eventDeadline;
  }

  const isHighRisk = dueDate < earliestOperationalDate;

  if (isHighRisk) {
    dueDate = eventDeadline && eventDeadline < earliestOperationalDate
      ? eventDeadline
      : earliestOperationalDate;
  }

  return {
    dueDate,
    isHighRisk,
    eventDeadline,
  };
}
