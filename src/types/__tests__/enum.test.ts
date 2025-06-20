import { UserRole, VerificationStatus, AgeRestriction, TicketStatus } from '../enum';

describe('Enums', () => {
  describe('UserRole', () => {
    it('should have correct values', () => {
      expect(UserRole.Participant).toBe('participant');
      expect(UserRole.Organizer).toBe('organisateur');
      expect(UserRole.Admin).toBe('administrateur');
    });

    it('should have all expected roles', () => {
      const roles = Object.values(UserRole);
      expect(roles).toHaveLength(3);
      expect(roles).toContain('participant');
      expect(roles).toContain('organisateur');
      expect(roles).toContain('administrateur');
    });
  });

  describe('VerificationStatus', () => {
    it('should have correct values', () => {
      expect(VerificationStatus.NonVerified).toBe('non vérifié');
      expect(VerificationStatus.Pending).toBe('en cours de vérification');
      expect(VerificationStatus.Verified).toBe('verifié');
    });

    it('should have all expected statuses', () => {
      const statuses = Object.values(VerificationStatus);
      expect(statuses).toHaveLength(3);
    });
  });

  describe('AgeRestriction', () => {
    it('should have correct values', () => {
      expect(AgeRestriction.None).toBe('aucune');
      expect(AgeRestriction.Eighteen).toBe('18+');
    });
  });

  describe('TicketStatus', () => {
    it('should have correct values', () => {
      expect(TicketStatus.Valid).toBe('valid');
      expect(TicketStatus.Used).toBe('used');
      expect(TicketStatus.Refunded).toBe('refunded');
    });

    it('should have all ticket statuses', () => {
      const statuses = Object.values(TicketStatus);
      expect(statuses).toHaveLength(3);
    });
  });
});
