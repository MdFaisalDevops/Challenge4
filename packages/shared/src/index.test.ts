import { UserRole } from './index';

describe('Shared package checks', () => {
  it('should export expected roles', () => {
    const roles: UserRole[] = ['OpsDirector', 'SecurityLead', 'FieldAgent', 'Guest'];
    expect(roles).toContain('OpsDirector');
    expect(roles).toContain('Guest');
  });
});
