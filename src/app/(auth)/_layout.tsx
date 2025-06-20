import { Stack } from 'expo-router';
import { useColorScheme } from '@/components/basic/useColorScheme';

export default function AuthLayout() {
  const colorScheme = useColorScheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colorScheme === 'dark' ? '#000' : '#fff',
        },
        headerTintColor: colorScheme === 'dark' ? '#fff' : '#000',
        contentStyle: {
          backgroundColor: colorScheme === 'dark' ? '#000' : '#fff',
        },
        headerShown: false,
      }}
    >
      <Stack.Screen name='Login' options={{ headerShown: false }} />
      <Stack.Screen name='Register' options={{ headerShown: false }} />
    </Stack>
  );
}
