import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { describe, it } from 'node:test';
import {
  DashboardTaskPriority,
  DashboardTaskSource,
  DashboardTaskStatus,
  Prisma,
  Role,
  TaskTemplateStatus,
} from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { DashboardService } from '@/lib/dashboard-service';
import {
  bootstrapCategoryTemplate,
  cloneTaskTemplateVersion,
  GENERAL_EVENT_TEMPLATE_KEY,
  recordTemplateFallback,
  resolvePublishedTaskTemplate,
} from '@/services/task-template';
import {
  enforceOrchestrationRateLimit,
  getTaskTemplateForOrchestration,
  orchestrationRateLimitIdentity,
  updateBookingEmailStatus,
} from '@/services/booking-orchestration';

class ExpectedRollback extends Error {}

describe('task template database lifecycle', () => {
  it('bootstraps, falls back, publishes a new version, and preserves task snapshots', async () => {
    await assert.rejects(
      prisma.$transaction(async (transaction) => {
        const suffix = randomUUID().replace(/-/g, '').slice(0, 12);
        const categoryKey = `integration_event_${suffix}`;
        const category = await transaction.eventCategory.create({
          data: {
            name: `Integration Event ${suffix}`,
            slug: `integration-event-${suffix}`,
            categoryKey,
            status: 'ACTIVE',
            clientVisible: false,
          },
        });
        const draft = await bootstrapCategoryTemplate({
          db: transaction,
          eventCategoryId: category.id,
          categoryName: category.name,
          categoryKey,
        });
        const general = await transaction.taskTemplate.findFirstOrThrow({
          where: {
            templateKey: GENERAL_EVENT_TEMPLATE_KEY,
            status: TaskTemplateStatus.PUBLISHED,
            isActive: true,
          },
          include: { items: true },
        });

        assert.equal(draft.status, TaskTemplateStatus.DRAFT);
        assert.equal(draft.isActive, false);
        assert.equal(draft.items.length, general.items.length);
        assert.match(draft.items[0].title, /Integration Event/);

        const fallback = await resolvePublishedTaskTemplate(draft.templateKey, transaction);
        assert.equal(fallback.templateKey, GENERAL_EVENT_TEMPLATE_KEY);
        assert.equal(fallback.templateFallbackUsed, true);
        await recordTemplateFallback({
          db: transaction,
          bookingId: `integration-booking-${suffix}`,
          bookingReference: `INTEGRATION-FALLBACK-${suffix}`,
          eventCategoryKey: categoryKey,
          requestedTemplateKey: draft.templateKey,
          appliedTemplateKey: fallback.templateKey,
        });
        const fallbackNotification = await transaction.notification.findFirstOrThrow({
          where: { relatedRecordId: `integration-booking-${suffix}` },
        });
        assert.equal(fallbackNotification.createdFor, null);

        const versionOne = await transaction.taskTemplate.update({
          where: { id: draft.id },
          data: {
            status: TaskTemplateStatus.PUBLISHED,
            isActive: true,
            publishedAt: new Date(),
          },
          include: { items: { orderBy: { orderIndex: 'asc' } } },
        });
        const direct = await resolvePublishedTaskTemplate(draft.templateKey, transaction);
        assert.equal(direct.taskTemplateId, versionOne.id);
        assert.equal(direct.templateFallbackUsed, false);

        const copiedTask = await transaction.dashboardTask.create({
          data: {
            title: versionOne.items[0].title,
            description: versionOne.items[0].description,
            taskDate: new Date('2026-12-01T15:59:59.000Z'),
            priority: DashboardTaskPriority.HIGH,
            status: DashboardTaskStatus.PENDING,
            assignedToRole: 'ADMIN',
            relatedModule: 'bookings',
            relatedRecordId: `integration-booking-${suffix}`,
            bookingReference: `INTEGRATION-${suffix}`,
            category: versionOne.items[0].category,
            source: DashboardTaskSource.N8N_WORKFLOW,
            workflowName: 'Integration Test',
            workflowExecutionId: `integration-execution-${suffix}`,
            orderIndex: versionOne.items[0].orderIndex,
            taskTemplateId: versionOne.id,
            taskTemplateKey: versionOne.templateKey,
            taskTemplateVersion: versionOne.version,
            templateItemId: versionOne.items[0].id,
            templateSnapshot: {
              taskTemplateId: versionOne.id,
              taskTemplateKey: versionOne.templateKey,
              taskTemplateVersion: versionOne.version,
              templateItemId: versionOne.items[0].id,
              title: versionOne.items[0].title,
            } satisfies Prisma.InputJsonObject,
            activationStatus: 'pending_booking_approval',
            isActive: false,
            isEditable: true,
          },
        });

        await transaction.taskTemplate.update({
          where: { id: versionOne.id },
          data: { isActive: false },
        });
        const versionTwoDraft = await transaction.taskTemplate.create({
          data: {
            eventCategoryId: category.id,
            templateKey: versionOne.templateKey,
            name: versionOne.name,
            description: versionOne.description,
            version: 2,
            status: TaskTemplateStatus.DRAFT,
            isActive: false,
            sourceTemplateId: versionOne.id,
            items: {
              create: versionOne.items.map((item) => ({
                orderIndex: item.orderIndex,
                title: item.orderIndex === 1 ? `${item.title} version two` : item.title,
                description: item.description,
                priority: item.priority,
                assignedToRole: item.assignedToRole,
                isRequired: item.isRequired,
                dueOffsetDays: item.dueOffsetDays,
                category: item.category,
              })),
            },
          },
        });
        const versionTwo = await transaction.taskTemplate.update({
          where: { id: versionTwoDraft.id },
          data: {
            status: TaskTemplateStatus.PUBLISHED,
            isActive: true,
            publishedAt: new Date(),
          },
        });
        const latest = await resolvePublishedTaskTemplate(versionOne.templateKey, transaction);
        const persistedTask = await transaction.dashboardTask.findUniqueOrThrow({
          where: { id: copiedTask.id },
        });
        const activeCount = await transaction.taskTemplate.count({
          where: {
            templateKey: versionOne.templateKey,
            status: TaskTemplateStatus.PUBLISHED,
            isActive: true,
          },
        });

        assert.equal(latest.taskTemplateId, versionTwo.id);
        assert.equal(latest.taskTemplateVersion, 2);
        assert.equal(activeCount, 1);
        assert.equal(persistedTask.taskTemplateId, versionOne.id);
        assert.equal(persistedTask.taskTemplateVersion, 1);
        assert.equal((persistedTask.templateSnapshot as Prisma.JsonObject).title, versionOne.items[0].title);

        throw new ExpectedRollback('Rollback integration test data.');
      }),
      ExpectedRollback,
    );
  });

  it('returns existing task IDs on retry without creating duplicates', async () => {
    const suffix = randomUUID().replace(/-/g, '').slice(0, 12);
    const bookingReference = `INTEGRATION-IDEMPOTENCY-${suffix}`;
    let bookingId: string | null = null;

    try {
      const template = await prisma.taskTemplate.findFirstOrThrow({
        where: {
          templateKey: GENERAL_EVENT_TEMPLATE_KEY,
          status: TaskTemplateStatus.PUBLISHED,
          isActive: true,
        },
        include: { items: { orderBy: { orderIndex: 'asc' }, take: 2 } },
      });
      const booking = await prisma.booking.create({
        data: {
          bookingReference,
          clientName: 'Integration Test Client',
          eventTitle: 'Integration Idempotency Event',
          eventType: 'Integration Event',
          eventDate: new Date('2027-12-20T00:00:00.000Z'),
          venue: 'Zion Events Place',
          orchestrationContext: {
            create: {
              bookingReference,
              eventCategory: 'Integration Event',
              eventCategoryKey: 'integration_event',
              packageCategory: 'Integration Package',
              packageTier: 'standard',
              taskTemplateKey: template.templateKey,
              requestedTaskTemplateKey: template.templateKey,
              taskTemplateId: template.id,
              taskTemplateVersion: template.version,
              templateFallbackUsed: false,
              riskLevel: 'low',
            },
          },
        },
      });
      bookingId = booking.id;
      const payload = {
        relatedModule: 'booking',
        relatedRecordId: booking.id,
        bookingReference,
        source: 'n8n_workflow',
        workflowName: 'Zion - New Booking Orchestration',
        workflowExecutionId: `integration-execution-${suffix}`,
        categorization: {
          taskTemplateId: template.id,
          taskTemplateKey: template.templateKey,
          taskTemplateVersion: template.version,
        },
        tasks: template.items.map((item) => ({
          orderIndex: item.orderIndex,
          title: item.title,
          description: item.description || item.title,
          priority: item.priority,
          status: 'pending',
          activationStatus: 'pending_booking_approval',
          isActive: false,
          isEditable: true,
          category: item.category || 'operations',
          dueDate: '2027-12-01T15:59:59.000Z',
          assignedToRole: item.assignedToRole,
          taskTemplateId: template.id,
          taskTemplateKey: template.templateKey,
          taskTemplateVersion: template.version,
          templateItemId: item.id,
        })),
      };

      const first = await DashboardService.bulkCreateAdminTodoList(payload);
      const retry = await DashboardService.bulkCreateAdminTodoList(payload);
      const persisted = await prisma.dashboardTask.findMany({
        where: { relatedRecordId: booking.id },
        orderBy: { orderIndex: 'asc' },
      });

      assert.equal(first.createdCount, template.items.length);
      assert.equal(first.existingCount, 0);
      assert.equal(retry.createdCount, 0);
      assert.equal(retry.existingCount, template.items.length);
      assert.equal(retry.duplicateCount, template.items.length);
      assert.deepEqual(new Set(retry.taskIds), new Set(first.taskIds));
      assert.equal(persisted.length, template.items.length);
      assert.ok(persisted.every((task) => task.templateSnapshot !== null));
      assert.ok(persisted.every((task) => task.isActive === false));
    } finally {
      if (bookingId) {
        await prisma.dashboardTask.deleteMany({ where: { relatedRecordId: bookingId } });
        await prisma.notification.deleteMany({ where: { relatedRecordId: bookingId } });
        await prisma.booking.deleteMany({ where: { id: bookingId } });
      }
      await prisma.auditLog.deleteMany({
        where: {
          metadata: { path: ['bookingReference'], equals: bookingReference },
        },
      });
    }
  });

  it('rejects a mismatched booking reference before changing email status', async () => {
    const suffix = randomUUID().replace(/-/g, '').slice(0, 12);
    const bookingReference = `INTEGRATION-SECURITY-${suffix}`;
    const booking = await prisma.booking.create({
      data: {
        bookingReference,
        clientName: 'Integration Security Client',
        eventTitle: 'Integration Security Event',
        eventType: 'Integration Event',
        eventDate: new Date('2027-12-20T00:00:00.000Z'),
        venue: 'Zion Events Place',
      },
    });

    try {
      await assert.rejects(
        updateBookingEmailStatus({
          bookingId: booking.id,
          bookingReference: `${bookingReference}-WRONG`,
          emailStatus: 'sent',
          emailType: 'booking_receipt',
          workflowExecutionId: `integration-execution-${suffix}`,
        }),
        (error: unknown) => (
          error instanceof Error &&
          'status' in error &&
          (error as Error & { status: number }).status === 403
        ),
      );
      const unchanged = await prisma.booking.findUniqueOrThrow({ where: { id: booking.id } });
      assert.equal(unchanged.emailStatus, 'pending');
      assert.equal(unchanged.emailType, null);
    } finally {
      await prisma.booking.deleteMany({ where: { id: booking.id } });
    }
  });

  it('enforces the database-backed protected endpoint request limit', async () => {
    const suffix = randomUUID().replace(/-/g, '').slice(0, 12);
    const scope = `integration-rate-limit-${suffix}`;
    const request = new Request('http://localhost/api/orchestration/test', {
      headers: {
        'x-forwarded-for': `198.51.100.${Number.parseInt(suffix.slice(0, 2), 16) % 200 + 1}`,
        'x-zion-source': 'n8n',
        'x-zion-workflow': 'Zion - New Booking Orchestration',
      },
    });

    try {
      const first = await enforceOrchestrationRateLimit({ request, scope, limit: 2 });
      const second = await enforceOrchestrationRateLimit({ request, scope, limit: 2 });
      assert.equal(first.remaining, 1);
      assert.equal(second.remaining, 0);
      await assert.rejects(
        enforceOrchestrationRateLimit({ request, scope, limit: 2 }),
        (error: unknown) => (
          error instanceof Error &&
          'status' in error &&
          (error as Error & { status: number }).status === 429
        ),
      );
    } finally {
      await prisma.orchestrationRateLimit.deleteMany({ where: { scope } });
    }
  });

  it('rejects protected template reads with invalid secrets or booking references', async () => {
    const workflowHeaders = {
      'x-forwarded-for': '203.0.113.245',
      'x-zion-source': 'n8n',
      'x-zion-workflow': 'Zion - New Booking Orchestration',
      'x-zion-booking-reference': `MISSING-${randomUUID()}`,
    };
    await assert.rejects(
      getTaskTemplateForOrchestration({
        request: new Request('http://localhost/api/orchestration/task-templates/general_event_standard', {
          headers: workflowHeaders,
        }),
        requestedTemplateKey: GENERAL_EVENT_TEMPLATE_KEY,
      }),
      (error: unknown) => (
        error instanceof Error &&
        'status' in error &&
        (error as Error & { status: number }).status === 401
      ),
    );

    assert.ok(process.env.BACKEND_ORCHESTRATION_SECRET);
    const validSecretRequest = new Request(
      'http://localhost/api/orchestration/task-templates/general_event_standard',
      {
        headers: {
          ...workflowHeaders,
          'x-n8n-secret': process.env.BACKEND_ORCHESTRATION_SECRET!,
        },
      },
    );

    try {
      await assert.rejects(
        getTaskTemplateForOrchestration({
          request: validSecretRequest,
          requestedTemplateKey: GENERAL_EVENT_TEMPLATE_KEY,
        }),
        (error: unknown) => (
          error instanceof Error &&
          'status' in error &&
          (error as Error & { status: number }).status === 404
        ),
      );
    } finally {
      await prisma.orchestrationRateLimit.deleteMany({
        where: {
          scope: 'task-template-read',
          clientKey: orchestrationRateLimitIdentity(validSecretRequest, 'task-template-read'),
        },
      });
    }
  });

  it('serializes concurrent version cloning into one draft version', async () => {
    const suffix = randomUUID().replace(/-/g, '').slice(0, 12);
    const templateKey = `integration_concurrent_${suffix}_standard`;
    const category = await prisma.eventCategory.create({
      data: {
        name: `Integration Concurrent ${suffix}`,
        slug: `integration-concurrent-${suffix}`,
        categoryKey: `integration_concurrent_${suffix}`,
        status: 'ACTIVE',
        clientVisible: false,
      },
    });
    const draft = await prisma.taskTemplate.create({
      data: {
        eventCategoryId: category.id,
        templateKey,
        name: 'Integration Concurrent Template',
        version: 1,
        status: TaskTemplateStatus.DRAFT,
        isActive: false,
        items: {
          create: {
            orderIndex: 1,
            title: 'Integration task',
            priority: 'high',
            assignedToRole: 'ADMIN',
            isRequired: true,
          },
        },
      },
    });
    const published = await prisma.taskTemplate.update({
      where: { id: draft.id },
      data: {
        status: TaskTemplateStatus.PUBLISHED,
        isActive: true,
        publishedAt: new Date(),
      },
    });
    const actor = {
      id: `integration-actor-${suffix}`,
      username: `integration-${suffix}`,
      email: `integration-${suffix}@example.test`,
      profileImage: null,
      role: Role.SUPERADMIN,
      fullName: 'Integration Test',
    } as const;

    try {
      const [first, second] = await Promise.all([
        cloneTaskTemplateVersion(published.id, actor),
        cloneTaskTemplateVersion(published.id, actor),
      ]);
      const drafts = await prisma.taskTemplate.findMany({
        where: { templateKey, status: TaskTemplateStatus.DRAFT },
      });

      assert.equal(first.id, second.id);
      assert.equal(first.version, 2);
      assert.equal(drafts.length, 1);
    } finally {
      await prisma.taskTemplate.updateMany({
        where: { eventCategoryId: category.id },
        data: { status: TaskTemplateStatus.ARCHIVED, isActive: false },
      });
      await prisma.taskTemplate.deleteMany({ where: { eventCategoryId: category.id } });
      await prisma.eventCategory.deleteMany({ where: { id: category.id } });
      await prisma.auditLog.deleteMany({
        where: { metadata: { path: ['taskTemplateKey'], equals: templateKey } },
      });
    }
  });

  it('enforces published definition immutability in PostgreSQL', async () => {
    const suffix = randomUUID().replace(/-/g, '').slice(0, 12);
    const category = await prisma.eventCategory.create({
      data: {
        name: `Integration Immutable ${suffix}`,
        slug: `integration-immutable-${suffix}`,
        categoryKey: `integration_immutable_${suffix}`,
        status: 'ACTIVE',
        clientVisible: false,
      },
    });
    const draft = await prisma.taskTemplate.create({
      data: {
        eventCategoryId: category.id,
        templateKey: `integration_immutable_${suffix}_standard`,
        name: 'Immutable Integration Template',
        version: 1,
        status: TaskTemplateStatus.DRAFT,
        isActive: false,
        items: {
          create: {
            orderIndex: 1,
            title: 'Immutable integration task',
            priority: 'high',
            assignedToRole: 'ADMIN',
          },
        },
      },
      include: { items: true },
    });
    const published = await prisma.taskTemplate.update({
      where: { id: draft.id },
      data: {
        status: TaskTemplateStatus.PUBLISHED,
        isActive: true,
        publishedAt: new Date(),
      },
      include: { items: true },
    });

    try {
      await assert.rejects(prisma.taskTemplate.update({
        where: { id: published.id },
        data: { name: 'Forbidden changed name' },
      }));
      await assert.rejects(prisma.taskTemplateItem.update({
        where: { id: published.items[0].id },
        data: { title: 'Forbidden changed title' },
      }));
      const unchanged = await prisma.taskTemplate.findUniqueOrThrow({
        where: { id: published.id },
        include: { items: true },
      });

      assert.equal(unchanged.name, 'Immutable Integration Template');
      assert.equal(unchanged.items[0].title, 'Immutable integration task');
    } finally {
      await prisma.taskTemplate.update({
        where: { id: published.id },
        data: { status: TaskTemplateStatus.ARCHIVED, isActive: false },
      });
      await prisma.taskTemplate.delete({ where: { id: published.id } });
      await prisma.eventCategory.delete({ where: { id: category.id } });
    }
  });
});
