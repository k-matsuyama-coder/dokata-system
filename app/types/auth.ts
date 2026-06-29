export type UserRole = "worker" | "admin";

const ROLE_LEVEL: Record<UserRole, number> = {
  worker: 1,
  admin: 2,
};

export const hasRole = (
  currentRole: string | null | undefined,
  requiredRole: UserRole
) => {
  if (!currentRole) return false;

  if (currentRole !== "worker" && currentRole !== "admin") {
    return false;
  }

  const currentLevel = ROLE_LEVEL[currentRole];
  const requiredLevel = ROLE_LEVEL[requiredRole];

  return currentLevel >= requiredLevel;
};

export const isAdminRole = (role?: string | null) => {
  return hasRole(role, "admin");
};