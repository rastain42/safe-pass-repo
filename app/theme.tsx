import { create } from 'zustand';
import { StyleSheet } from 'react-native';

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