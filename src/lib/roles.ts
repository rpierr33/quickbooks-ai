/**
 * Role definitions and permission helpers for Ledgr.
 *
 * Roles (in ascending privilege order):
 *   viewer → accountant → editor → admin → owner
 *
 * The '*' wildcard means all permissions granted.
 */

export type UserRole = 'owner' | 'admin' | 'editor' | 'viewer' | 'accountant';

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  owner: ['*'],
  admin: [
    'read',
    'write',
    'delete',
    'manage_users',
    'view_reports',
    'manage_settings',
  ],
  editor: ['read', 'write', 'view_reports'],
  viewer: ['read', 'view_reports'],
  accountant: [
    'read',
    'view_reports',
    'write_journal_entries',
    'write_reconciliation',
  ],
};

/**
 * Check whether a role has a specific permission.
 * The owner role ('*') passes every check.
 */
export function hasPermission(role: UserRole, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[role] ?? [];
  return perms.includes('*') || perms.includes(permission);
}

/** Can this role create or update regular financial records (not journal entries). */
export function canWrite(role: UserRole): boolean {
  return hasPermission(role, 'write');
}

/** Can this role delete records. */
export function canDelete(role: UserRole): boolean {
  return hasPermission(role, 'delete');
}

/** Can this role manage team members / user invites. */
export function canManageUsers(role: UserRole): boolean {
  return hasPermission(role, 'manage_users');
}

/** Can this role access settings (company info, integrations). */
export function canManageSettings(role: UserRole): boolean {
  return hasPermission(role, 'manage_settings');
}

/**
 * Returns the roles that a given role is allowed to assign to others.
 * An owner can assign any role. An admin can assign editor / viewer / accountant.
 * Editor and below cannot manage users.
 */
export function assignableRoles(role: UserRole): UserRole[] {
  switch (role) {
    case 'owner':
      return ['owner', 'admin', 'editor', 'viewer', 'accountant'];
    case 'admin':
      return ['editor', 'viewer', 'accountant'];
    default:
      return [];
  }
}

/** Human-readable label for each role. */
export const ROLE_LABELS: Record<UserRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  editor: 'Editor',
  viewer: 'Viewer',
  accountant: 'Accountant',
};

/** Ordered list of all roles, used for rendering dropdowns. */
export const ALL_ROLES: UserRole[] = [
  'owner',
  'admin',
  'editor',
  'viewer',
  'accountant',
];
