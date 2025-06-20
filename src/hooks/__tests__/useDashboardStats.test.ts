import { renderHook, waitFor } from '@testing-library/react-native';
import { useDashboardStats } from '../useDashboardStats';

// Mock les services
jest.mock('@/services/events/event.service', () => ({
  getMyEvents: jest.fn(() => Promise.resolve([])),
  getEventTickets: jest.fn(() => Promise.resolve([])),
}));

jest.mock('@/config/firebase', () => ({
  auth: {
    currentUser: { uid: 'test-user-id' },
  },
}));

describe('useDashboardStats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useDashboardStats());

    expect(result.current.loading).toBe(true);
    expect(result.current.stats).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('should calculate stats correctly', async () => {
    const { result } = renderHook(() => useDashboardStats());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Vérifier que les stats sont calculées (même si vides dans ce mock)
    expect(result.current.stats).toBeDefined();
  });
});
