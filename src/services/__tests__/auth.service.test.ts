import { auth } from '@/config/firebase';

// Mock d'un service d'authentification simple
const authService = {
  signIn: async (email: string, password: string) => {
    if (email && password) {
      return { user: { uid: 'test-id', email } };
    }
    throw new Error('Invalid credentials');
  },

  signUp: async (email: string, password: string) => {
    if (email && password) {
      return { user: { uid: 'new-test-id', email } };
    }
    throw new Error('Invalid data');
  },

  signOut: async () => {
    return Promise.resolve();
  },
};

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signIn', () => {
    it('should sign in with valid credentials', async () => {
      const result = await authService.signIn('test@example.com', 'password123');

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.uid).toBe('test-id');
    });

    it('should throw error with invalid credentials', async () => {
      await expect(authService.signIn('', '')).rejects.toThrow('Invalid credentials');
    });
  });

  describe('signUp', () => {
    it('should create new user account', async () => {
      const result = await authService.signUp('new@example.com', 'newpassword');

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('new@example.com');
      expect(result.user.uid).toBe('new-test-id');
    });

    it('should throw error with invalid data', async () => {
      await expect(authService.signUp('', '')).rejects.toThrow('Invalid data');
    });
  });

  describe('signOut', () => {
    it('should sign out successfully', async () => {
      await expect(authService.signOut()).resolves.toBeUndefined();
    });
  });
});
