import { create } from 'zustand';

type ColorScheme = 'light' | 'dark';

interface ColorSchemeStore {
  colorScheme: ColorScheme;
  toggleColorScheme: () => void;
}

export const useColorScheme = create<ColorSchemeStore>((set) => ({
  colorScheme: 'dark',
  toggleColorScheme: () =>
    set((state) => ({
      colorScheme: state.colorScheme === 'light' ? 'dark' : 'light'
    })),
}));

// Export par défaut pour satisfaire Expo Router
export default function ThemeScreen() {
  return null;
}