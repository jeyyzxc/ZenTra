import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ContentType } from '@prisma/client';
import { validateContentPayload } from './content-schema';
import { chunkKnowledgeText } from '@/services/smart-assistant/knowledge.service';
import { normalizeEmbedding } from '@/services/smart-assistant/provider';
import { templateTaskContentHash } from '@/services/task-template/task-content';

describe('structured public content', () => {
  it('accepts validated policy blocks and rejects unsafe links', () => {
    const payload = validateContentPayload(ContentType.RULES, {
      title: 'Venue Rules',
      summary: 'Reviewed guidance.',
      blocks: [
        { type: 'heading', level: 2, text: 'Guest safety' },
        { type: 'list', items: ['Keep exits clear.'] },
        { type: 'link', label: 'Contact us', href: '/contact' },
      ],
    });
    assert.equal(payload.title, 'Venue Rules');
    assert.throws(() => validateContentPayload(ContentType.PRIVACY, {
      title: 'Privacy',
      blocks: [{ type: 'link', label: 'Unsafe', href: 'javascript:alert(1)' }],
    }), /safe HTTP/);
  });
});

describe('knowledge indexing primitives', () => {
  it('chunks long text with bounded overlap while preserving headings', () => {
    const text = `# Booking Guidance\n\n${'Verified booking information. '.repeat(240)}`;
    const chunks = chunkKnowledgeText(text);
    assert.ok(chunks.length > 1);
    assert.equal(chunks[0].heading, 'Booking Guidance');
    assert.ok(chunks.every((chunk) => chunk.content.length <= 2_500));
  });

  it('L2-normalizes only the configured embedding dimension', () => {
    const values = Array.from({ length: 768 }, (_, index) => index === 0 ? 3 : index === 1 ? 4 : 0);
    const normalized = normalizeEmbedding(values);
    assert.equal(normalized[0], 0.6);
    assert.equal(normalized[1], 0.8);
    assert.throws(() => normalizeEmbedding([1, 2]), /768 finite values|dimension/);
  });
});

describe('stable task-template identity', () => {
  it('keeps the content hash stable across cloned versions and changes it for edited content', () => {
    const input = {
      itemKey: 'confirm-client-details',
      title: 'Confirm client details',
      description: 'Review the booking form.',
      priority: 'high',
      assignedToRole: 'ADMIN',
      category: 'booking',
      dueOffsetDays: 14,
    };
    assert.equal(templateTaskContentHash(input), templateTaskContentHash({ ...input }));
    assert.notEqual(templateTaskContentHash(input), templateTaskContentHash({ ...input, title: 'Confirm final client details' }));
  });
});
