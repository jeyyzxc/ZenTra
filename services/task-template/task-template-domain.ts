const VALID_PRIORITIES = new Set(['low', 'medium', 'high', 'critical']);
const VALID_ASSIGNED_ROLES = new Set(['ADMIN', 'SUPERADMIN']);

export type PublishableTemplateInput = {
  status: string;
  items: Array<{
    orderIndex: number;
    title: string;
    priority: string;
    assignedToRole: string;
  }>;
};

export function taskTemplatePublishValidationErrors(template: PublishableTemplateInput) {
  const errors: string[] = [];

  if (template.status !== 'DRAFT') {
    errors.push('Template status must be DRAFT.');
  }

  if (template.items.length === 0) {
    errors.push('A template must contain at least one task before publishing.');
    return errors;
  }

  const orders = new Set<number>();

  template.items.forEach((item, index) => {
    if (!item.title.trim()) errors.push(`Task ${index + 1} title is required.`);
    if (!VALID_PRIORITIES.has(item.priority.trim().toLowerCase())) {
      errors.push(`Task ${index + 1} priority is invalid.`);
    }
    if (!VALID_ASSIGNED_ROLES.has(item.assignedToRole.trim().toUpperCase())) {
      errors.push(`Task ${index + 1} assigned role is invalid.`);
    }
    if (!Number.isInteger(item.orderIndex) || item.orderIndex < 1) {
      errors.push(`Task ${index + 1} order is invalid.`);
    } else if (orders.has(item.orderIndex)) {
      errors.push('Task order values must be unique.');
    }
    orders.add(item.orderIndex);
  });

  if (template.items.some((_, index) => !orders.has(index + 1))) {
    errors.push('Task order must be contiguous and start at 1.');
  }

  return [...new Set(errors)];
}
