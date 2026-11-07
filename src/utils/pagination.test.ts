import { describe, expect, it } from 'vitest';
import { can } from '@/access';
import { ROLES } from '@/constants/enums';

describe('access.can', () => {
  it('student can manage own template items', () => {
    expect(can(ROLES.STUDENT, 'canManageOwnTemplateItems')).toBe(true);
  });

  it('admin can moderate template items, student cannot', () => {
    expect(can(ROLES.ADMIN, 'canModerateTemplateItems')).toBe(true);
    expect(can(ROLES.STUDENT, 'canModerateTemplateItems')).toBe(false);
  });

  it('returns false when role is undefined', () => {
    expect(can(undefined, 'canManageOwnTemplateItems')).toBe(false);
  });
});
