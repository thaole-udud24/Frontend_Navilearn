import { describe, expect, it } from 'vitest';
import { validateNewPassword } from './passwordRules';

describe('validateNewPassword', () => {
  it('accepts a different password of 8-64 characters that matches its confirmation', () => {
    expect(validateNewPassword('old-password', 'a new passphrase', 'a new passphrase')).toBeNull();
  });

  it('rejects too short and too long passwords', () => {
    expect(validateNewPassword('old', 'short', 'short')).toMatch(/tối thiểu 8/);
    expect(validateNewPassword('old', 'x'.repeat(65), 'x'.repeat(65))).toMatch(/tối đa 64/);
  });

  it('rejects a new password equal to the current one', () => {
    expect(validateNewPassword('same-password', 'same-password', 'same-password')).toMatch(/khác mật khẩu hiện tại/);
  });

  it('rejects a confirmation that does not match', () => {
    expect(validateNewPassword('old-password', 'brand-new-pass', 'brand-new-pasS')).toMatch(/không khớp/);
  });
});
