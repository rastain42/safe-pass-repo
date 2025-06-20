import '@testing-library/jest-native/extend-expect';

// Mock React Native Gesture Handler (si disponible)
try {
  require('react-native-gesture-handler/jestSetup');
} catch (error) {
  // Module non disponible, on continue sans
}

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Firebase
jest.mock('@/config/firebase', () => ({
  auth: {
    currentUser: null,
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChanged: jest.fn(),
  },
  db: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      })),
      add: jest.fn(),
      where: jest.fn(),
      orderBy: jest.fn(),
      limit: jest.fn(),
    })),
  },
  storage: {
    ref: jest.fn(() => ({
      put: jest.fn(),
      getDownloadURL: jest.fn(),
    })),
  },
}));

// Mock Expo modules
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  Stack: { Screen: () => null },
}));

// Mock React Native Reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialIcons: 'MaterialIcons',
  FontAwesome: 'FontAwesome',
  AntDesign: 'AntDesign',
  Feather: 'Feather',
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

// Mock Stripe
jest.mock('@stripe/stripe-react-native', () => ({
  useStripe: () => ({
    confirmPayment: jest.fn(),
    createPaymentMethod: jest.fn(),
    initPaymentSheet: jest.fn(),
    presentPaymentSheet: jest.fn(),
  }),
  StripeProvider: ({ children }) => children,
  CardField: 'CardField',
}));

// Mock Camera
jest.mock('expo-camera', () => ({
  Camera: {
    requestCameraPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
    getCameraPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  },
}));

// Mock Image Picker
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  launchImageLibraryAsync: jest.fn(() => Promise.resolve({ cancelled: false, assets: [] })),
  launchCameraAsync: jest.fn(() => Promise.resolve({ cancelled: false, assets: [] })),
}));

// Mock Secure Store
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

// Mock global fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    status: 200,
  })
);
