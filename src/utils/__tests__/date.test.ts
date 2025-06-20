import {
  formatEventDate,
  formatEventTime,
  formatEventDateTime,
  formatPrice,
  isEventOngoing,
  isEventPast,
} from '../date';

describe('Date utilities', () => {
  describe('formatEventDate', () => {
    it('formats date correctly', () => {
      const date = new Date('2023-12-25T10:30:00');
      const formatted = formatEventDate(date);
      expect(formatted).toContain('25');
      expect(formatted).toContain('2023');
    });
  });

  describe('formatEventTime', () => {
    it('formats time correctly', () => {
      const date = new Date('2023-12-25T14:30:00');
      const formatted = formatEventTime(date);
      expect(formatted).toBe('14:30');
    });

    it('handles single digit time values', () => {
      const date = new Date('2023-12-25T09:05:00');
      const formatted = formatEventTime(date);
      expect(formatted).toBe('09:05');
    });
  });

  describe('formatEventDateTime', () => {
    it('formats date and time correctly', () => {
      const date = new Date('2023-12-25T14:30:00');
      const formatted = formatEventDateTime(date);
      expect(formatted).toContain('25');
      expect(formatted).toContain('2023');
      expect(formatted).toContain('14:30');
    });
  });

  describe('formatPrice', () => {
    it('formats price with euro symbol', () => {
      expect(formatPrice(100)).toBe('100€');
      expect(formatPrice(50.5)).toBe('50.5€');
      expect(formatPrice(0)).toBe('0€');
    });
  });

  describe('isEventOngoing', () => {
    it('returns true when current time is between start and end', () => {
      const now = new Date();
      const startDate = new Date(now.getTime() - 1000 * 60 * 60); // 1 hour ago
      const endDate = new Date(now.getTime() + 1000 * 60 * 60); // 1 hour from now

      expect(isEventOngoing(startDate, endDate)).toBe(true);
    });

    it('returns false when current time is before start', () => {
      const now = new Date();
      const startDate = new Date(now.getTime() + 1000 * 60 * 60); // 1 hour from now
      const endDate = new Date(now.getTime() + 1000 * 60 * 60 * 2); // 2 hours from now

      expect(isEventOngoing(startDate, endDate)).toBe(false);
    });

    it('returns false when current time is after end', () => {
      const now = new Date();
      const startDate = new Date(now.getTime() - 1000 * 60 * 60 * 2); // 2 hours ago
      const endDate = new Date(now.getTime() - 1000 * 60 * 60); // 1 hour ago

      expect(isEventOngoing(startDate, endDate)).toBe(false);
    });
  });

  describe('isEventPast', () => {
    it('returns true for past events', () => {
      const pastDate = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
      expect(isEventPast(pastDate)).toBe(true);
    });

    it('returns false for future events', () => {
      const futureDate = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now
      expect(isEventPast(futureDate)).toBe(false);
    });
  });
});
