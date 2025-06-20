import { validateEmail, validatePhoneNumber } from '../validators';

describe('Validators', () => {
  describe('validateEmail', () => {
    it('returns true for valid emails', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name+tag@domain.co.uk')).toBe(true);
      expect(validateEmail('simple@domain.org')).toBe(true);
    });

    it('returns false for invalid emails', () => {
      expect(validateEmail('')).toBe(false);
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('test.domain.com')).toBe(false);
      expect(validateEmail('test..email@domain.com')).toBe(false);
    });

    it('handles edge cases', () => {
      expect(validateEmail('test@domain')).toBe(false);
      expect(validateEmail('test @domain.com')).toBe(false);
      expect(validateEmail('test@domain .com')).toBe(false);
    });
  });

  describe('validatePhoneNumber', () => {
    it('returns true for valid French phone numbers', () => {
      expect(validatePhoneNumber('0123456789')).toBe(true);
      expect(validatePhoneNumber('+33123456789')).toBe(true);
      expect(validatePhoneNumber('01 23 45 67 89')).toBe(true);
      expect(validatePhoneNumber('+33 1 23 45 67 89')).toBe(true);
    });

    it('returns false for invalid phone numbers', () => {
      expect(validatePhoneNumber('')).toBe(false);
      expect(validatePhoneNumber('123')).toBe(false);
      expect(validatePhoneNumber('0023456789')).toBe(false); // Starts with 00
      expect(validatePhoneNumber('1234567890')).toBe(false); // Doesn't start with 0 or +33
      expect(validatePhoneNumber('01234567890')).toBe(false); // Too many digits
      expect(validatePhoneNumber('012345678')).toBe(false); // Too few digits
    });

    it('handles phone numbers with spaces', () => {
      expect(validatePhoneNumber('01 23 45 67 89')).toBe(true);
      expect(validatePhoneNumber('+33 1 23 45 67 89')).toBe(true);
      expect(validatePhoneNumber('0 1 2 3 4 5 6 7 8 9')).toBe(true);
    });

    it('rejects international numbers that are not French', () => {
      expect(validatePhoneNumber('+1234567890')).toBe(false);
      expect(validatePhoneNumber('+441234567890')).toBe(false);
    });
  });
});
