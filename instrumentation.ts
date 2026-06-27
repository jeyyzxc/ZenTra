import type { Instrumentation } from 'next';
import { assertNoPublicSecrets } from '@/lib/env';

export function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    assertNoPublicSecrets();
  }
}

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context,
) => {
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return;
  }

  const digest = typeof error === 'object' && error !== null && 'digest' in error
    ? (error as { digest?: string }).digest
    : undefined;

  const [
    { createAuditLog, errorMetadata, getRequestContextFromHeaders, systemAuditActor },
    { AuditAction, AuditStatus },
  ] = await Promise.all([
    import('@/lib/audit'),
    import('@prisma/client'),
  ]);

  await createAuditLog({
    ...systemAuditActor(),
    action: AuditAction.ERROR,
    module: 'System',
    description: `Unhandled ${context.routeType} error captured by Next.js instrumentation.`,
    status: AuditStatus.FAILED,
    ...getRequestContextFromHeaders(request.headers),
    metadata: {
      requestPath: request.path,
      requestMethod: request.method,
      routerKind: context.routerKind,
      routePath: context.routePath,
      routeType: context.routeType,
      renderSource: context.renderSource,
      revalidateReason: context.revalidateReason,
      digest,
      ...errorMetadata(error),
    },
  });
};
