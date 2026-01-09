import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import { Prisma } from '@/generated/prisma/client';
import type { AdminAction } from '@/generated/prisma/client';

/**
 * Centralized Audit Logging Service
 *
 * This service provides comprehensive audit logging for all administrative actions.
 * It captures detailed information including:
 * - Who performed the action (admin)
 * - What action was performed
 * - Who/what was affected (target)
 * - Previous and new state
 * - Request metadata (IP, user agent)
 * - Additional context via metadata
 */

export interface AuditLogParams {
  adminId: string;
  targetUserId?: string | null;
  action: AdminAction;
  description: string;
  previousValue?: Prisma.InputJsonValue | null;
  newValue?: Prisma.InputJsonValue | null;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Extracts request metadata (IP address and user agent) from headers
 */
export async function getRequestMetadata(): Promise<{
  ipAddress: string;
  userAgent: string;
}> {
  try {
    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';
    return { ipAddress, userAgent };
  } catch {
    return { ipAddress: 'unknown', userAgent: 'unknown' };
  }
}

/**
 * Creates an audit log entry in the database
 */
export async function createAuditLog(params: AuditLogParams): Promise<void> {
  const { ipAddress, userAgent } = await getRequestMetadata();

  await prisma.adminAuditLog.create({
    data: {
      adminId: params.adminId,
      targetUserId: params.targetUserId ?? null,
      action: params.action,
      description: params.description,
      previousValue: params.previousValue ?? Prisma.JsonNull,
      newValue: params.newValue ?? Prisma.JsonNull,
      ipAddress,
      userAgent,
      metadata: params.metadata ?? undefined,
    },
  });
}

/**
 * Creates an audit log entry with custom IP and user agent
 * Useful when headers are already extracted
 */
export async function createAuditLogWithMetadata(
  params: AuditLogParams,
  ipAddress: string,
  userAgent: string
): Promise<void> {
  await prisma.adminAuditLog.create({
    data: {
      adminId: params.adminId,
      targetUserId: params.targetUserId ?? null,
      action: params.action,
      description: params.description,
      previousValue: params.previousValue ?? Prisma.JsonNull,
      newValue: params.newValue ?? Prisma.JsonNull,
      ipAddress,
      userAgent,
      metadata: params.metadata ?? undefined,
    },
  });
}

/**
 * Action category classification for filtering and reporting
 */
export type ActionCategory =
  | 'user_management'
  | 'agent_operations'
  | 'phone_management'
  | 'system_config'
  | 'access_security'
  | 'compliance';

/**
 * Maps action types to their categories for filtering
 */
export function getActionCategory(action: AdminAction): ActionCategory {
  switch (action) {
    case 'USER_UPDATE':
    case 'USER_ROLE_CHANGE':
    case 'USER_STATUS_CHANGE':
    case 'USER_PASSWORD_RESET':
    case 'USER_CREDIT_ADJUST':
    case 'USER_DELETE':
    case 'BULK_STATUS_CHANGE':
    case 'BULK_ROLE_CHANGE':
    case 'BULK_DELETE':
      return 'user_management';

    case 'AGENT_CREATE':
    case 'AGENT_UPDATE':
    case 'AGENT_DELETE':
    case 'AGENT_TOGGLE_STATUS':
      return 'agent_operations';

    case 'PHONE_ASSIGN':
    case 'PHONE_RELEASE':
    case 'PHONE_SYNC':
      return 'phone_management';

    case 'SETTINGS_UPDATE':
      return 'system_config';

    case 'ADMIN_LOGIN':
    case 'ADMIN_LOGOUT':
    case 'ACCESS_DENIED':
      return 'access_security';

    case 'AUDIT_EXPORT':
    case 'COMPLIANCE_REPORT':
      return 'compliance';

    default:
      return 'system_config';
  }
}

/**
 * Get actions for a given category
 */
export function getActionsForCategory(category: ActionCategory): AdminAction[] {
  const categoryActions: Record<ActionCategory, AdminAction[]> = {
    user_management: [
      'USER_UPDATE',
      'USER_ROLE_CHANGE',
      'USER_STATUS_CHANGE',
      'USER_PASSWORD_RESET',
      'USER_CREDIT_ADJUST',
      'USER_DELETE',
      'BULK_STATUS_CHANGE',
      'BULK_ROLE_CHANGE',
      'BULK_DELETE',
    ],
    agent_operations: [
      'AGENT_CREATE',
      'AGENT_UPDATE',
      'AGENT_DELETE',
      'AGENT_TOGGLE_STATUS',
    ],
    phone_management: [
      'PHONE_ASSIGN',
      'PHONE_RELEASE',
      'PHONE_SYNC',
    ],
    system_config: [
      'SETTINGS_UPDATE',
    ],
    access_security: [
      'ADMIN_LOGIN',
      'ADMIN_LOGOUT',
      'ACCESS_DENIED',
    ],
    compliance: [
      'AUDIT_EXPORT',
      'COMPLIANCE_REPORT',
    ],
  };

  return categoryActions[category];
}

/**
 * Human-readable labels for action types
 */
export function getActionLabel(action: AdminAction): string {
  const labels: Record<AdminAction, string> = {
    USER_UPDATE: 'User Updated',
    USER_ROLE_CHANGE: 'Role Changed',
    USER_STATUS_CHANGE: 'Status Changed',
    USER_PASSWORD_RESET: 'Password Reset',
    USER_CREDIT_ADJUST: 'Credits Adjusted',
    USER_DELETE: 'User Deleted',
    BULK_STATUS_CHANGE: 'Bulk Status Change',
    BULK_ROLE_CHANGE: 'Bulk Role Change',
    BULK_DELETE: 'Bulk Delete',
    AGENT_CREATE: 'Agent Created',
    AGENT_UPDATE: 'Agent Updated',
    AGENT_DELETE: 'Agent Deleted',
    AGENT_TOGGLE_STATUS: 'Agent Status Toggled',
    PHONE_ASSIGN: 'Phone Assigned',
    PHONE_RELEASE: 'Phone Released',
    PHONE_SYNC: 'Phone Numbers Synced',
    SETTINGS_UPDATE: 'Settings Updated',
    ADMIN_LOGIN: 'Admin Login',
    ADMIN_LOGOUT: 'Admin Logout',
    ACCESS_DENIED: 'Access Denied',
    AUDIT_EXPORT: 'Audit Logs Exported',
    COMPLIANCE_REPORT: 'Compliance Report Generated',
  };

  return labels[action] || action;
}

/**
 * Human-readable labels for categories
 */
export function getCategoryLabel(category: ActionCategory): string {
  const labels: Record<ActionCategory, string> = {
    user_management: 'User Management',
    agent_operations: 'Agent Operations',
    phone_management: 'Phone Management',
    system_config: 'System Configuration',
    access_security: 'Access & Security',
    compliance: 'Compliance',
  };

  return labels[category];
}

/**
 * All action categories
 */
export const ACTION_CATEGORIES: ActionCategory[] = [
  'user_management',
  'agent_operations',
  'phone_management',
  'system_config',
  'access_security',
  'compliance',
];

/**
 * All action types for validation
 */
export const ALL_ADMIN_ACTIONS: AdminAction[] = [
  'USER_UPDATE',
  'USER_ROLE_CHANGE',
  'USER_STATUS_CHANGE',
  'USER_PASSWORD_RESET',
  'USER_CREDIT_ADJUST',
  'USER_DELETE',
  'BULK_STATUS_CHANGE',
  'BULK_ROLE_CHANGE',
  'BULK_DELETE',
  'AGENT_CREATE',
  'AGENT_UPDATE',
  'AGENT_DELETE',
  'AGENT_TOGGLE_STATUS',
  'PHONE_ASSIGN',
  'PHONE_RELEASE',
  'PHONE_SYNC',
  'SETTINGS_UPDATE',
  'ADMIN_LOGIN',
  'ADMIN_LOGOUT',
  'ACCESS_DENIED',
  'AUDIT_EXPORT',
  'COMPLIANCE_REPORT',
];
