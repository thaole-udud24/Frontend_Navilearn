import { ROLES, type Role } from '@/constants/enums';

// Single source of role -> permission. UI and route guards both read from here.
export const ACCESS = {
  [ROLES.STUDENT]: {
    canManageOwnTemplateItems: true,
    canModerateTemplateItems: false,
    canManageOwnAccItems: true,
    canManageOwnAcfItems: true,
    canManageOwnAdpItems: true,
    canManageOwnAiaItems: true,
    canManageOwnAicItems: true,
    canManageOwnArpItems: true,
    canManageOwnAsmItems: true,
    canManageOwnBrlItems: true,
    canManageOwnDatItems: true,
    canManageOwnKnwItems: true,
    canManageOwnMonItems: true,
    canManageOwnMstItems: true,
    canManageOwnNtfItems: true,
    canManageOwnPlnItems: true,
    canManageOwnQbkItems: true,
    canManageOwnRbacItems: true,
    canManageOwnRevItems: true,
    canManageOwnRptItems: true,
    canManageOwnRskItems: true,
    canManageOwnSubItems: true,
    canManageOwnSupItems: true,
  },
  [ROLES.ADMIN]: {
    canManageOwnTemplateItems: false,
    canModerateTemplateItems: true,
    canModerateAccItems: true,
    canModerateAcfItems: true,
    canModerateAdpItems: true,
    canModerateAiaItems: true,
    canModerateAicItems: true,
    canModerateArpItems: true,
    canModerateAsmItems: true,
    canModerateBrlItems: true,
    canModerateDatItems: true,
    canModerateKnwItems: true,
    canModerateMonItems: true,
    canModerateMstItems: true,
    canModerateNtfItems: true,
    canModeratePlnItems: true,
    canModerateQbkItems: true,
    canModerateRbacItems: true,
    canModerateRevItems: true,
    canModerateRptItems: true,
    canModerateRskItems: true,
    canModerateSubItems: true,
    canModerateSupItems: true,
  },
} as const;

export type Permission = keyof (typeof ACCESS)[Role];

export function can(role: Role | undefined, permission: Permission): boolean {
  if (!role) return false;
  return Boolean(ACCESS[role]?.[permission]);
}
