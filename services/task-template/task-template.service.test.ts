import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  normalizeCategoryKey,
  generateUniqueCategoryKey,
  taskTemplateKeyForCategory,
} from '@/services/event-category/category-key.service';
import {
  calculateBookingTaskDueDate,
  manilaEventDeadline,
} from '@/services/booking-orchestration/booking-task-snapshot.service';
import { taskTemplatePublishValidationErrors } from '@/services/task-template/task-template-domain';

describe('event category keys', () => {
  it('creates stable underscore keys using the documented normalization rules', () => {
    assert.equal(normalizeCategoryKey('  Baby & Family  Shower! '), 'baby_and_family_shower');
    assert.equal(normalizeCategoryKey('Corporate---Seminar'), 'corporate_seminar');
    assert.equal(taskTemplateKeyForCategory('baby_shower'), 'baby_shower_standard');
  });

  it('uses the first available numeric suffix deterministically', async () => {
    const db = {
      eventCategory: {
        findMany: async () => [
          { categoryKey: 'baby_shower' },
          { categoryKey: 'baby_shower_2' },
          { categoryKey: 'baby_shower_4' },
        ],
      },
    };

    assert.equal(await generateUniqueCategoryKey('Baby Shower', db as never), 'baby_shower_3');
  });
});

describe('template publish validation', () => {
  it('accepts a contiguous valid draft and rejects invalid publication data', () => {
    assert.deepEqual(taskTemplatePublishValidationErrors({
      status: 'DRAFT',
      items: [
        { orderIndex: 1, title: 'Review booking', priority: 'high', assignedToRole: 'ADMIN' },
        { orderIndex: 2, title: 'Confirm details', priority: 'medium', assignedToRole: 'SUPERADMIN' },
      ],
    }), []);

    const errors = taskTemplatePublishValidationErrors({
      status: 'PUBLISHED',
      items: [
        { orderIndex: 2, title: '', priority: 'unknown', assignedToRole: 'CLIENT' },
        { orderIndex: 2, title: 'Duplicate order', priority: 'high', assignedToRole: 'ADMIN' },
      ],
    });

    assert.ok(errors.includes('Template status must be DRAFT.'));
    assert.ok(errors.includes('Task order values must be unique.'));
    assert.ok(errors.includes('Task order must be contiguous and start at 1.'));
  });
});

describe('booking task due dates', () => {
  it('interprets due offsets as days before the Manila event deadline', () => {
    const result = calculateBookingTaskDueDate({
      eventDate: '2026-08-10',
      dueOffsetDays: 7,
      orderIndex: 1,
      taskCount: 3,
      now: new Date('2026-07-01T00:00:00.000Z'),
    });

    assert.equal(manilaEventDeadline('2026-08-10')?.toISOString(), '2026-08-10T15:59:59.999Z');
    assert.equal(result.dueDate.toISOString(), '2026-08-03T15:59:59.999Z');
    assert.equal(result.isHighRisk, false);
  });

  it('flags past calculations and chooses the earliest operational date', () => {
    const result = calculateBookingTaskDueDate({
      eventDate: '2026-07-13',
      dueOffsetDays: 7,
      orderIndex: 1,
      taskCount: 1,
      now: new Date('2026-07-12T00:00:00.000Z'),
    });

    assert.equal(result.isHighRisk, true);
    assert.equal(result.dueDate.toISOString(), '2026-07-13T00:00:00.000Z');
  });

  it('uses safe daily deadlines when the event date is unavailable', () => {
    const result = calculateBookingTaskDueDate({
      eventDate: null,
      dueOffsetDays: null,
      orderIndex: 3,
      taskCount: 5,
      now: new Date('2026-07-12T00:00:00.000Z'),
    });

    assert.equal(result.dueDate.toISOString(), '2026-07-15T00:00:00.000Z');
  });
});
