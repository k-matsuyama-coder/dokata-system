export type UserRole = "worker" | "admin" | "super_admin";

const ROLE_LEVEL: Record<UserRole, number> = {
  worker: 1,
  admin: 2,
  super_admin: 3,
};

export const hasRole = (
  currentRole: string | null | undefined,
  requiredRole: UserRole
) => {
  if (!currentRole) return false;

  const currentLevel = ROLE_LEVEL[currentRole as UserRole];
  const requiredLevel = ROLE_LEVEL[requiredRole];

  if (!currentLevel) return false;

  return currentLevel >= requiredLevel;
};

export const isAdminRole = (role?: string | null) => {
  return hasRole(role, "admin");
};

export const isSuperAdminRole = (role?: string | null) => {
  return hasRole(role, "super_admin");
};