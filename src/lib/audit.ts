import { addToStore } from '@/lib/db';

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'export'
  | 'import';

interface LogAuditParams {
  companyId: string;
  userId: string;
  userEmail: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

/**
 * Fire-and-forget audit logger.
 * Call without await — errors are caught and logged but never thrown.
 */
export function logAudit(params: LogAuditParams): void {
  const record = {
    id: crypto.randomUUID(),
    company_id: params.companyId || null,
    user_id: params.userId || null,
    user_email: params.userEmail,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    details: params.details ?? null,
    ip_address: params.ipAddress ?? null,
    created_at: new Date().toISOString(),
  };

  addToStore('audit_log', record).catch((err) => {
    console.error('[audit] Failed to write audit log:', err);
  });
}
