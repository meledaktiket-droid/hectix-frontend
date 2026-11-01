export const ADMIN_ROLES = ["super_admin", "admin", "staff"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  staff: "Staff",
};

export const STAFF_ROLES = new Set<string>(ADMIN_ROLES);

export function isAdminRole(role: string | undefined | null): role is AdminRole {
  return !!role && (ADMIN_ROLES as readonly string[]).includes(role);
}

export const canManageTeam = (r: string) => r === "super_admin";
export const canVerifyOrgs = (r: string) => r === "super_admin" || r === "admin";
export const canManagePayouts = (r: string) => r === "super_admin" || r === "admin";
export const canManageContent = (r: string) => isAdminRole(r);
