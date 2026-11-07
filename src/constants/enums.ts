// Only two login roles exist in the BRD (2.3): STUDENT and ADMIN.
export const ROLES = {
  STUDENT: 'student',
  ADMIN: 'admin',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
